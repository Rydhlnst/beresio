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
            "flex h-full flex-col rounded-xl border border-border/60 bg-card overflow-hidden",
            "[--card-h:360px] [--card-header-h:56px] min-h-[var(--card-h)] max-h-[var(--card-h)]",
            className
        )}>
            {(title || actions) && (
                <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border/40 min-h-[var(--card-header-h)] max-h-[var(--card-header-h)]">
                    <div>
                        {title && (
                            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground mt-2">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex-shrink-0">{actions}</div>}
                </div>
            )}
            <div className="flex-1 min-h-0 p-6 flex flex-col">
                {children}
            </div>
        </div>
    );
}
