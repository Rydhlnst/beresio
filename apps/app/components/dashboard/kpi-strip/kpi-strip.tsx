import { KPICard } from "./kpi-card";
import { Box, DollarSign, Users, Activity, AlertTriangle, ShieldAlert } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { CardErrorState } from "../shared/card-error-state";
import { ErrorRetryAction } from "../shared/error-retry-action";
import { ErrorToast } from "../shared/error-toast";

export async function KPIStrip() {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get('cookie') || '';
    
    // Fetch data from Hono RPC
    const res = await apiClient.api.dashboard.kpis.$get({}, {
        headers: { cookie }
    });
    
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
    const kpiData = (payload as any)?.data || {
        omzetHariIni: 0,
        pesananHariIni: 0,
        pelangganBaru: 0,
        activeBranches: 0,
        totalBranches: 0,
    };

    const omzetHariIni = Number(kpiData.omzetHariIni ?? 0);
    const pesananHariIni = Number(kpiData.pesananHariIni ?? 0);
    const pelangganBaru = Number(kpiData.pelangganBaru ?? 0);
    const activeBranches = Number(kpiData.activeBranches ?? 0);
    const totalBranches = Number(kpiData.totalBranches ?? 0);
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const cards = [
        {
            label: "Omzet Hari Ini",
            value: formatCurrency(omzetHariIni),
            icon: DollarSign,
            variant: "default" as const,
        },
        {
            label: "Pesanan Hari Ini",
            value: pesananHariIni.toString(),
            icon: Box,
            variant: "default" as const,
        },
        {
            label: "Pelanggan Baru",
            value: pelangganBaru.toString(),
            icon: Users,
            variant: "default" as const,
        },
        {
            label: "Cabang Aktif",
            value: `${activeBranches}/${totalBranches}`,
            icon: Activity,
            variant: "default" as const,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
            {cards.map((card) => (
                <KPICard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    icon={card.icon}
                    variant={card.variant}
                />
            ))}
        </div>
    );
}
