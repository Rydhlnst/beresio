import { Metadata } from "next";
import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { InventoryPageClient } from "./_components/inventory-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { ErrorToast } from "@/components/dashboard/shared/error-toast";

export const metadata: Metadata = {
    title: "Inventory | Beres",
    description: "Pantau stok lintas cabang dan kelola transfer",
};

export default async function InventoryPage() {
    const cookie = (await headers()).get("cookie") || "";
    const [branchesRes, productsRes, transfersRes, adjustmentsRes] = await Promise.all([
        apiClient.api.dashboard.branches.$get(undefined, { headers: { cookie } }),
        apiClient.api.dashboard.inventory.products.$get(undefined, { headers: { cookie } }),
        apiClient.api.dashboard.inventory.transfers.$get(undefined, { headers: { cookie } }),
        apiClient.api.dashboard.inventory.adjustments.$get(undefined, { headers: { cookie } }),
    ]);

    if (!branchesRes.ok || !productsRes.ok || !transfersRes.ok || !adjustmentsRes.ok) {
        if (!branchesRes.ok) console.error("Failed to fetch branches:", await branchesRes.text());
        if (!productsRes.ok) console.error("Failed to fetch inventory products:", await productsRes.text());
        if (!transfersRes.ok) console.error("Failed to fetch inventory transfers:", await transfersRes.text());
        if (!adjustmentsRes.ok) console.error("Failed to fetch inventory adjustments:", await adjustmentsRes.text());
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Pantau stok lintas cabang dan kelola transfer.
                    </p>
                </div>
                <ErrorToast
                    id="page-inventory-error"
                    title="Gagal memuat inventory"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <PageErrorState
                    title="Gagal memuat inventory"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const branchesBody = await branchesRes.json();
    const productsBody = await productsRes.json();
    const transfersBody = await transfersRes.json();
    const adjustmentsBody = await adjustmentsRes.json();

    return (
        <InventoryPageClient
            branches={(branchesBody as any)?.data ?? []}
            products={(productsBody as any)?.data ?? []}
            transfers={(transfersBody as any)?.data ?? []}
            adjustments={(adjustmentsBody as any)?.data ?? []}
        />
    );
}
