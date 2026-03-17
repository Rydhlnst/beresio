import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatSkeletonProps {
    className?: string;
    lines?: number;
}

export function StatSkeleton({ className, lines = 2 }: StatSkeletonProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <Skeleton className="h-6 w-24" />
            {Array.from({ length: lines - 1 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-32" />
            ))}
        </div>
    );
}

export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-xl border border-border/60 bg-card p-4 space-y-4", className)}>
            <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
        </div>
    );
}

export function ChartSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("rounded-xl border border-border/60 bg-card p-4 space-y-4", className)}>
            <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-36 rounded-lg" />
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
        </div>
    );
}
