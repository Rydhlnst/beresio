"use client";

export const FNB_REALTIME_EVENT_NAME = "beresio:fnb-realtime";
export const FNB_REALTIME_STREAMS = ["orders", "kds", "tables"] as const;

export type FnbRealtimeStream = (typeof FNB_REALTIME_STREAMS)[number];

export type FnbRealtimeClientEvent = {
    stream: FnbRealtimeStream;
    eventType: string | null;
    payload: Record<string, unknown> | null;
    receivedAt: number;
};

export function emitFnbRealtimeEvent(detail: FnbRealtimeClientEvent) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent<FnbRealtimeClientEvent>(FNB_REALTIME_EVENT_NAME, { detail }));
}
