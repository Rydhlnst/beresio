import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center py-10 px-4 text-center",
            className
        )}>
            {Icon && (
                <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-muted-foreground/50" />
                </div>
            )}
            <p className="text-sm font-semibold text-foreground/70">{title}</p>
            {description && (
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
