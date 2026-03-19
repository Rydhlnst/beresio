"use client";

import { useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { SectionCard } from "../shared/section-card";
import { TimeRangeSelector, type TimeRange } from "../shared/time-range-selector";
import { CardEmptyState } from "../shared/card-empty-state";
import { BarChart2 } from "lucide-react";

function formatRevenue(value: number) {
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
    return `Rp ${value}`;
}

export function RevenueTrendClient({ 
    initialData7d, 
    initialData30d 
}: { 
    initialData7d: any[]; 
    initialData30d: any[]; 
}) {
    const [range, setRange] = useState<TimeRange>("7D");
    
    // Fallback logic for unsupported ranges since backend currently supports 7d and 30d
    let data;
    if (range === "7D") data = initialData7d;
    else if (range === "30D") data = initialData30d;
    else data = initialData30d; // Fallback MTD/YTD to 30d for now

    return (
        <SectionCard
            title="Tren Revenue"
            className="h-full"
            actions={<TimeRangeSelector value={range} onChange={setRange} />}
        >
            {data.length === 0 ? (
                <CardEmptyState
                    icon={BarChart2}
                    title="Belum ada transaksi di periode ini"
                />
            ) : (
                <div className="h-full min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border) / 0.4)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 400 }}
                                axisLine={false}
                                tickLine={false}
                                dy={10}
                            />
                            <YAxis
                                tickFormatter={formatRevenue}
                                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 400 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ stroke: "hsl(var(--primary) / 0.2)", strokeWidth: 2 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                                    {payload[0]?.payload?.date}
                                                </p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {formatRevenue((payload[0]?.value as number) ?? 0)}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: "hsl(var(--primary))",
                                    stroke: "hsl(var(--background))",
                                    strokeWidth: 2
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </SectionCard>
    );
}
