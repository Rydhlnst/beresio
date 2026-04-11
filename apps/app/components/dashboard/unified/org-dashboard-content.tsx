import Link from "next/link";
import { headers } from "next/headers";
import { Activity } from "lucide-react";
import { Badge } from "@repo/ui/badge";

import { apiClient } from "@/lib/api-client";
import { KPIStrip } from "@/components/dashboard/kpi-strip/kpi-strip";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { BranchComparisonTableClient } from "./branch-comparison-table-client";
import { OrgDashboardChartsClient } from "./org-dashboard-charts-client";

type OrgDashboardContentProps = {
    orgSlug: string;
};

function toRelativeTime(value: string | Date | null | undefined) {
    if (!value) return "-";
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return "-";
    const diffMs = Date.now() - time;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return "baru saja";
    if (diffMinutes < 60) return `${diffMinutes}m lalu`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}h lalu`;
}

export async function OrgDashboardContent({ orgSlug }: OrgDashboardContentProps) {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get("cookie") || "";

    const [branchesRes, trendByBranchRes, ordersByTypeRes, activitiesRes] = await Promise.all([
        (apiClient as any).api.dashboard.performance.branches.$get(undefined, { headers: { cookie } }),
        (apiClient as any).api.dashboard.performance["trend-by-branch"].$get(
            { query: { timeRange: "7d" } },
            { headers: { cookie } }
        ),
        (apiClient as any).api.dashboard.performance["orders-by-type"].$get(undefined, { headers: { cookie } }),
        (apiClient as any).api.dashboard.activities.$get({ query: { limit: "12" as any } }, { headers: { cookie } }),
    ]);

    const branchesBody = branchesRes.ok ? await branchesRes.json().catch(() => null) : null;
    const trendByBranchBody = trendByBranchRes.ok ? await trendByBranchRes.json().catch(() => null) : null;
    const ordersByTypeBody = ordersByTypeRes.ok ? await ordersByTypeRes.json().catch(() => null) : null;
    const activitiesBody = activitiesRes.ok ? await activitiesRes.json().catch(() => null) : null;

    const branchRows = ((branchesBody as any)?.data ?? []) as Array<{
        branchId: string;
        branchCode: string;
        branchName: string;
        isActive: boolean;
        revenue: number;
        orderCount: number;
    }>;
    const trendByBranch = ((trendByBranchBody as any)?.data ?? []) as Array<{
        date: string;
        branchId: string;
        branchName: string;
        revenue: number;
    }>;
    const ordersByType = ((ordersByTypeBody as any)?.data ?? []) as Array<{ type: string; total: number }>;
    const activities = ((activitiesBody as any)?.data ?? []) as Array<{
        id: string;
        type: string;
        description: string;
        createdAt: string;
        actorName?: string | null;
        metadata?: string | null;
        entityId?: string | null;
    }>;

    const comparisonRows = branchRows.map((row) => ({
        ...row,
        quickLink: `/branch/${orgSlug}/${String(row.branchCode ?? "").toLowerCase()}`,
    }));

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-border/70 bg-card p-5">
                <Badge variant="outline" className="text-[11px] font-semibold uppercase tracking-wide">
                    Organization Dashboard
                </Badge>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    Ringkasan lintas cabang
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Monitoring real-time untuk seluruh cabang di organisasi.
                </p>
            </section>

            <KPIStrip scope="organization" />

            <BranchComparisonTableClient rows={comparisonRows} />

            <OrgDashboardChartsClient
                initialTrendByBranch={trendByBranch}
                initialOrdersByType={ordersByType}
            />

            <SectionCard title="Activity Feed" description="Event terbaru dari semua cabang.">
                <div className="space-y-3">
                    {activities.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Activity className="h-4 w-4" />
                            Belum ada aktivitas terbaru.
                        </div>
                    ) : (
                        activities.map((item) => {
                            const relatedBranch = comparisonRows.find((row) => row.branchId === item.entityId);
                            return (
                                <div key={item.id} className="rounded-xl border border-border/60 bg-background/70 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">{item.type}</p>
                                        <p className="text-xs text-muted-foreground">{toRelativeTime(item.createdAt)}</p>
                                    </div>
                                    <p className="mt-1 text-sm text-foreground">{item.description}</p>
                                    {item.actorName ? (
                                        <p className="mt-1 text-xs text-muted-foreground">oleh {item.actorName}</p>
                                    ) : null}
                                    {relatedBranch ? (
                                        <div className="mt-2">
                                            <Link
                                                href={`/branch/${orgSlug}/${relatedBranch.branchCode.toLowerCase()}`}
                                                className="text-xs font-semibold text-primary hover:underline"
                                            >
                                                Buka cabang terkait
                                            </Link>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })
                    )}
                </div>
            </SectionCard>
        </div>
    );
}
