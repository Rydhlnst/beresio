import { Metadata } from "next";
import { ReportsPageClient } from "./_components/reports-page-client";
import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { getActiveOrganizationContext } from "@/lib/organization-context";

export const metadata: Metadata = {
    title: "Laporan",
    description: "Source of truth untuk keputusan finansial dan operasional",
};

export default async function LaporanPage() {
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) {
        redirect("/login");
    }
    if (activeOrg.businessType === "laundry") {
        redirect("/laundry/reports");
    }

    const cookie = (await headers()).get("cookie") || "";

    // Fetch initial data with "today" range
    const [summaryRes, tableRes, branchesRes] = await Promise.all([
        apiClient.api.dashboard.reports.summary.$get(
            { query: { range: "today" } },
            { headers: { cookie } }
        ),
        apiClient.api.dashboard.reports.table.$get(
            { query: { range: "today" } },
            { headers: { cookie } }
        ),
        apiClient.api.dashboard.branches.$get(undefined, { headers: { cookie } }),
    ]);

    if (!summaryRes.ok || !tableRes.ok || !branchesRes.ok) {
        console.error("Failed to fetch reports data:", {
            summary: !summaryRes.ok ? await summaryRes.text() : "ok",
            table: !tableRes.ok ? await tableRes.text() : "ok",
            branches: !branchesRes.ok ? await branchesRes.text() : "ok",
        });

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Laporan</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Source of truth untuk keputusan finansial dan operasional.
                    </p>
                </div>
                <PageErrorState
                    title="Gagal memuat laporan"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const summaryBody = await summaryRes.json();
    const tableBody = await tableRes.json();
    const branchesBody = await branchesRes.json();

    const summary = (summaryBody as any)?.data ?? null;
    const tableData = (tableBody as any)?.data ?? [];
    const branches = (branchesBody as any)?.data ?? [];

    return (
        <ReportsPageClient
            initialSummary={summary}
            initialTableData={tableData}
            branches={branches}
        />
    );
}
