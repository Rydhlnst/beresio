import Link from "next/link";
import { headers } from "next/headers";
import type { ComponentType } from "react";
import { ArrowRight, ChefHat, ClipboardList, ClipboardPlus, Clock, PackageCheck, Store, Truck } from "lucide-react";
import { Badge } from "@repo/ui/badge";

import { apiClient } from "@/lib/api-client";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { KPIStrip } from "@/components/dashboard/kpi-strip/kpi-strip";
import { ActiveBranchSync } from "@/components/dashboard/layout/active-branch-sync";
import { BranchDashboardChartsDeferred } from "./branch-dashboard-charts-deferred";

const BRANCH_DASHBOARD_FETCH_TIMEOUT_MS = 7000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
        return await Promise.race([
            promise,
            new Promise<null>((resolve) => {
                timer = setTimeout(() => resolve(null), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

type BranchDashboardContentProps = {
    branchId: string;
    branchCode: string;
    branchName: string;
    roleSlug: string | null;
    mode: "single" | "multi";
};

type QuickAction = {
    key: string;
    label: string;
    description: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
};

function resolveQuickActions(roleSlug: string | null, businessType: string | null | undefined): QuickAction[] {
    const role = roleSlug?.toLowerCase() ?? "";

    if (businessType === "laundry") {
        const base: QuickAction[] = [
            {
                key: "order-create",
                label: "Buat Pesanan Baru",
                description: "Tambah order baru untuk pelanggan",
                href: "/order/create",
                icon: ClipboardPlus,
            },
            {
                key: "order-incoming",
                label: "Order Masuk",
                description: "Lihat order baru masuk",
                href: "/order?status=received",
                icon: ClipboardList,
            },
            {
                key: "order-processing",
                label: "Sedang Dicuci",
                description: "Pantau order yang sedang diproses",
                href: "/order?status=in_process",
                icon: Clock,
            },
            {
                key: "order-ready",
                label: "Siap Diambil/Diantar",
                description: "Order siap pickup/delivery",
                href: "/order?status=ready_pickup",
                icon: PackageCheck,
            },
            {
                key: "delivery-queue",
                label: "Delivery Queue",
                description: "Kelola pengiriman aktif",
                href: "/pickup",
                icon: Truck,
            },
        ];

        if (role === "kitchen") {
            return base.filter((action) => action.key !== "order-create");
        }

        if (role === "fulfillment_manager") {
            return base.filter((action) => action.key !== "order-incoming");
        }

        return base;
    }

    const retailCreate: QuickAction = {
        key: "pos-new",
        label: "Transaksi Baru",
        description: "Mulai transaksi baru di POS",
        href: "/order",
        icon: Store,
    };

    const retailKitchenQueue: QuickAction = {
        key: "kitchen",
        label: "Order Queue",
        description: "Lihat pesanan masuk dan status",
        href: "/order",
        icon: ChefHat,
    };

    if (role === "branch_manager") {
        return [
            retailCreate,
            { key: "orders", label: "Pantau Order", description: "Lihat order & status terbaru", href: "/order", icon: ClipboardList },
            retailKitchenQueue,
        ];
    }
    if (role === "cashier") {
        return [retailCreate];
    }
    if (role === "kitchen") {
        return [retailKitchenQueue];
    }
    if (role === "fulfillment_manager") {
        return [retailKitchenQueue];
    }
    return [retailCreate];
}

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

export async function BranchDashboardContent({
    branchId,
    branchCode,
    branchName,
    roleSlug,
    mode,
}: BranchDashboardContentProps) {
    const activeOrg = await getActiveOrganizationContext();
    const reqHeaders = await headers();
    const cookie = reqHeaders.get("cookie") || "";

    const [overviewRes] = await Promise.all([
        withTimeout<Response>(
            (apiClient as any).api.dashboard.performance["branch-overview"].$get(
                { query: { branchId, topLimit: "5" as any, activityLimit: "10" as any } },
                { headers: { cookie } }
            ) as Promise<Response>,
            BRANCH_DASHBOARD_FETCH_TIMEOUT_MS
        ),
    ]);

    const overviewBody = overviewRes?.ok ? await overviewRes.json().catch(() => null) : null;

    const hourlySales = (((overviewBody as any)?.data?.hourlySales ?? []) as Array<{ hour: number; revenue: number; orderCount: number }>);
    const topProducts = (((overviewBody as any)?.data?.topProducts ?? []) as Array<{ name: string; quantity: number; revenue: number }>);
    const activities = (((overviewBody as any)?.data?.activities ?? []) as Array<{
        id: string;
        type: string;
        description: string;
        createdAt: string;
        actorName?: string | null;
    }>);

    const quickActions = resolveQuickActions(roleSlug, activeOrg?.businessType);

    return (
        <div className="space-y-6">
            <ActiveBranchSync branchId={branchId} />

            <section className="rounded-2xl border border-border/70 bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[11px] font-semibold uppercase tracking-wide">
                        {mode === "single" ? "Single Branch" : "Branch Dashboard"}
                    </Badge>
                    <Badge variant="secondary" className="text-[11px]">
                        {branchCode.toUpperCase()}
                    </Badge>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{branchName}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Metrik cabang real-time untuk operasional harian.
                </p>
            </section>

            <KPIStrip branchId={branchId} scope="branch" />

            <SectionCard title="Quick Actions" description="Akses cepat sesuai role tim cabang.">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {quickActions.map((action) => (
                        <Link
                            key={action.key}
                            href={action.href}
                            className="group rounded-xl border border-border/70 bg-background/70 p-4 transition hover:border-primary/50 hover:bg-primary/5"
                        >
                            <action.icon className="h-4 w-4 text-primary" />
                            <p className="mt-3 text-sm font-semibold text-foreground">{action.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                            <div className="mt-3 flex items-center text-xs font-semibold text-primary">
                                Buka
                                <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ))}
                </div>
            </SectionCard>

            <BranchDashboardChartsDeferred
                branchId={branchId}
                initialHourlySales={hourlySales}
                initialTopProducts={topProducts}
            />

            <SectionCard title="Recent Activity" description="Aktivitas terbaru cabang ini.">
                <div className="space-y-3">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada aktivitas terbaru.</p>
                    ) : (
                        activities.map((item) => (
                            <div key={item.id} className="rounded-xl border border-border/60 bg-background/70 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                                        {item.type}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{toRelativeTime(item.createdAt)}</p>
                                </div>
                                <p className="mt-1 text-sm text-foreground">{item.description}</p>
                                {item.actorName ? (
                                    <p className="mt-1 text-xs text-muted-foreground">oleh {item.actorName}</p>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>
            </SectionCard>
        </div>
    );
}
