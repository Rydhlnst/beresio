"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildSafeApiUrl, buildSafeWebSocketUrl } from "@/lib/safe-api-url";
import {
    emitFnbRealtimeEvent,
    FNB_REALTIME_STREAMS,
    type FnbRealtimeClientEvent,
    type FnbRealtimeStream,
} from "./fnb-realtime-events";

const FNB_CONNECTED_TYPES = new Set(["connected", "ping", "pong"]);

function getBranchQuery(branchId: string | null) {
    if (!branchId) return "";
    return `?branchId=${encodeURIComponent(branchId)}`;
}

function getFnbWsUrl(stream: FnbRealtimeStream, branchId: string | null) {
    const path = `/api/dashboard/fnb/ws/${stream}${getBranchQuery(branchId)}`;
    return buildSafeWebSocketUrl(path);
}

function getFnbSseUrl(stream: FnbRealtimeStream, branchId: string | null) {
    return buildSafeApiUrl(`/api/dashboard/fnb/streams/${stream}${getBranchQuery(branchId)}`);
}

type FnbLiveRefreshClientProps = {
    businessType?: string | null;
};

export function FnbLiveRefreshClient({ businessType }: FnbLiveRefreshClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const refreshTimerRef = useRef<number | null>(null);
    const lastRefreshAtRef = useRef(0);

    const branchId = useMemo(() => {
        const value = searchParams?.get("branchId");
        if (!value) return null;
        const normalized = value.trim();
        return normalized.length > 0 ? normalized : null;
    }, [searchParams]);

    const shouldEnable = businessType === "fnb";

    useEffect(() => {
        if (!shouldEnable) return;

        let disposed = false;
        const cleanups: Array<() => void> = [];

        const scheduleRefresh = () => {
            if (disposed) return;
            if (refreshTimerRef.current) return;

            const now = Date.now();
            const elapsed = now - lastRefreshAtRef.current;
            const delay = elapsed >= 1_500 ? 0 : 1_500 - elapsed;

            refreshTimerRef.current = window.setTimeout(() => {
                refreshTimerRef.current = null;
                if (disposed) return;
                if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

                lastRefreshAtRef.current = Date.now();
                router.refresh();
            }, delay);
        };

        const shouldAutoRefresh = !(pathname?.startsWith("/order") ?? false);

        const handleRealtimeEvent = (
            stream: FnbRealtimeStream,
            payload: { eventType: string | null; body: Record<string, unknown> | null }
        ) => {
            const detail: FnbRealtimeClientEvent = {
                stream,
                eventType: payload.eventType,
                payload: payload.body,
                receivedAt: Date.now(),
            };
            emitFnbRealtimeEvent(detail);

            if (shouldAutoRefresh && payload.eventType && !FNB_CONNECTED_TYPES.has(payload.eventType)) {
                scheduleRefresh();
            }
        };

        const bindStream = (stream: FnbRealtimeStream) => {
            let socket: WebSocket | null = null;
            let eventSource: EventSource | null = null;
            let fallbackOpened = false;

            const openSseFallback = () => {
                if (disposed || fallbackOpened || eventSource) return;
                fallbackOpened = true;

                const sseUrl = getFnbSseUrl(stream, branchId);
                if (!sseUrl) return;

                eventSource = new EventSource(sseUrl, { withCredentials: true });
                eventSource.addEventListener(stream, () => {
                    handleRealtimeEvent(stream, { eventType: stream, body: null });
                });
                eventSource.addEventListener("message", () => {
                    handleRealtimeEvent(stream, { eventType: stream, body: null });
                });
            };

            const wsUrl = getFnbWsUrl(stream, branchId);
            if (!wsUrl) {
                openSseFallback();
            } else {
                try {
                    socket = new WebSocket(wsUrl);
                    socket.addEventListener("message", (event) => {
                        if (typeof event.data !== "string") return;
                        try {
                            const payload = JSON.parse(event.data) as {
                                eventType?: string;
                                type?: string;
                                payload?: Record<string, unknown>;
                            };
                            const type = payload.eventType ?? payload.type;
                            handleRealtimeEvent(stream, {
                                eventType: type ?? null,
                                body: (payload.payload && typeof payload.payload === "object") ? payload.payload : null,
                            });
                        } catch {
                            // ignore malformed payload
                        }
                    });
                    socket.addEventListener("error", () => {
                        openSseFallback();
                    });
                    socket.addEventListener("close", () => {
                        openSseFallback();
                    });
                } catch {
                    openSseFallback();
                }
            }

            cleanups.push(() => {
                if (socket) {
                    socket.close();
                    socket = null;
                }
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }
            });
        };

        for (const stream of FNB_REALTIME_STREAMS) {
            bindStream(stream);
        }

        const handleVisibility = () => {
            if (shouldAutoRefresh && document.visibilityState === "visible") {
                scheduleRefresh();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);
        cleanups.push(() => {
            document.removeEventListener("visibilitychange", handleVisibility);
        });

        return () => {
            disposed = true;
            if (refreshTimerRef.current) {
                window.clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
            for (const cleanup of cleanups) cleanup();
        };
    }, [shouldEnable, pathname, branchId, router]);

    return null;
}
