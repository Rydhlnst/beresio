import { Skeleton } from "@repo/ui/skeleton";
import { SectionCard } from "../shared/section-card";

export function ChartCardSkeleton({ title }: { title: string }) {
    return (
        <SectionCard title={title} className="h-auto min-h-[320px]">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32 rounded-full" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                </div>
            </div>
        </SectionCard>
    );
}
