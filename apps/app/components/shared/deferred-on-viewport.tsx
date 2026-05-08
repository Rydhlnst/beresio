"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type DeferredOnViewportProps = {
    children: ReactNode;
    fallback: ReactNode;
    rootMargin?: string;
};

export function DeferredOnViewport({
    children,
    fallback,
    rootMargin = "320px 0px",
}: DeferredOnViewportProps) {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isVisible) return;
        const element = containerRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry?.isIntersecting) return;
                setIsVisible(true);
                observer.disconnect();
            },
            { rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [isVisible, rootMargin]);

    return <div ref={containerRef}>{isVisible ? children : fallback}</div>;
}

