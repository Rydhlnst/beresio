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
            <div className="h-full space-y-3 rounded-2xl border border-border/70 bg-background/95 p-5 shadow-[0_8px_24px_hsl(var(--foreground)/0.05)]">
                <div className="flex items-start justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "h-full space-y-3 rounded-2xl border border-border/70 bg-background/95 p-5 shadow-[0_8px_24px_hsl(var(--foreground)/0.05)]",
                "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_28px_hsl(var(--foreground)/0.08)]"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {label}
                    </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </div>

            <p className="text-2xl font-bold tracking-tight text-foreground">
                {value}
            </p>

            {delta ? (
                <p className={cn("text-xs font-medium", delta.isPositive ? "text-emerald-600" : "text-rose-600")}>
                    {delta.isPositive ? "Naik" : "Turun"} {Math.abs(delta.value)}% vs kemarin
                </p>
            ) : (
                <span className="text-xs text-muted-foreground">vs kemarin</span>
            )}
        </div>
    );
}
