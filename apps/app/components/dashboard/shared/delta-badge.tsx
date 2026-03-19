import { cn } from "@/lib/utils";

interface DeltaBadgeProps {
    value: number;
    isPositive: boolean;
    suffix?: string;
    className?: string;
}

export function DeltaBadge({ value, isPositive, suffix = "%", className }: DeltaBadgeProps) {
    return (
        <span className={cn(
            "text-xs font-medium",
            isPositive ? "text-emerald-600" : "text-rose-600",
            className
        )}>
            {isPositive ? "↑" : "↓"} {Math.abs(value)}{suffix}
        </span>
    );
}
