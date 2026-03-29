import { cn } from "@repo/ui/lib/utils"

interface SectionProps {
    children: React.ReactNode
    className?: string
    id?: string
    showDivider?: boolean
}

/**
 * Modern Section Component
 * - Consistent align-start layout for all landing page sections
 * - Modern spacing with clamp for responsive scaling
 * - Optional divider between sections
 */
export function Section({ children, className, id, showDivider = true }: SectionProps) {
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

/**
 * Section Header Component
 * - Standardized header layout with align-start
 */
interface SectionHeaderProps {
    overline?: string
    title: React.ReactNode
    description?: string
    className?: string
    align?: "start" | "center"
}

export function SectionHeader({ 
    overline, 
    title, 
    description, 
    className,
    align = "start" 
}: SectionHeaderProps) {
    return (
        <div className={cn(
            "max-w-3xl mb-[clamp(2rem,5vw,4rem)]",
            align === "center" && "mx-auto text-center",
            className
        )}>
            {overline && (
                <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary mb-4">
                    {overline}
                </span>
            )}
            <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-black tracking-tight leading-[1.1] text-foreground">
                {title}
            </h2>
            {description && (
                <p className="mt-4 text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl">
                    {description}
                </p>
            )}
        </div>
    )
}

/**
 * Section Grid Component
 * - Consistent grid layout for card-based sections
 */
interface SectionGridProps {
    children: React.ReactNode
    className?: string
    cols?: 1 | 2 | 3 | 4 | 6
    gap?: "sm" | "md" | "lg"
}

export function SectionGrid({ 
    children, 
    className,
    cols = 3,
    gap = "md"
}: SectionGridProps) {
    const gapClasses = {
        sm: "gap-4",
        md: "gap-6",
        lg: "gap-8"
    }

    const colClasses = {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
    }

    return (
        <div className={cn(
            "grid",
            colClasses[cols],
            gapClasses[gap],
            className
        )}>
            {children}
        </div>
    )
}
