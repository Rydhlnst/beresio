import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DeltaBadgeProps {
    value: number;
    isPositive: boolean;
    suffix?: string;
    className?: string;
}

export function DeltaBadge({ value, isPositive, suffix = "%", className }: DeltaBadgeProps) {
    return (
        <span className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-semibold",
            isPositive ? "text-primary" : "text-muted-foreground",
            className
        )}>
            {isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />
            }
            {isPositive ? "+" : ""}{value}{suffix}
        </span>
    );
}
