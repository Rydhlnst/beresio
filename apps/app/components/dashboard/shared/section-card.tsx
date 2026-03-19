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
            "flex flex-col rounded-lg border bg-card overflow-hidden h-full",
            className
        )}>
            {(title || actions) && (
                <div className="flex items-center justify-between gap-4 px-4 h-14 border-b shrink-0">
                    <div className="min-w-0">
                        {title && (
                            <h3 className="text-sm font-medium text-foreground truncate">{title}</h3>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground truncate">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex-shrink-0">{actions}</div>}
                </div>
            )}
            <div className="flex-1 p-4 min-h-0 overflow-hidden">
                {children}
            </div>
        </div>
    );
}
