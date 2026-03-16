"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded sections dengan ssr: false.
 * Harus berada di Client Component karena Next.js melarang
 * ssr: false di dalam dynamic() yang dipanggil dari Server Component.
 */

export const ValueProposition = dynamic(
    () => import("./ValueProposition").then((m) => m.ValueProposition),
    {
        ssr: false,
        loading: () => (
            <section className="px-6 sm:px-10 py-24 animate-pulse">
                <div className="max-w-7xl mx-auto">
                    <div className="h-4 w-40 rounded-full bg-muted mb-4" />
                    <div className="h-12 w-2/3 rounded-lg bg-muted mb-12" />
                    <div className="h-[480px] rounded-[32px] bg-muted" />
                </div>
            </section>
        ),
    }
);

export const SavingsCalculator = dynamic(
    () => import("./SavingsCalculator").then((m) => m.SavingsCalculator),
    {
        ssr: false,
        loading: () => (
            <section className="px-6 sm:px-10 py-24 animate-pulse">
                <div className="max-w-3xl mx-auto">
                    <div className="h-4 w-36 rounded-full bg-muted mb-4" />
                    <div className="h-10 w-1/2 rounded-lg bg-muted mb-8" />
                    <div className="h-80 rounded-2xl bg-muted" />
                </div>
            </section>
        ),
    }
);
