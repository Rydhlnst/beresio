import { Skeleton } from "@repo/ui/skeleton";

function MainPanelSkeleton({
    titleWidth = "w-40",
    bodyHeight = "h-[280px]",
}: {
    titleWidth?: string;
    bodyHeight?: string;
}) {
    return (
        <div className="rounded-2xl border border-border/70 bg-background/95">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                <Skeleton className={`h-4 ${titleWidth}`} />
                <Skeleton className="h-8 w-28 rounded-full" />
            </div>
            <div className="p-5">
                <Skeleton className={`${bodyHeight} w-full rounded-xl`} />
            </div>
        </div>
    );
}

export function DashboardContentLoading() {
    return (
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] p-4 lg:p-6">
            <div className="space-y-6">
                <section className="rounded-3xl border border-primary/20 bg-secondary/60 p-6 sm:p-7">
                    <Skeleton className="h-6 w-36 rounded-full" />
                    <Skeleton className="mt-4 h-12 w-[min(560px,85%)]" />
                    <Skeleton className="mt-3 h-5 w-[min(640px,92%)]" />
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-border/70 bg-background/95 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-9 w-9 rounded-xl" />
                            </div>
                            <Skeleton className="mt-4 h-8 w-20" />
                            <Skeleton className="mt-3 h-3 w-16" />
                        </div>
                    ))}
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <MainPanelSkeleton titleWidth="w-36" bodyHeight="h-[300px]" />
                    </div>
                    <div>
                        <MainPanelSkeleton titleWidth="w-40" bodyHeight="h-[300px]" />
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <MainPanelSkeleton titleWidth="w-36" bodyHeight="h-[220px]" />
                    </div>
                    <div className="space-y-6">
                        <MainPanelSkeleton titleWidth="w-32" bodyHeight="h-[84px]" />
                        <MainPanelSkeleton titleWidth="w-28" bodyHeight="h-[84px]" />
                    </div>
                </section>
            </div>
        </div>
    );
}

export function DashboardShellLoading() {
    return (
        <div className="min-h-screen bg-secondary/30">
            <div className="flex h-10 items-center justify-between border-b border-primary/30 bg-primary px-4">
                <Skeleton className="h-4 w-80 bg-primary-foreground/25" />
                <Skeleton className="h-4 w-4 rounded-full bg-primary-foreground/25" />
            </div>

            <div className="flex min-h-[calc(100vh-40px)]">
                <aside className="hidden w-[264px] shrink-0 flex-col border-r border-sidebar-border/70 bg-sidebar/95 md:flex">
                    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border/70 px-4">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>

                    <div className="space-y-3 p-3">
                        <Skeleton className="h-3 w-20" />
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Skeleton key={index} className="h-10 w-full rounded-xl" />
                        ))}
                        <Skeleton className="mt-4 h-3 w-20" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/85 px-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-5 w-48" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-[min(420px,45vw)] rounded-full" />
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-10 w-24 rounded-full" />
                        </div>
                    </header>

                    <main className="overflow-y-auto">
                        <DashboardContentLoading />
                    </main>
                </div>
            </div>
        </div>
    );
}
