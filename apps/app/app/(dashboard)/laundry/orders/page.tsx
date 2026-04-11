import Link from "next/link";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@repo/ui/button";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { apiClient } from "@/lib/api-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
    title: "Laundry Orders",
    description: "Daftar order laundry lintas cabang.",
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
    status?: string;
    q?: string;
    outstanding?: string;
    orderType?: string;
};

export default async function LaundryOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
    const resolvedSearchParams = await searchParams;
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) redirect("/login");
    if (activeOrg.businessType !== "laundry") redirect("/");

    const rpc = apiClient as any;
    const cookie = (await headers()).get("cookie") || "";
    const [ordersRes, branchesRes] = await Promise.all([
        rpc.api.dashboard.laundry.orders.$get(
            {
                query: {
                    branchId: resolvedSearchParams.branchId,
                    status: resolvedSearchParams.status,
                    q: resolvedSearchParams.q,
                    outstanding: resolvedSearchParams.outstanding,
                    orderType: resolvedSearchParams.orderType,
                    limit: "100",
                },
            },
            { headers: { cookie } }
        ),
        rpc.api.dashboard.branches.$get(undefined, { headers: { cookie } }),
    ]);

    if (!ordersRes.ok || !branchesRes.ok) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Order Laundry</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Kelola order walk-in, pickup, dan drop-off.</p>
                    </div>
                </div>
                <PageErrorState
                    title="Gagal memuat order laundry"
                    description="Coba muat ulang halaman atau periksa koneksi backend."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const ordersBody = (await ordersRes.json().catch(() => ({}))) as any;
    const branchesBody = (await branchesRes.json().catch(() => ({}))) as any;
    const orders = normalizeApiList(ordersBody);
    const branches = normalizeApiList(branchesBody);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Order Laundry</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Kelola order walk-in, pickup, dan drop-off.</p>
                </div>
                <Button asChild className="h-9 text-xs font-semibold">
                    <Link href="/laundry/orders/new">Tambah Order</Link>
                </Button>
            </div>

            <form action="/laundry/orders" method="get" className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
                <input
                    type="text"
                    name="q"
                    placeholder="Cari nomor, nama, telepon"
                    defaultValue={resolvedSearchParams.q ?? ""}
                    className="h-9 rounded-md border px-3 text-sm"
                />
                <select name="branchId" defaultValue={resolvedSearchParams.branchId ?? ""} className="h-9 rounded-md border px-3 text-sm">
                    <option value="">Semua cabang</option>
                    {branches.map((branch: any) => (
                        <option key={branch.id} value={branch.id}>
                            {branch.name}
                        </option>
                    ))}
                </select>
                <select name="status" defaultValue={resolvedSearchParams.status ?? ""} className="h-9 rounded-md border px-3 text-sm">
                    <option value="">Semua status</option>
                    <option value="received">Received</option>
                    <option value="processing">Processing</option>
                    <option value="ready_for_pickup">Ready for pickup</option>
                    <option value="out_for_delivery">Out for delivery</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
                <select
                    name="orderType"
                    defaultValue={resolvedSearchParams.orderType ?? ""}
                    className="h-9 rounded-md border px-3 text-sm"
                >
                    <option value="">Semua tipe</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="pickup">Pickup</option>
                    <option value="drop_off">Drop-off</option>
                </select>
                <div className="flex gap-2">
                    <Button type="submit" className="h-9 text-xs font-semibold">Terapkan</Button>
                    <Button type="button" variant="outline" asChild className="h-9 text-xs font-semibold">
                        <Link href="/laundry/orders">Reset</Link>
                    </Button>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Order</th>
                            <th className="px-4 py-3 text-left font-semibold">Pelanggan</th>
                            <th className="px-4 py-3 text-left font-semibold">Cabang</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-left font-semibold">Total</th>
                            <th className="px-4 py-3 text-left font-semibold">Sisa</th>
                            <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                                    Belum ada order untuk filter ini.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => (
                                <tr key={order.id} className="border-t">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold">{order.orderNumber}</p>
                                        <p className="text-xs text-muted-foreground">{order.orderType}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p>{order.customerName ?? "Pelanggan Umum"}</p>
                                        <p className="text-xs text-muted-foreground">{order.customerPhone ?? "-"}</p>
                                    </td>
                                    <td className="px-4 py-3">{order.branchName ?? "-"}</td>
                                    <td className="px-4 py-3">{order.status}</td>
                                    <td className="px-4 py-3">{formatCurrency(order.totalAmount)}</td>
                                    <td className="px-4 py-3">{formatCurrency(order.remainingAmount)}</td>
                                    <td className="px-4 py-3">
                                        <Button variant="outline" asChild className="h-8 text-xs font-semibold">
                                            <Link href={`/laundry/orders/${order.id}`}>Detail</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

