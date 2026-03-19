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
            <>
                <ErrorToast
                    id="dashboard-kpi-error"
                    title="Gagal memuat KPI"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <CardErrorState
                    title="Gagal memuat KPI"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                    className="h-full rounded-lg border bg-card"
                />
            </>
        );
    }
    
    const payload = await res.json();
    const kpiData = payload?.data || {
        totalRevenue: 0,
        totalCustomers: 0,
        activeSessions: 0,
        securityAlerts: 0,
    };

    const totalRevenue = Number(kpiData.totalRevenue ?? 0);
    const totalCustomers = Number(kpiData.totalCustomers ?? 0);
    const activeSessions = Number(kpiData.activeSessions ?? 0);
    const securityAlerts = Number(kpiData.securityAlerts ?? 0);
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const cards = [
        {
            label: "Total Revenue",
            value: formatCurrency(totalRevenue),
            icon: DollarSign,
            variant: "default" as const,
        },
        {
            label: "Total Customers",
            value: totalCustomers.toString(),
            icon: Users,
            variant: "default" as const,
        },
        {
            label: "Active Sessions",
            value: activeSessions.toString(),
            icon: Activity,
            variant: "default" as const,
        },
        {
            label: "Security Alerts",
            value: `${securityAlerts} events`,
            icon: securityAlerts > 0 ? AlertTriangle : ShieldAlert,
            variant: securityAlerts > 0 ? "danger" as const : "default" as const,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:grid-rows-2 h-full">
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
