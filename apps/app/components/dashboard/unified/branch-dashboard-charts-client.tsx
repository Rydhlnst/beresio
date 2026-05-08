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
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { buildSafeApiUrl } from "@/lib/safe-api-url";
import { BarChart2, Package } from "lucide-react";

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

export function BranchDashboardChartsClient({
    branchId,
    initialHourlySales,
    initialTopProducts,
}: BranchDashboardChartsClientProps) {
    const [hourlySales, setHourlySales] = useState(initialHourlySales);
    const [topProducts, setTopProducts] = useState(initialTopProducts);

    const numberFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);
    const formatNumber = useMemo(() => (value: number) => numberFormatter.format(Number(value)), [numberFormatter]);

    useEffect(() => {
        let cancelled = false;
        const params = new URLSearchParams({ branchId });
        const refresh = async () => {
            try {
                params.set("topLimit", "5");
                params.set("activityLimit", "1");
                const overviewRes = await fetch(buildSafeApiUrl(`/api/dashboard/performance/branch-overview?${params.toString()}`), {
                    credentials: "include",
                });

                if (!overviewRes.ok) return;
                const overviewBody = await overviewRes.json();
                if (cancelled) return;

                setHourlySales((overviewBody as any)?.data?.hourlySales ?? []);
                setTopProducts((overviewBody as any)?.data?.topProducts ?? []);
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

    const hourlyTotals = useMemo(() => {
        return hourlySales.reduce(
            (acc, point) => {
                acc.revenue += point.revenue ?? 0;
                acc.orders += point.orderCount ?? 0;
                return acc;
            },
            { revenue: 0, orders: 0 }
        );
    }, [hourlySales]);

    const topProductsTotalQuantity = useMemo(() => {
        return topProducts.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    }, [topProducts]);

    const isHourlyEmpty = hourlySales.length === 0 || (hourlyTotals.revenue === 0 && hourlyTotals.orders === 0);
    const isTopProductsEmpty = topProducts.length === 0 || topProductsTotalQuantity === 0;
    const chartContainerClass = "h-[280px] w-full";

    return (
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
            <SectionCard title="Hourly Sales (Hari Ini)" className="h-full min-h-[360px]">
                {isHourlyEmpty ? (
                    <CardEmptyState
                        icon={BarChart2}
                        title="Belum ada transaksi hari ini"
                        description="Grafik akan muncul setelah ada penjualan."
                        className="h-full"
                    />
                ) : (
                    <div className={chartContainerClass}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourlySales}>
                                <XAxis dataKey="hour" tickFormatter={(value) => `${value}:00`} />
                                <YAxis />
                                <Tooltip formatter={formatNumber} />
                                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </SectionCard>

            <SectionCard title="Top 5 Products (Minggu Ini)" className="h-full min-h-[360px]">
                {isTopProductsEmpty ? (
                    <CardEmptyState
                        icon={Package}
                        title="Belum ada produk terjual minggu ini"
                        description="Top product akan muncul setelah ada transaksi."
                        className="h-full"
                    />
                ) : (
                    <>
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
                    </>
                )}
            </SectionCard>
        </div>
    );
}
