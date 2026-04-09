import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { apiClient } from "@/lib/api-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import LaundryServicesClient from "./laundry-services-client";

export const metadata: Metadata = {
    title: "Laundry Services",
    description: "Kelola layanan dan tarif laundry per cabang.",
};

function normalizeApiList<T = any>(payload: any): T[] {
    const data = payload?.data;
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(data?.data)) return data.data as T[];
    return [];
}

export default async function LaundryServicesPage() {
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) redirect("/login");
    if (activeOrg.businessType !== "laundry") redirect("/dashboard");

    const rpc = apiClient as any;
    const cookie = (await headers()).get("cookie") || "";
    const [branchesRes, servicesRes] = await Promise.all([
        rpc.api.dashboard.branches.$get(undefined, { headers: { cookie } }),
        rpc.api.dashboard.laundry.services.$get(undefined, { headers: { cookie } }),
    ]);

    if (!branchesRes.ok || !servicesRes.ok) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Layanan Laundry</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Kelola layanan, tarif, dan estimasi pengerjaan.</p>
                </div>
                <PageErrorState
                    title="Gagal memuat layanan laundry"
                    description="Coba muat ulang halaman atau periksa koneksi backend."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const branches = normalizeApiList((await branchesRes.json().catch(() => ({}))) as any);
    const services = normalizeApiList((await servicesRes.json().catch(() => ({}))) as any);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Layanan Laundry</h1>
                <p className="mt-2 text-sm text-muted-foreground">Kelola layanan, tarif, dan estimasi pengerjaan.</p>
            </div>
            <LaundryServicesClient branches={branches} services={services} />
        </div>
    );
}
