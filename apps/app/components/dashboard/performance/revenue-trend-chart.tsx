import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { RevenueTrendClient } from "./revenue-trend-client";
import { SectionCard } from "../shared/section-card";
import { CardErrorState } from "../shared/card-error-state";
import { ErrorRetryAction } from "../shared/error-retry-action";
import { ErrorToast } from "../shared/error-toast";

export async function RevenueTrendChart() {
    // Fetch both 7D and 30D data
    const [res7d, res30d] = await Promise.all([
        apiClient.api.dashboard.performance.trend.$get({ query: { timeRange: "7d" } }, {
            headers: { cookie: (await headers()).get("cookie") || "" }
        }),
        apiClient.api.dashboard.performance.trend.$get({ query: { timeRange: "30d" } }, {
            headers: { cookie: (await headers()).get("cookie") || "" }
        })
    ]);

    if (!res7d.ok || !res30d.ok) {
        if (!res7d.ok) console.error("Failed to fetch revenue trend (7d):", await res7d.text());
        if (!res30d.ok) console.error("Failed to fetch revenue trend (30d):", await res30d.text());
        return (
            <SectionCard title="Tren Revenue" className="h-auto min-h-[320px]">
                <ErrorToast
                    id="dashboard-revenue-trend-error"
                    title="Gagal memuat data revenue"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <CardErrorState
                    title="Gagal memuat data revenue"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </SectionCard>
        );
    }

    const data7d = await res7d.json();
    const data30d = await res30d.json();

    return (
        <RevenueTrendClient 
            initialData7d={(data7d as any).data || []} 
            initialData30d={(data30d as any).data || []} 
        />
    );
}
