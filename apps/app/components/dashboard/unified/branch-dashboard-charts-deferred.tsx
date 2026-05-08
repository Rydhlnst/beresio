"use client";

import dynamic from "next/dynamic";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { DeferredOnViewport } from "@/components/shared/deferred-on-viewport";

type HourlyPoint = {
    hour: number;
    revenue: number;
    orderCount: number;
};

type TopProductPoint = {
    name: string;
    quantity: number;
    revenue: number;
};

type BranchDashboardChartsDeferredProps = {
    branchId: string;
    initialHourlySales: HourlyPoint[];
    initialTopProducts: TopProductPoint[];
};

function ChartsSkeleton() {
    return (
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <SectionCard title="Hourly Sales (Hari Ini)" className="h-full min-h-[360px]">
                <div className="h-[280px] animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
            </SectionCard>
            <SectionCard title="Top 5 Products (Minggu Ini)" className="h-full min-h-[360px]">
                <div className="h-[280px] animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
            </SectionCard>
        </div>
    );
}

const BranchDashboardChartsLazy = dynamic(
    () => import("./branch-dashboard-charts-client").then((mod) => mod.BranchDashboardChartsClient),
    { ssr: false, loading: () => <ChartsSkeleton /> }
);

export function BranchDashboardChartsDeferred(props: BranchDashboardChartsDeferredProps) {
    return (
        <DeferredOnViewport fallback={<ChartsSkeleton />} rootMargin="520px 0px">
            <BranchDashboardChartsLazy {...props} />
        </DeferredOnViewport>
    );
}

