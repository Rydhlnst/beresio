"use client";

import dynamic from "next/dynamic";
import { cn } from "@repo/ui/lib/utils";
import { APP_CONTENT_WIDTH } from "./layout-width";
import { DeferredOnViewport } from "./DeferredOnViewport";

const SavingsCalculatorLazy = dynamic(
    () => import("./SavingsCalculator").then((module) => module.SavingsCalculator),
    {
        ssr: false,
        loading: () => <SavingsSkeleton title="Memuat kalkulator penghematan..." />,
    }
);

function SavingsSkeleton({ title }: { title: string }) {
    return (
        <section className="border-b border-border/60 py-16 sm:py-20">
            <div className={cn(APP_CONTENT_WIDTH, "animate-pulse space-y-4")}>
                <div className="h-4 w-52 rounded-full bg-secondary/80" />
                <div className="h-8 w-full max-w-2xl rounded-full bg-secondary/80" />
                <div className="h-4 w-full max-w-3xl rounded-full bg-secondary/60" />
                <div className="mt-6 h-56 rounded-2xl border border-border/50 bg-secondary/40" />
                <p className="text-xs text-muted-foreground">{title}</p>
            </div>
        </section>
    );
}

export function LazySavingsSection() {
    return (
        <DeferredOnViewport
            rootMargin="380px 0px"
            fallback={<SavingsSkeleton title="Kalkulator akan dimuat saat Anda mendekati section ini." />}
        >
            <SavingsCalculatorLazy />
        </DeferredOnViewport>
    );
}
