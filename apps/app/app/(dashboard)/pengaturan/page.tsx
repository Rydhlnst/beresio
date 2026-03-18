import { Metadata } from "next";
import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { SettingsPageClient } from "./_components/settings-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { ErrorToast } from "@/components/dashboard/shared/error-toast";

export const metadata: Metadata = {
    title: "Pengaturan | Beres",
    description: "Konfigurasi organisasi dan integrasi",
};

export default async function PengaturanPage() {
    const cookie = (await headers()).get("cookie") || "";
    const [orgRes, billingRes] = await Promise.all([
        apiClient.api.dashboard.organization.$get(undefined, {
            headers: { cookie },
        }),
        apiClient.api.dashboard.billing.status.$get(undefined, {
            headers: { cookie },
        }),
    ]);

    if (!orgRes.ok || !billingRes.ok) {
        if (!orgRes.ok) console.error("Failed to fetch organization:", await orgRes.text());
        if (!billingRes.ok) console.error("Failed to fetch billing status:", await billingRes.text());
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Pengaturan</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Konfigurasi organisasi dan integrasi.
                    </p>
                </div>
                <ErrorToast
                    id="page-settings-error"
                    title="Gagal memuat pengaturan"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <PageErrorState
                    title="Gagal memuat pengaturan"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const orgBody = await orgRes.json();
    const billingBody = await billingRes.json();

    return (
        <SettingsPageClient
            organization={(orgBody as any)?.data ?? null}
            billing={(billingBody as any)?.data ?? null}
        />
    );
}
