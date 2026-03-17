import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@repo/ui/skeleton";
import { DeltaBadge } from "../shared/delta-badge";

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
            <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4 min-w-[180px]">
                <div className="flex justify-between items-start">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-16 rounded-full" />
            </div>
        );
    }

    return (
        <div className={cn(
            "relative h-full overflow-hidden rounded-xl border border-border/60 bg-card p-4 space-y-4 min-w-[180px] transition-colors duration-150 ease-out hover:border-border",
            )}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold leading-tight text-muted-foreground">
                    {label}
                </p>
                <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/60",
                )}>
                    <Icon className={cn(
                        "h-4 w-4 text-primary"
                    )} />
                </div>
            </div>

            <p className="text-2xl font-semibold tracking-tight text-foreground">
                {value}
            </p>

            {delta ? (
                <DeltaBadge value={delta.value} isPositive={delta.isPositive} suffix="% vs kemarin" />
            ) : (
                <span className="text-[11px] text-muted-foreground/60">vs kemarin</span>
            )}
        </div>
    );
}
