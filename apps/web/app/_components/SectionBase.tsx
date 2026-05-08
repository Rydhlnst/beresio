import { cn } from "@repo/ui/lib/utils";
import { APP_CONTENT_WIDTH } from "./layout-width";

export interface SectionBaseProps {
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    id?: string;
    showDivider?: boolean;
}

export function SectionBase({
    children,
    className,
    contentClassName,
    id,
    showDivider = true,
}: SectionBaseProps) {
    return (
        <section
            id={id}
            className={cn(
                "relative overflow-hidden bg-background py-[clamp(4rem,8vw,8rem)]",
                className
            )}
        >
            {showDivider && (
                <div className="absolute top-0 left-[clamp(1rem,4vw,2rem)] right-[clamp(1rem,4vw,2rem)] h-px bg-border/40" />
            )}
            <div
                className={cn(
                    "relative z-10",
                    APP_CONTENT_WIDTH,
                    contentClassName
                )}
            >
                {children}
            </div>
        </section>
    );
}
