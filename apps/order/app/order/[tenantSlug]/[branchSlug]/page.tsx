import { fetchPublicLaundryServices } from "@/lib/public-order-api";
import { CustomerOrderPage } from "../../_components/customer-order-page";
import { TenantUnavailableState } from "../../_components/tenant-unavailable-state";

type BranchOrderPageProps = {
    params: Promise<{
        tenantSlug: string;
        branchSlug: string;
    }>;
};

export default async function BranchOrderPage({ params }: BranchOrderPageProps) {
    const { tenantSlug, branchSlug } = await params;

    try {
        const payload = await fetchPublicLaundryServices(tenantSlug, branchSlug);
        if (!payload.services || payload.services.length === 0) {
            return (
                <TenantUnavailableState
                    title="Layanan belum aktif"
                    message="Cabang ini belum memiliki layanan laundry aktif. Silakan hubungi tenant lewat WhatsApp."
                />
            );
        }

        return (
            <CustomerOrderPage
                tenant={payload.tenant}
                branch={payload.branch}
                services={payload.services}
            />
        );
    } catch {
        return <TenantUnavailableState />;
    }
}
