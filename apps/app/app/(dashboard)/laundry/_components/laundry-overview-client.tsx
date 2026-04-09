"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Button } from "@repo/ui/button";

type SummaryData = {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    cancellationRate: number;
    outstandingAmount: number;
};

type OrdersByStatus = { status: string; total: number };
type OutstandingOrder = {
    id: string;
    orderNumber: string;
    customerName: string | null;
    customerPhone: string | null;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: string;
    createdAt: string;
};

type LaundryOverviewClientProps = {
    initialSummary: SummaryData;
    initialByStatus: OrdersByStatus[];
    initialOutstanding: OutstandingOrder[];
    enableSse: boolean;
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

function getApiUrl(path: string) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    return `${base}${path}`;
}

export function LaundryOverviewClient({
    initialSummary,
    initialByStatus,
    initialOutstanding,
    enableSse,
}: LaundryOverviewClientProps) {
    const [summary, setSummary] = useState(initialSummary);
    const [byStatus, setByStatus] = useState(initialByStatus);
    const [outstanding, setOutstanding] = useState(initialOutstanding);

    useEffect(() => {
        const fetchSummary = async () => {
            const response = await fetch(getApiUrl("/api/dashboard/laundry/reports/summary"), {
                credentials: "include",
            }).catch(() => null);
            if (!response?.ok) return;
            const payload = await response.json().catch(() => null);
            const data = (payload as { data?: SummaryData } | null)?.data;
            if (data) setSummary(data);
        };

        const summaryTimer = window.setInterval(fetchSummary, 30_000);
        return () => window.clearInterval(summaryTimer);
    }, []);

    useEffect(() => {
        const fetchSecondary = async () => {
            const [statusRes, outstandingRes] = await Promise.all([
                fetch(getApiUrl("/api/dashboard/laundry/reports/orders-by-status"), {
                    credentials: "include",
                }).catch(() => null),
                fetch(getApiUrl("/api/dashboard/laundry/reports/outstanding-payments?limit=10"), {
                    credentials: "include",
                }).catch(() => null),
            ]);

            if (statusRes?.ok) {
                const payload = await statusRes.json().catch(() => null);
                const data = (payload as { data?: OrdersByStatus[] } | null)?.data;
                if (Array.isArray(data)) setByStatus(data);
            }

            if (outstandingRes?.ok) {
                const payload = await outstandingRes.json().catch(() => null);
                const data = (payload as { data?: OutstandingOrder[] } | null)?.data;
                if (Array.isArray(data)) setOutstanding(data);
            }
        };

        const timer = window.setInterval(fetchSecondary, 60_000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!enableSse) return;
        const eventSource = new EventSource(getApiUrl("/api/dashboard/laundry/stream/orders"), {
            withCredentials: true,
        });
        eventSource.addEventListener("order-status", () => {
            void fetch(getApiUrl("/api/dashboard/laundry/reports/summary"), { credentials: "include" })
                .then((res) => res.ok ? res.json() : null)
                .then((payload) => {
                    const data = (payload as { data?: SummaryData } | null)?.data;
                    if (data) setSummary(data);
                })
                .catch(() => null);
        });
        return () => eventSource.close();
    }, [enableSse]);

    const topStatuses = useMemo(() => {
        return [...byStatus].sort((a, b) => b.total - a.total).slice(0, 6);
    }, [byStatus]);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Laundry Overview</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        KPI Laundry update setiap 30 detik, statistik operasional setiap 60 detik.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild className="h-9 text-xs font-semibold">
                        <Link href="/laundry/orders/new">Buat Order</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-9 text-xs font-semibold">
                        <Link href="/laundry/orders">Lihat Order</Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground">Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground">Total Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{summary.totalOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground">Order Selesai</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{summary.completedOrders}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground">Piutang</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-bold">{formatCurrency(summary.outstandingAmount)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Distribusi Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {topStatuses.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada data status.</p>
                        ) : (
                            topStatuses.map((item) => (
                                <div key={item.status} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                    <span className="text-sm font-medium">{item.status}</span>
                                    <span className="text-sm text-muted-foreground">{item.total}</span>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Outstanding Teratas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {outstanding.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada outstanding payment.</p>
                        ) : (
                            outstanding.slice(0, 6).map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/laundry/orders/${item.id}`}
                                    className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/40"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">{item.orderNumber}</p>
                                        <p className="text-xs text-muted-foreground">{item.customerName ?? "Pelanggan Umum"}</p>
                                    </div>
                                    <p className="text-sm font-semibold">{formatCurrency(item.remainingAmount)}</p>
                                </Link>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
