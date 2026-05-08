"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Box, DollarSign, Truck, TriangleAlert } from "lucide-react";
import { buildSafeApiUrl } from "@/lib/safe-api-url";

import { KPICard } from "./kpi-card";

type KpiPayload = {
    omzetHariIni?: number;
    pesananHariIni?: number;
    activeBranches?: number;
    totalBranches?: number;
    totalRevenueToday?: number;
    totalOrdersToday?: number;
    activeDeliveries?: number;
    lowStockAlerts?: number;
};

type KPIStripLiveClientProps = {
    initialData: KpiPayload;
    branchId?: string | null;
    scope?: "organization" | "branch";
};

export function KPIStripLiveClient({
    initialData,
    branchId,
    scope = "organization",
}: KPIStripLiveClientProps) {
    const [kpis, setKpis] = useState<KpiPayload>(initialData);

    useEffect(() => {
        const params = new URLSearchParams();
        if (branchId) params.set("branchId", branchId);
        const query = params.toString();
        const streamUrl = buildSafeApiUrl(`/api/dashboard/kpis/stream${query ? `?${query}` : ""}`);

        const source = new EventSource(streamUrl, { withCredentials: true });
        source.addEventListener("kpi", (event) => {
            try {
                const payload = JSON.parse((event as MessageEvent<string>).data) as KpiPayload;
                setKpis(payload);
            } catch {
                // ignore malformed payload
            }
        });
        source.addEventListener("error", () => {
            // Keep existing KPI state on stream errors.
        });

        return () => source.close();
    }, [branchId]);

    const cards = useMemo(() => {
        const revenue = Number(kpis.totalRevenueToday ?? kpis.omzetHariIni ?? 0);
        const orders = Number(kpis.totalOrdersToday ?? kpis.pesananHariIni ?? 0);
        const activeDeliveries = Number(kpis.activeDeliveries ?? 0);
        const lowStockAlerts = Number(kpis.lowStockAlerts ?? 0);

        const formatCurrency = (value: number) =>
            new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(value);

        if (scope === "branch") {
            return [
                { label: "Revenue Hari Ini", value: formatCurrency(revenue), icon: DollarSign },
                { label: "Orders Hari Ini", value: orders.toString(), icon: Box },
                { label: "Active Deliveries", value: activeDeliveries.toString(), icon: Truck },
                { label: "Low Stock Alerts", value: lowStockAlerts.toString(), icon: TriangleAlert },
            ];
        }

        return [
            { label: "Total Revenue Hari Ini", value: formatCurrency(revenue), icon: DollarSign },
            { label: "Total Orders Hari Ini", value: orders.toString(), icon: Box },
            { label: "Active Deliveries", value: activeDeliveries.toString(), icon: Truck },
            { label: "Low Stock Alerts", value: lowStockAlerts.toString(), icon: Activity },
        ];
    }, [kpis, scope]);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
            {cards.map((card) => (
                <KPICard
                    key={card.label}
                    label={card.label}
                    value={card.value}
                    icon={card.icon}
                    variant="default"
                />
            ))}
        </div>
    );
}
