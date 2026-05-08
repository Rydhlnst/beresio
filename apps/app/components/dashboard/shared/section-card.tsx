import { cn } from "@/lib/utils";

interface SectionCardProps {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function SectionCard({ title, description, actions, children, className }: SectionCardProps) {
    return (
        <div className={cn(
            "flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_14px_40px_hsl(var(--foreground)/0.05)]",
            className
        )}>
            {(title || actions) && (
                <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 px-5">
                    <div className="min-w-0">
                        {title && (
                            <h3 className="flex items-center gap-2 truncate text-sm font-semibold tracking-tight text-foreground">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                <span className="truncate">{title}</span>
                            </h3>
                        )}
                        {description && (
                            <p className="truncate pt-0.5 text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex-shrink-0">{actions}</div>}
                </div>
            )}
            <div className="min-h-0 flex-1 overflow-hidden p-5">
                {children}
            </div>
        </div>
    );
}
