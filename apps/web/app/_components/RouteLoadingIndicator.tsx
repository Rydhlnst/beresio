"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const START_DELAY_MS = 80;
const MIN_VISIBLE_MS = 220;

function shouldTrackNavigation(anchor: HTMLAnchorElement): boolean {
    const href = anchor.getAttribute("href");
    if (!href) return false;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;

    let nextUrl: URL;
    try {
        nextUrl = new URL(href, window.location.href);
    } catch {
        return false;
    }

    if (nextUrl.origin !== window.location.origin) return false;

    const samePath = nextUrl.pathname === window.location.pathname;
    const sameSearch = nextUrl.search === window.location.search;
    return !(samePath && sameSearch);
}

export function RouteLoadingIndicator() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const routeKey = useMemo(() => {
        const query = searchParams?.toString();
        return query ? `${pathname}?${query}` : pathname;
    }, [pathname, searchParams]);

    const [isPending, setIsPending] = useState(false);
    const startTimerRef = useRef<number | null>(null);
    const hideTimerRef = useRef<number | null>(null);
    const pendingSinceRef = useRef<number>(0);
    const pendingRef = useRef<boolean>(false);

    useEffect(() => {
        pendingRef.current = isPending;
    }, [isPending]);

    useEffect(() => {
        const clearTimers = () => {
            if (startTimerRef.current) {
                window.clearTimeout(startTimerRef.current);
                startTimerRef.current = null;
            }
            if (hideTimerRef.current) {
                window.clearTimeout(hideTimerRef.current);
                hideTimerRef.current = null;
            }
        };

        const beginPending = (immediate = false) => {
            if (pendingRef.current || startTimerRef.current) return;

            const show = () => {
                pendingSinceRef.current = Date.now();
                setIsPending(true);
            };

            if (immediate) {
                show();
                return;
            }

            startTimerRef.current = window.setTimeout(() => {
                startTimerRef.current = null;
                show();
            }, START_DELAY_MS);
        };

        const finishPending = () => {
            if (startTimerRef.current) {
                window.clearTimeout(startTimerRef.current);
                startTimerRef.current = null;
            }

            if (!pendingRef.current) return;

            const elapsed = Date.now() - pendingSinceRef.current;
            const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

            hideTimerRef.current = window.setTimeout(() => {
                hideTimerRef.current = null;
                setIsPending(false);
            }, wait);
        };

        const onDocumentClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const target = event.target as Element | null;
            const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
            if (!anchor || !shouldTrackNavigation(anchor)) return;

            beginPending(false);
        };

        const onPopState = () => {
            beginPending(true);
        };

        window.addEventListener("click", onDocumentClick, true);
        window.addEventListener("popstate", onPopState);

        finishPending();

        return () => {
            window.removeEventListener("click", onDocumentClick, true);
            window.removeEventListener("popstate", onPopState);
            clearTimers();
        };
    }, [routeKey]);

    return (
        <>
            <div
                aria-hidden="true"
                className={isPending ? "route-loading-indicator is-active" : "route-loading-indicator"}
            />
            <p className="sr-only" role="status" aria-live="polite">
                {isPending ? "Memuat halaman baru" : ""}
            </p>
        </>
    );
}
