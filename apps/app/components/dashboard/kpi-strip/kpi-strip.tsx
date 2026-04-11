import { headers } from "next/headers";

import { apiClient } from "@/lib/api-client";
import { CardErrorState } from "../shared/card-error-state";
import { KPIStripLiveClient } from "./kpi-strip-live-client";

type KPIStripProps = {
    branchId?: string | null;
    scope?: "organization" | "branch";
};

export async function KPIStrip({ branchId, scope = "organization" }: KPIStripProps) {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get("cookie") || "";
    const res = await (apiClient as any).api.dashboard.kpis.$get(
        {
            query: branchId ? { branchId } : {},
        },
        {
            headers: { cookie },
        }
    );

    if (!res.ok) {
        console.error("Failed to fetch KPIs:", await res.text());
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 h-full">
                {[1, 2, 3, 4].map((i) => (
                    <CardErrorState
                        key={i}
                        title="Gagal memuat"
                        description="Muat ulang halaman."
                        className="h-full rounded-lg border bg-card"
                    />
                ))}
            </div>
        );
    }

    const payload = await res.json();
    return (
        <KPIStripLiveClient
            initialData={(payload as any)?.data ?? {}}
            branchId={branchId}
            scope={scope}
        />
    );
}
