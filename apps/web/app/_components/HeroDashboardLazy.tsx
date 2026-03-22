"use client"

import dynamic from "next/dynamic"

const HeroDashboard = dynamic(
    () => import("./HeroDashboard").then((m) => m.HeroDashboard),
    {
        ssr: false,
        loading: () => (
            <div className="w-full relative py-12 animate-pulse">
                <div className="mx-auto max-w-7xl rounded-[2rem] rounded-b-none bg-muted/50 border border-border/50 h-[clamp(280px,40vw,560px)]" />
            </div>
        ),
    }
)

export function HeroDashboardLazy() {
    return <HeroDashboard />
}
