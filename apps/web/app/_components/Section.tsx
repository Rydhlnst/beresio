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
                "relative bg-background py-[clamp(4rem,8vw,8rem)] overflow-hidden",
                className
            )}
        >
            {showDivider && (
                <div className="absolute top-0 left-[clamp(1rem,4vw,2rem)] right-[clamp(1rem,4vw,2rem)] h-px bg-border/40" />
            )}
            <div className="container relative z-10 px-[clamp(1rem,4vw,3rem)]">
                {children}
            </div>
        </section>
    )
}
