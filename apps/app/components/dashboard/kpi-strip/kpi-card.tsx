import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";

interface KPICardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    delta?: { value: number; isPositive: boolean };
    variant?: "default" | "warning" | "danger";
    isLoading?: boolean;
}

export function KPICard({ label, value, icon: Icon, delta, variant: _variant = "default", isLoading }: KPICardProps) {
    if (isLoading) {
        return (
            <div className="rounded-lg border bg-card p-4 space-y-3 h-full">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                </div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        );
    }

    return (
        <div className={cn(
            "rounded-lg border bg-card p-4 space-y-3 h-full",
            "transition-colors duration-150 hover:bg-secondary/50"
        )}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                    {label}
                </p>
                <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>

            <p className="text-xl font-semibold text-foreground">
                {value}
            </p>

            {delta ? (
                <p className={cn(
                    "text-xs",
                    delta.isPositive ? "text-emerald-600" : "text-rose-600"
                )}>
                    {delta.isPositive ? "↑" : "↓"} {Math.abs(delta.value)}% vs kemarin
                </p>
            ) : (
                <span className="text-xs text-muted-foreground">vs kemarin</span>
            )}
        </div>
    );
}
