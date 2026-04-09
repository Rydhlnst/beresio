import Link from "next/link";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@repo/ui/button";
import { apiClient } from "@/lib/api-client";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";

export const metadata: Metadata = {
    title: "Laundry Customers",
    description: "Daftar pelanggan laundry untuk operasional harian.",
};

export default async function LaundryCustomersPage() {
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) redirect("/login");
    if (activeOrg.businessType !== "laundry") redirect("/dashboard");

    const rpc = apiClient as any;
    const cookie = (await headers()).get("cookie") || "";
    const res = await rpc.api.dashboard.customers.$get(undefined, { headers: { cookie } });

    if (!res.ok) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Pelanggan Laundry</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Data pelanggan untuk order walk-in dan pickup.</p>
                    </div>
                </div>
                <PageErrorState
                    title="Gagal memuat pelanggan laundry"
                    description="Coba muat ulang halaman atau periksa koneksi backend."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const customers = ((await res.json().catch(() => ({}))) as any)?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Pelanggan Laundry</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Data pelanggan untuk order walk-in dan pickup.</p>
                </div>
                <Button asChild variant="outline" className="h-9 text-xs font-semibold">
                    <Link href="/crm">Buka CRM Lengkap</Link>
                </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold">Nama</th>
                            <th className="px-4 py-3 text-left font-semibold">Telepon</th>
                            <th className="px-4 py-3 text-left font-semibold">Alamat</th>
                            <th className="px-4 py-3 text-left font-semibold">Loyalty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.length === 0 ? (
                            <tr>
                                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>
                                    Belum ada pelanggan.
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer: any) => (
                                <tr key={customer.id} className="border-t">
                                    <td className="px-4 py-3">{customer.name}</td>
                                    <td className="px-4 py-3">{customer.phone ?? "-"}</td>
                                    <td className="px-4 py-3">{customer.address ?? "-"}</td>
                                    <td className="px-4 py-3">{customer.loyaltyTier ?? "regular"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
