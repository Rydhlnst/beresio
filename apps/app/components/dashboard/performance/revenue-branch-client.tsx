"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { SectionCard } from "../shared/section-card";
import { CardEmptyState } from "../shared/card-empty-state";
import { BarChart2 } from "lucide-react";

function formatRevenue(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
    return `${(value / 1_000).toFixed(0)}rb`;
}

const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.8)",
    "hsl(var(--primary) / 0.6)",
];

export function RevenueBranchClient({ data }: { data: any[] }) {
    return (
        <SectionCard title="Revenue per Cabang">
            {data.length === 0 ? (
                <CardEmptyState
                    icon={BarChart2}
                    title="Belum ada transaksi di periode ini"
                />
            ) : (
                <div className="flex-1 min-h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                            barSize={32}
                        >
                            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border) / 0.4)" horizontal={false} />
                            <XAxis
                                type="number"
                                tickFormatter={formatRevenue}
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 400 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                dataKey="branchName"
                                type="category"
                                width={110}
                                tick={{ fontSize: 10, fill: "hsl(var(--foreground))", fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border border-border/60 bg-background p-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                                    {payload[0]?.payload?.branchName}
                                                </p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    Rp {payload[0]?.value?.toLocaleString("id-ID") ?? "0"}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </SectionCard>
    );
}
