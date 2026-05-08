"use client";

import dynamic from "next/dynamic";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { DeferredOnViewport } from "@/components/shared/deferred-on-viewport";

type TrendPoint = {
    date: string;
    branchId: string;
    branchName: string;
    revenue: number;
};

type OrdersByTypePoint = {
    type: string;
    total: number;
};

type OrgDashboardChartsDeferredProps = {
    initialTrendByBranch: TrendPoint[];
    initialOrdersByType: OrdersByTypePoint[];
};

function ChartsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard title="Revenue Trend (7 Hari)" className="h-auto min-h-[340px] lg:col-span-2">
                <div className="h-[260px] animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
            </SectionCard>
            <SectionCard title="Orders by Type" className="h-auto min-h-[340px]">
                <div className="h-[260px] animate-pulse rounded-2xl border border-border/60 bg-muted/30" />
            </SectionCard>
        </div>
    );
}

const OrgDashboardChartsLazy = dynamic(
    () => import("./org-dashboard-charts-client").then((mod) => mod.OrgDashboardChartsClient),
    { ssr: false, loading: () => <ChartsSkeleton /> }
);

export function OrgDashboardChartsDeferred(props: OrgDashboardChartsDeferredProps) {
    return (
        <DeferredOnViewport fallback={<ChartsSkeleton />} rootMargin="520px 0px">
            <OrgDashboardChartsLazy {...props} />
        </DeferredOnViewport>
    );
}

