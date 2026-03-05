"use client"

import { cn } from "@repo/ui/lib/utils"

interface SectionProps {
    children: React.ReactNode
    className?: string
    id?: string
    showDivider?: boolean
}

export function Section({ children, className, id, showDivider = true }: SectionProps) {
    return (
        <section
            id={id}
            className={cn(
                "relative bg-background py-32 overflow-hidden",
                className
            )}
        >
            {showDivider && (
                <div className="absolute top-0 left-8 right-8 h-px bg-border/40" />
            )}
            <div className="container relative z-10 px-8">
                {children}
            </div>
        </section>
    )
}
