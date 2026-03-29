"use client"

import { cn } from "@repo/ui/lib/utils"

interface SectionProps {
    children: React.ReactNode
    className?: string
    id?: string
    showDivider?: boolean
}

/**
 * Modern Client Section Component
 * - Consistent align-start layout for client-side sections
 * - Matches Section.tsx for consistent styling
 */
export function SectionClient({ children, className, id, showDivider = true }: SectionProps) {
    return (
        <section
            id={id}
            className={cn(
                "relative w-full bg-background",
                "py-[clamp(3rem,6vw,6rem)] lg:py-[clamp(4rem,8vw,8rem)]",
                className
            )}
        >
            {/* Section Divider */}
            {showDivider && (
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            )}
            
            {/* Content Container - align-start by default */}
            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-[clamp(1rem,4vw,3rem)]">
                {children}
            </div>
        </section>
    )
}
