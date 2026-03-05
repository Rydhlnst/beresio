"use client"

import { Wifi } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

interface BrowserMockupProps {
    children: React.ReactNode
    url?: string
    className?: string
    innerClassName?: string
}

export function BrowserMockup({
    children,
    url = "app.beres.io",
    className,
    innerClassName
}: BrowserMockupProps) {
    return (
        <div className={cn(
            "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/80",
            className
        )}>
            {/* Browser bar */}
            <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
                <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400/70" />
                    <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                    <div className="h-3 w-3 rounded-full bg-primary/70" />
                </div>
                <div className="flex h-6 flex-1 items-center gap-2 rounded-md bg-white border border-gray-200 px-3">
                    <Wifi className="h-3 w-3 text-gray-300" />
                    <span className="text-[11px] text-gray-400">{url}</span>
                </div>
            </div>

            {/* Content area */}
            <div className={cn("relative bg-white", innerClassName)}>
                {children}
            </div>
        </div>
    )
}
