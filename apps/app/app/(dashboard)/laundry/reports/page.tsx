import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
    title: "Laundry Reports",
    description: "Ringkasan revenue, status order, dan outstanding payment laundry.",
};

function normalizeApiList<T = any>(payload: any): T[] {
    const data = payload?.data;
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(data?.data)) return data.data as T[];
    return [];
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

type SearchParams = {
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
};

export default async function LaundryReportsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const resolvedSearchParams = await searchParams;
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) redirect("/login");
    if (activeOrg.businessType !== "laundry") redirect("/dashboard");

    const rpc = apiClient as any;
    const cookie = (await headers()).get("cookie") || "";
    const [summaryRes, byStatusRes, outstandingRes, branchesRes] = await Promise.all([
        rpc.api.dashboard.laundry.reports.summary.$get(
            {
                query: {
                    branchId: resolvedSearchParams.branchId,
                    dateFrom: resolvedSearchParams.dateFrom,
                    dateTo: resolvedSearchParams.dateTo,
                },
            },
            { headers: { cookie } }
        ),
        rpc.api.dashboard.laundry.reports["orders-by-status"].$get(
            { query: { branchId: resolvedSearchParams.branchId } },
            { headers: { cookie } }
        ),
        rpc.api.dashboard.laundry.reports["outstanding-payments"].$get(
            { query: { branchId: resolvedSearchParams.branchId, limit: "50" } },
            { headers: { cookie } }
        ),
        rpc.api.dashboard.branches.$get(undefined, { headers: { cookie } }),
    ]);

    if (!summaryRes.ok || !byStatusRes.ok || !outstandingRes.ok || !branchesRes.ok) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Laporan Laundry</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Revenue, status order, dan monitoring pembayaran.</p>
                </div>
                <PageErrorState
                    title="Gagal memuat laporan laundry"
                    description="Coba muat ulang halaman atau periksa koneksi backend."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const summary = ((await summaryRes.json().catch(() => ({}))) as any)?.data ?? {};
    const byStatus = normalizeApiList((await byStatusRes.json().catch(() => ({}))) as any);
    const outstanding = normalizeApiList((await outstandingRes.json().catch(() => ({}))) as any);
    const branches = normalizeApiList((await branchesRes.json().catch(() => ({}))) as any);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Laporan Laundry</h1>
                <p className="mt-2 text-sm text-muted-foreground">Revenue, status order, dan monitoring pembayaran.</p>
            </div>

            <form action="/laundry/reports" method="get" className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-4">
                <select name="branchId" defaultValue={resolvedSearchParams.branchId ?? ""} className="h-9 rounded-md border px-3 text-sm">
                    <option value="">Semua cabang</option>
                    {branches.map((branch: any) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                        </option>
                    ))}
                </select>
                <input type="date" name="dateFrom" defaultValue={resolvedSearchParams.dateFrom ?? ""} className="h-9 rounded-md border px-3 text-sm" />
                <input type="date" name="dateTo" defaultValue={resolvedSearchParams.dateTo ?? ""} className="h-9 rounded-md border px-3 text-sm" />
                <button type="submit" className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
                    Terapkan Filter
                </button>
            </form>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue</p>
                    <p className="mt-1 text-lg font-bold">{formatCurrency(summary.totalRevenue)}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Order</p>
                    <p className="mt-1 text-lg font-bold">{summary.totalOrders ?? 0}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</p>
                    <p className="mt-1 text-lg font-bold">{summary.completedOrders ?? 0}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outstanding</p>
                    <p className="mt-1 text-lg font-bold">{formatCurrency(summary.outstandingAmount ?? 0)}</p>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Order by Status</h2>
                    <div className="mt-3 space-y-2">
                        {byStatus.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada data status.</p>
                        ) : (
                            byStatus.map((item: any) => (
                                <div key={item.status} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                    <span className="text-sm">{item.status}</span>
                                    <span className="text-sm font-semibold">{item.total}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-4">
                    <h2 className="text-sm font-semibold">Outstanding Payments</h2>
                    <div className="mt-3 space-y-2">
                        {outstanding.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada outstanding payment.</p>
                        ) : (
                            outstanding.slice(0, 10).map((item: any) => (
                                <div key={item.id} className="rounded-lg border px-3 py-2">
                                    <p className="text-sm font-semibold">{item.orderNumber}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.customerName ?? "Pelanggan Umum"} • {formatCurrency(item.remainingAmount)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
