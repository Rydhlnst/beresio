import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { LaundryOverviewClient } from "./_components/laundry-overview-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
    title: "Laundry Dashboard",
    description: "Ringkasan operasional laundry dengan polling KPI real-time.",
};

export default async function LaundryPage() {
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) redirect("/login");
    if (activeOrg.businessType !== "laundry") redirect("/");

    const rpc = apiClient as any;
    const cookie = (await headers()).get("cookie") || "";
    const [summaryRes, statusRes, outstandingRes] = await Promise.all([
        rpc.api.dashboard.laundry.reports.summary.$get(undefined, { headers: { cookie } }),
        rpc.api.dashboard.laundry.reports["orders-by-status"].$get(undefined, { headers: { cookie } }),
        rpc.api.dashboard.laundry.reports["outstanding-payments"].$get(
            { query: { limit: "10" } },
            { headers: { cookie } }
        ),
    ]);

    if (!summaryRes.ok || !statusRes.ok || !outstandingRes.ok) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Laundry Overview</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Ringkasan operasional laundry harian.
                    </p>
                </div>
                <PageErrorState
                    title="Gagal memuat dashboard laundry"
                    description="Coba muat ulang halaman atau periksa koneksi backend."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const summaryBody = await summaryRes.json().catch(() => ({}));
    const statusBody = await statusRes.json().catch(() => ({}));
    const outstandingBody = await outstandingRes.json().catch(() => ({}));

    return (
        <LaundryOverviewClient
            initialSummary={(summaryBody as any)?.data ?? {
                totalRevenue: 0,
                totalOrders: 0,
                completedOrders: 0,
                cancelledOrders: 0,
                cancellationRate: 0,
                outstandingAmount: 0,
            }}
            initialByStatus={(statusBody as any)?.data ?? []}
            initialOutstanding={(outstandingBody as any)?.data ?? []}
            enableSse={process.env.NEXT_PUBLIC_LAUNDRY_SSE === "true"}
        />
    );
}

