import { Skeleton } from "@repo/ui/skeleton";
import { cn } from "@repo/ui/lib/utils";
import { APP_CONTENT_WIDTH } from "./_components/layout-width";

export default function Loading() {
    return (
        <div className="w-full animate-pulse" aria-label="Memuat halaman">
            <section className={cn(APP_CONTENT_WIDTH, "space-y-8 pb-16 pt-14")}>
                <Skeleton className="h-4 w-36" />
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full max-w-3xl" />
                    <Skeleton className="h-12 w-full max-w-2xl" />
                </div>
                <Skeleton className="h-5 w-full max-w-xl" />
                <div className="flex gap-4">
                    <Skeleton className="h-11 w-40" />
                    <Skeleton className="h-11 w-32" />
                </div>
                <Skeleton className="mt-10 h-[360px] w-full" />
            </section>

            <section className="border-y border-border/70 bg-secondary/40">
                <div className={cn(APP_CONTENT_WIDTH, "grid gap-4 py-12 lg:grid-cols-3")}>
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </section>

            <section className={cn(APP_CONTENT_WIDTH, "space-y-4 py-12")}>
                <Skeleton className="h-8 w-56" />
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-11/12" />
                        <Skeleton className="h-5 w-4/5" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-10/12" />
                        <Skeleton className="h-5 w-3/4" />
                    </div>
                </div>
            </section>
        </div>
    );
}
