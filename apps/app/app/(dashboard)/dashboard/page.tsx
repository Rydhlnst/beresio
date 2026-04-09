import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { Metadata } from "next";
import { Badge } from "@repo/ui";
import { Skeleton } from "@repo/ui/skeleton";
import { Suspense } from "react";
import { KPIStrip } from "@/components/dashboard/kpi-strip/kpi-strip";
import { RevenueTrendChart } from "@/components/dashboard/performance/revenue-trend-chart";
import { RevenueBranchChart } from "@/components/dashboard/performance/revenue-branch-chart";
import { RecentOrdersPanel } from "@/components/dashboard/operations/recent-orders-panel";
import { AlertsPanel } from "@/components/dashboard/operations/alerts-panel";
import { OperationsStatusCard } from "@/components/dashboard/operations/operations-status-card";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Pantau bisnis laundry kamu secara real-time",
};

function DashboardGreeting({ name }: { name: string }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Selamat pagi" : hour < 18 ? "Selamat siang" : "Selamat malam";
    const firstName = name.split(" ")[0] ?? "Owner";

    return (
        <div className="rounded-3xl border border-primary/20 bg-secondary/60 p-6 sm:p-7">
            <Badge className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                Ringkasan Owner
            </Badge>
            <h1 className="mt-4 text-balance text-[clamp(1.8rem,4.8vw,2.65rem)] font-semibold leading-[1.04] tracking-tight text-foreground">
                {greeting}, {firstName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Semua metrik utama bisnis kamu sudah dirangkum real-time di sini.
            </p>
        </div>
    );
}

function KPIStripSkeleton() {
    return (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="space-y-3 rounded-2xl border border-border/70 bg-background/95 p-5">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-3 w-20" />
                </div>
            ))}
        </div>
    );
}

function PanelSkeleton({
    title,
    variant = "chart",
}: {
    title: string;
    variant?: "chart" | "list" | "small";
}) {
    return (
        <SectionCard
            title={title}
            className={cn(
                "h-auto",
                variant === "chart" && "min-h-[320px]",
                variant === "list" && "min-h-[360px]",
                variant === "small" && "min-h-[168px]"
            )}
        >
            <div className="space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-40 w-full rounded-xl" />
            </div>
        </SectionCard>
    );
}

export default async function DashboardPage() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL is missing from environment");
    
    const db = createDbNextjs(dbUrl);
    const session = await auth(db).api.getSession({ 
        headers: await headers() 
    });
    
    const userName = session?.user?.name ?? "Owner";
    const activeOrganizationId = (session as any)?.activeOrganizationId ?? null;

    return (
        <div className="space-y-6">
            <DashboardGreeting name={userName} />
            
            {/* Row 1: KPI Cards */}
            <div className="w-full">
                <Suspense fallback={<KPIStripSkeleton />}>
                    <KPIStrip />
                </Suspense>
            </div>

            {/* Row 2: Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2">
                    <Suspense fallback={<PanelSkeleton title="Tren Revenue" />}>
                        <RevenueTrendChart />
                    </Suspense>
                </div>
                <div>
                    <Suspense fallback={<PanelSkeleton title="Revenue per Cabang" />}>
                        <RevenueBranchChart />
                    </Suspense>
                </div>
            </div>

            {/* Row 3: Operational Panel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2">
                    <Suspense fallback={<PanelSkeleton title="Pesanan Terbaru" variant="list" />}>
                        <RecentOrdersPanel />
                    </Suspense>
                </div>
                <div className="space-y-6">
                    <Suspense fallback={<PanelSkeleton title="Perlu Perhatian" variant="small" />}>
                        <AlertsPanel />
                    </Suspense>
                    <Suspense fallback={<PanelSkeleton title="Operasional" variant="small" />}>
                        <OperationsStatusCard organizationId={activeOrganizationId} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
