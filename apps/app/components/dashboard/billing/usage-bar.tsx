import { cn } from "@/lib/utils";
import { Progress } from "@repo/ui/progress";

interface UsageBarProps {
    label: string;
    used: number;
    max: number;
    className?: string;
}

export function UsageBar({ label, used, max, className }: UsageBarProps) {
    const pct = Math.round((used / max) * 100);

    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold text-foreground">
                    {used}/{max}
                </span>
            </div>
            <Progress
                value={pct}
                className={cn(
                    "h-2 rounded-full",
                    "[&>div]:bg-primary"
                )}
            />
        </div>
    );
}
