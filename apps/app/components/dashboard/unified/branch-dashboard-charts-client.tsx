"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { SectionCard } from "@/components/dashboard/shared/section-card";

type HourlyPoint = {
    hour: number;
    revenue: number;
    orderCount: number;
};

type TopProductPoint = {
    name: string;
    quantity: number;
    revenue: number;
};

type BranchDashboardChartsClientProps = {
    branchId: string;
    initialHourlySales: HourlyPoint[];
    initialTopProducts: TopProductPoint[];
};

function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
}

export function BranchDashboardChartsClient({
    branchId,
    initialHourlySales,
    initialTopProducts,
}: BranchDashboardChartsClientProps) {
    const [hourlySales, setHourlySales] = useState(initialHourlySales);
    const [topProducts, setTopProducts] = useState(initialTopProducts);

    useEffect(() => {
        let cancelled = false;
        const params = new URLSearchParams({ branchId });
        const refresh = async () => {
            try {
                const [hourlyRes, topRes] = await Promise.all([
                    fetch(`${getApiBaseUrl()}/api/dashboard/performance/hourly-sales?${params.toString()}`, {
                        credentials: "include",
                    }),
                    fetch(`${getApiBaseUrl()}/api/dashboard/performance/top-products?${params.toString()}`, {
                        credentials: "include",
                    }),
                ]);

                if (!hourlyRes.ok || !topRes.ok) return;
                const [hourlyBody, topBody] = await Promise.all([hourlyRes.json(), topRes.json()]);
                if (cancelled) return;

                setHourlySales((hourlyBody as any)?.data ?? []);
                setTopProducts((topBody as any)?.data ?? []);
            } catch {
                // keep current state
            }
        };

        const timer = setInterval(() => {
            void refresh();
        }, 300000);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [branchId]);

    const topProductsChartData = useMemo(
        () => topProducts.slice(0, 5).map((item) => ({ name: item.name, quantity: item.quantity })),
        [topProducts]
    );
    const chartContainerClass = "h-[280px] w-full";

    return (
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <SectionCard title="Hourly Sales (Hari Ini)" className="h-full min-h-[360px]">
                <div className={chartContainerClass}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourlySales}>
                            <XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} />
                            <YAxis />
                            <Tooltip formatter={(value: number) => new Intl.NumberFormat("id-ID").format(value)} />
                            <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>

            <SectionCard title="Top 5 Products (Minggu Ini)" className="h-full min-h-[360px]">
                <div className={chartContainerClass}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProductsChartData}>
                            <XAxis dataKey="name" hide />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {topProducts.slice(0, 5).map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <span className="truncate pr-3">{item.name}</span>
                            <span className="font-semibold text-foreground">{item.quantity}</span>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
