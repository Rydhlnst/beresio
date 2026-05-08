"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell,
} from "recharts";

import { SectionCard } from "@/components/dashboard/shared/section-card";
import { buildSafeApiUrl } from "@/lib/safe-api-url";

type TrendPoint = {
    date: string;
    branchId: string;
    branchName: string;
    revenue: number;
};

type OrdersByTypePoint = {
    type: string;
    total: number;
};

type OrgDashboardChartsClientProps = {
    initialTrendByBranch: TrendPoint[];
    initialOrdersByType: OrdersByTypePoint[];
};

const PIE_COLORS = ["#16a34a", "#f59e0b", "#0ea5e9", "#7c3aed", "#ef4444"];

function normalizeOrderType(type: string) {
    const lower = type.toLowerCase();
    if (lower.includes("dine")) return "Dine-in";
    if (lower.includes("takeaway") || lower.includes("take-away")) return "Takeaway";
    if (lower.includes("delivery")) return "Delivery";
    return type;
}

export function OrgDashboardChartsClient({
    initialTrendByBranch,
    initialOrdersByType,
}: OrgDashboardChartsClientProps) {
    const [trendByBranch, setTrendByBranch] = useState(initialTrendByBranch);
    const [ordersByType, setOrdersByType] = useState(initialOrdersByType);

    const compactFormatter = useMemo(() => new Intl.NumberFormat("id-ID", { notation: "compact" }), []);
    const currencyFormatter = useMemo(() => new Intl.NumberFormat("id-ID"), []);

    const formatCompact = useMemo(() => {
        return (value: number) => compactFormatter.format(Number(value));
    }, [compactFormatter]);

    const formatCurrency = useMemo(() => {
        return (value: number) => `Rp ${currencyFormatter.format(Number(value))}`;
    }, [currencyFormatter]);

    useEffect(() => {
        let cancelled = false;
        const refresh = async () => {
            try {
                const [trendRes, ordersRes] = await Promise.all([
                    fetch(buildSafeApiUrl("/api/dashboard/performance/trend-by-branch?timeRange=7d"), {
                        credentials: "include",
                    }),
                    fetch(buildSafeApiUrl("/api/dashboard/performance/orders-by-type"), {
                        credentials: "include",
                    }),
                ]);

                if (!trendRes.ok || !ordersRes.ok) return;
                const [trendBody, ordersBody] = await Promise.all([trendRes.json(), ordersRes.json()]);
                if (cancelled) return;

                setTrendByBranch((trendBody as any)?.data ?? []);
                setOrdersByType((ordersBody as any)?.data ?? []);
            } catch {
                // Keep previous state when polling fails.
            }
        };

        const timer = setInterval(() => {
            void refresh();
        }, 300000);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const trendChartData = useMemo(() => {
        const byDate = new Map<string, Record<string, number | string>>();
        for (const point of trendByBranch) {
            const dateKey = point.date;
            const row = byDate.get(dateKey) ?? { date: dateKey };
            row[point.branchName] = Number(point.revenue ?? 0);
            byDate.set(dateKey, row);
        }
        return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    }, [trendByBranch]);

    const trendBranchNames = useMemo(() => {
        const names = new Set<string>();
        for (const point of trendByBranch) {
            names.add(point.branchName);
        }
        return [...names];
    }, [trendByBranch]);

    const ordersPieData = useMemo(
        () => ordersByType.map((item) => ({ name: normalizeOrderType(item.type), value: Number(item.total ?? 0) })),
        [ordersByType]
    );

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SectionCard title="Revenue Trend (7 Hari)" className="h-auto min-h-[340px] lg:col-span-2">
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis tickFormatter={formatCompact} />
                            <Tooltip formatter={formatCurrency} />
                            <Legend />
                            {trendBranchNames.map((name, index) => (
                                <Line
                                    key={name}
                                    type="monotone"
                                    dataKey={name}
                                    stroke={PIE_COLORS[index % PIE_COLORS.length]}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>

            <SectionCard title="Orders by Type" className="h-auto min-h-[340px]">
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={ordersPieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={48}
                                outerRadius={88}
                                label
                            >
                                {ordersPieData.map((_, index) => (
                                    <Cell key={`orders-pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {ordersPieData.map((row) => (
                        <div key={row.name} className="flex items-center justify-between">
                            <span>{row.name}</span>
                            <span className="font-semibold text-foreground">{row.value}</span>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}
