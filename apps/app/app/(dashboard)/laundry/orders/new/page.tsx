import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { apiClient } from "@/lib/api-client";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import LaundryOrderNewForm from "./laundry-order-new-form";

export const metadata: Metadata = {
    title: "Order Laundry Baru",
    description: "Buat order laundry baru dengan alur cepat.",
};

function normalizeApiList<T = any>(payload: any): T[] {
    const data = payload?.data;
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(data?.data)) return data.data as T[];
    return [];
}

export default async function LaundryOrderNewPage() {
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) redirect("/login");
    if (activeOrg.businessType !== "laundry") redirect("/");

    const rpc = apiClient as any;
    const cookie = (await headers()).get("cookie") || "";
    const [branchesRes, servicesRes, customersRes] = await Promise.all([
        rpc.api.dashboard.branches.$get(undefined, { headers: { cookie } }),
        rpc.api.dashboard.laundry.services.$get(undefined, { headers: { cookie } }),
        rpc.api.dashboard.customers.$get(undefined, { headers: { cookie } }),
    ]);

    if (!branchesRes.ok || !servicesRes.ok || !customersRes.ok) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Order Laundry Baru</h1>
                        <p className="mt-2 text-sm text-muted-foreground">Buat order laundry dengan flow kurang dari 2 menit.</p>
                    </div>
                    <Button asChild variant="outline" className="h-9 text-xs font-semibold">
                        <Link href="/laundry/orders">Kembali</Link>
                    </Button>
                </div>
                <PageErrorState
                    title="Gagal memuat form order"
                    description="Periksa layanan branch, customer, atau backend API."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const branches = normalizeApiList((await branchesRes.json().catch(() => ({}))) as any);
    const services = normalizeApiList((await servicesRes.json().catch(() => ({}))) as any);
    const customers = normalizeApiList((await customersRes.json().catch(() => ({}))) as any);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Order Laundry Baru</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Buat order laundry dengan flow kurang dari 2 menit.</p>
                </div>
                <Button asChild variant="outline" className="h-9 text-xs font-semibold">
                    <Link href="/laundry/orders">Kembali</Link>
                </Button>
            </div>

            <LaundryOrderNewForm branches={branches} services={services} customers={customers} />
        </div>
    );
}

