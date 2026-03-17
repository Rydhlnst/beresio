import { cn } from "@/lib/utils";
import { AlertTriangle, type LucideIcon } from "lucide-react";

interface ErrorStateProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    icon?: LucideIcon;
    className?: string;
}

export function ErrorState({
    title,
    description,
    action,
    icon: Icon = AlertTriangle,
    className
}: ErrorStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center gap-2 py-10 px-4 text-center",
            className
        )}>
            <div className="h-12 w-12 rounded-xl border border-border/60 bg-muted/50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && (
                <p className="text-xs text-muted-foreground max-w-[240px]">{description}</p>
            )}
            {action && <div className="mt-3">{action}</div>}
        </div>
    );
}

export type { ErrorStateProps };
