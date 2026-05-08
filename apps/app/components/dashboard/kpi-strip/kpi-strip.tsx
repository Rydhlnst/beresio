import { headers } from "next/headers";

import { apiClient } from "@/lib/api-client";
import { CardErrorState } from "../shared/card-error-state";
import { KPIStripLiveClient } from "./kpi-strip-live-client";

const KPI_FETCH_TIMEOUT_MS = 7000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
        return await Promise.race([
            promise,
            new Promise<null>((resolve) => {
                timer = setTimeout(() => resolve(null), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

type KPIStripProps = {
    branchId?: string | null;
    scope?: "organization" | "branch";
};

export async function KPIStrip({ branchId, scope = "organization" }: KPIStripProps) {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get("cookie") || "";
    const res = await withTimeout<Response>(
        (apiClient as any).api.dashboard.kpis.$get(
            {
                query: branchId ? { branchId } : {},
            },
            {
                headers: { cookie },
            }
        ) as Promise<Response>,
        KPI_FETCH_TIMEOUT_MS
    );

    if (!res) {
        console.warn("KPI request timed out; rendering fallback KPI cards.");
        return (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 h-full">
                {[1, 2, 3, 4].map((i) => (
                    <CardErrorState
                        key={i}
                        title="Memuat terlalu lama"
                        description="Data KPI akan muncul saat koneksi stabil."
                        className="h-full rounded-lg border bg-card"
                    />
                ))}
            </div>
        );
    }

    if (!res.ok) {
        console.error("Failed to fetch KPIs:", await res.text().catch(() => ""));
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
