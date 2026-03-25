import { Metadata } from "next";
import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { PickupPageClient } from "./_components/pickup-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { ErrorToast } from "@/components/dashboard/shared/error-toast";
import { getActiveOrganizationContext } from "@/lib/organization-context";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Pickup & Delivery | Beres",
    description: "Monitor dan kelola order pickup/delivery",
};

export default async function PickupPage() {
    const activeOrg = await getActiveOrganizationContext();
    if (!activeOrg) {
        redirect("/login");
    }
    if (activeOrg.businessType !== "laundry") {
        redirect("/dashboard");
    }

    const cookie = (await headers()).get("cookie") || "";
    const pickupRes = await apiClient.api.dashboard.pickup.$get(undefined, {
        headers: { cookie },
    });

    if (!pickupRes.ok) {
        console.error("Failed to fetch pickup orders:", await pickupRes.text());
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Pickup & Delivery</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Monitor dan kelola order pickup/delivery.
                    </p>
                </div>
                <ErrorToast
                    id="page-pickup-error"
                    title="Gagal memuat pickup"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <PageErrorState
                    title="Gagal memuat pickup"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const body = await pickupRes.json();

    return <PickupPageClient orders={(body as any)?.data ?? []} />;
}
