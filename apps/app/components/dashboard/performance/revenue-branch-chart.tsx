import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { RevenueBranchClient } from "./revenue-branch-client";
import { SectionCard } from "../shared/section-card";
import { CardErrorState } from "../shared/card-error-state";
import { ErrorRetryAction } from "../shared/error-retry-action";
import { ErrorToast } from "../shared/error-toast";

export async function RevenueBranchChart() {
    const res = await apiClient.api.dashboard.performance.branches.$get(undefined, {
        headers: { cookie: (await headers()).get("cookie") || "" }
    });

    if (!res.ok) {
        console.error("Failed to fetch revenue per branch:", await res.text());
        return (
            <SectionCard title="Revenue per Cabang">
                <ErrorToast
                    id="dashboard-revenue-branch-error"
                    title="Gagal memuat data cabang"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <CardErrorState
                    title="Gagal memuat data cabang"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </SectionCard>
        );
    }

    const data = await res.json();

    return <RevenueBranchClient data={(data as any).data || []} />;
}
