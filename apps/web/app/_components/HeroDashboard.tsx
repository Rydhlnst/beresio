"use client";

/**
 * HeroDashboard.tsx — Komponen berat yang di-lazy load via dynamic import.
 * Berisi: DashboardMockup + SocialProof (framer-motion counter).
 * Tidak dirender di server (ssr: false) untuk mempercepat LCP.
 */

import {
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    Package,
    Truck,
    CheckCircle2,
    LayoutDashboard,
    CreditCard,
    Box,
    BarChart3,
    Users,
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import { Heading, Text } from "@repo/ui";
import { Google, Meta, Amazon, Microsoft, Netflix, Airbnb, Sanity } from "@repo/ui";
import { BrowserMockup } from "./BrowserMockup";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const stats = [
    { label: "Revenue Hari Ini", value: "Rp 4.250.000", change: "+12%", trend: "up", icon: TrendingUp },
    { label: "Order Aktif", value: "24", change: "+3 baru", trend: "up", icon: ShoppingCart },
    { label: "Stok Menipis", value: "5 item", change: "Perlu restock", trend: "down", icon: Package },
    { label: "Driver Aktif", value: "8", change: "2 dalam perjalanan", trend: "neutral", icon: Truck },
];

const orders = [
    { id: "ORD-0041", customer: "Budi Santoso", amount: "Rp 85.000", status: "processing", time: "2 mnt lalu", branch: "Cab. Bandung" },
    { id: "ORD-0040", customer: "Siti Rahayu", amount: "Rp 120.000", status: "ready", time: "8 mnt lalu", branch: "Cab. Jakarta" },
    { id: "ORD-0039", customer: "Ahmad Fauzi", amount: "Rp 55.000", status: "delivered", time: "15 mnt lalu", branch: "Cab. Bandung" },
    { id: "ORD-0038", customer: "Rina Kusuma", amount: "Rp 210.000", status: "processing", time: "22 mnt lalu", branch: "Cab. Surabaya" },
];

const statusConfig = {
    processing: { label: "Diproses", className: "bg-secondary/50 text-secondary-foreground border-secondary/60", dot: "bg-secondary-foreground/70" },
    ready: { label: "Siap", className: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
    delivered: { label: "Selesai", className: "bg-muted/40 text-muted-foreground border-border/60", dot: "bg-muted-foreground/70" },
};

const branches = [
    { name: "Cab. Bandung", orders: 14, revenue: "Rp 1.820.000", fill: 75 },
    { name: "Cab. Jakarta", orders: 7, revenue: "Rp 1.540.000", fill: 60 },
    { name: "Cab. Surabaya", orders: 3, revenue: "Rp 890.000", fill: 35 },
];

const logos = [
    { name: "Google", icon: Google },
    { name: "Meta", icon: Meta },
    { name: "Amazon", icon: Amazon },
    { name: "Microsoft", icon: Microsoft },
    { name: "Netflix", icon: Netflix },
    { name: "Airbnb", icon: Airbnb },
    { name: "Sanity", icon: Sanity },
];

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, change, trend, icon: Icon }: typeof stats[0]) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/50">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            </div>
            <div>
                <p className="text-xl font-bold tracking-tight text-foreground">{value}</p>
                <p className={cn(
                    "mt-0.5 text-[11px] font-medium",
                    trend === "up" && "text-primary",
                    trend === "down" && "text-destructive",
                    trend === "neutral" && "text-muted-foreground",
                )}>{change}</p>
            </div>
        </div>
    );
}

// ─── DASHBOARD MOCKUP ─────────────────────────────────────────────────────────

function DashboardMockup() {
    return (
        <div className="relative w-full py-[clamp(2rem,5vw,3rem)] px-0">
            <div className="mx-auto max-w-7xl rounded-[2rem] rounded-b-none bg-muted/30 p-[clamp(1rem,3vw,4rem)] border border-border/60 shadow-inner">
                <div className="relative mx-auto w-full max-w-5xl">
                    <BrowserMockup url="app.beres.io/dashboard">
                        <div className="flex" style={{ height: "clamp(320px, 50vw, 560px)" }}>
                            {/* Sidebar — hidden on small viewports */}
                            <div className="hidden sm:flex w-[clamp(9rem,14vw,14rem)] shrink-0 flex-col gap-1 border-r border-border/60 bg-muted/30 px-3 py-4">
                                <div className="mb-3 flex items-center gap-2 px-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                                        <span className="text-[10px] font-bold text-white">B</span>
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">beres</span>
                                </div>
                                <div className="mb-2 flex items-center justify-between rounded-lg bg-background border border-border/60 px-2.5 py-2">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground">Cabang aktif</p>
                                        <p className="text-xs font-semibold text-foreground">Semua Cabang</p>
                                    </div>
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                </div>
                                {[
                                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                                    { icon: CreditCard, label: "Kasir (POS)", active: false },
                                    { icon: Box, label: "Inventori", active: false },
                                    { icon: Truck, label: "Pengiriman", active: false },
                                    { icon: Users, label: "Pelanggan", active: false },
                                    { icon: BarChart3, label: "Laporan", active: false },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                                            item.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60"
                                        )}
                                    >
                                        <item.icon className={cn("h-3.5 w-3.5", item.active ? "text-primary-foreground" : "text-muted-foreground/70")} />
                                        {item.label}
                                    </div>
                                ))}
                            </div>

                            {/* Main content */}
                            <div className="flex-1 overflow-hidden bg-muted/20 p-[clamp(0.75rem,2vw,1.25rem)]">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <Heading as="h2" className="text-sm">Dashboard</Heading>
                                        <p className="text-[11px] text-muted-foreground">Senin, 3 Maret 2026</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                                        <span className="text-[11px] font-medium text-primary">Live</span>
                                    </div>
                                </div>
                                <div className="mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                                    {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                                    {/* Recent orders */}
                                    <div className="rounded-xl border border-border/60 bg-background shadow-sm">
                                        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
                                            <p className="text-xs font-semibold text-foreground">Order Terbaru</p>
                                            <button className="text-[11px] font-medium text-primary hover:underline">Lihat semua</button>
                                        </div>
                                        <div className="divide-y divide-border/60">
                                            {orders.map((order) => {
                                                const s = statusConfig[order.status as keyof typeof statusConfig];
                                                return (
                                                    <div key={order.id} className="flex items-center gap-3 px-4 py-2.5">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] font-semibold text-foreground">{order.customer}</span>
                                                                <span className="text-[10px] text-muted-foreground/60">·</span>
                                                                <span className="text-[10px] text-muted-foreground">{order.branch}</span>
                                                            </div>
                                                            <p className="text-[10px] text-muted-foreground">{order.id} · {order.time}</p>
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-foreground">{order.amount}</span>
                                                        <span className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium", s.className)}>
                                                            <span className={cn("h-1 w-1 rounded-full", s.dot)} />
                                                            {s.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    {/* Branch performance */}
                                    <div className="rounded-xl border border-border/60 bg-background shadow-sm">
                                        <div className="border-b border-border/60 px-4 py-3">
                                            <Heading as="h4" className="text-xs">Performa Cabang</Heading>
                                        </div>
                                        <div className="flex flex-col gap-3 p-4">
                                            {branches.map((branch) => (
                                                <div key={branch.name} className="space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[11px] font-medium text-foreground">{branch.name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{branch.orders} order</p>
                                                    </div>
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                                                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${branch.fill}%` }} />
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">{branch.revenue}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </BrowserMockup>

                    {/* Floating badges */}
                    <div className="absolute -left-4 top-16 hidden xl:flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 shadow-lg shadow-muted/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <div>
                            <p className="text-[11px] font-semibold text-foreground">Order #0041 Selesai</p>
                            <p className="text-[10px] text-muted-foreground">Baru saja · Cab. Bandung</p>
                        </div>
                    </div>
                    <div className="absolute -right-4 bottom-20 hidden xl:flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3.5 py-2.5 shadow-lg shadow-muted/10">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                            <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-foreground">Revenue naik 12%</p>
                            <p className="text-[10px] text-muted-foreground">vs. minggu lalu</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── COUNTER ──────────────────────────────────────────────────────────────────

function Counter({ from, to }: { from: number; to: number }) {
    const count = useMotionValue(from);
    const rounded = useTransform(count, (latest: number) => Math.round(latest));
    const [display, setDisplay] = useState(from);

    useEffect(() => {
        const controls = animate(count, to, { duration: 2, ease: "easeOut", delay: 0.5 });
        return controls.stop;
    }, [count, to]);

    useEffect(() => {
        return rounded.on("change", (latest: number) => setDisplay(latest));
    }, [rounded]);

    return <span>{display}</span>;
}

// ─── SOCIAL PROOF ─────────────────────────────────────────────────────────────

function SocialProof() {
    return (
        <div className="pt-[clamp(4rem,6vw,8rem)] pb-16 flex flex-col items-start gap-8 border-t border-border/40 relative z-10 w-full text-start">
            <div className="flex flex-col items-start gap-3">
                <Text variant="overline" className="mb-2">Coming Soon</Text>
                <Heading as="h4" className="text-2xl font-bold tracking-tight text-foreground">
                    Siap Merevolusi 500+ UMKM di 24 Kota
                </Heading>
                <Text variant="muted">
                    Jadilah bagian dari komunitas bisnis yang akan berkembang bersama Beres.io.
                </Text>
            </div>
            <div className="flex flex-wrap justify-start gap-x-12 gap-y-6 items-center">
                {logos.map((logo) => (
                    <div key={logo.name} className="flex items-center opacity-30 hover:opacity-100 transition-opacity duration-500 group cursor-default">
                        <logo.icon className="h-6 w-auto grayscale" />
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-8 group">
                <div className="h-10 w-[1px] bg-border/60 hidden lg:block" />
                <div className="text-start transition-transform duration-500 group-hover:translate-x-1">
                    <Heading as="h4" className="text-4xl tracking-tighter flex items-baseline gap-1 justify-start">
                        <Counter from={0} to={500} />
                        <span className="text-primary text-2xl">+</span>
                    </Heading>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mt-1">
                        Antrean Wishlist
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export function HeroDashboard() {
    return (
        <>
            <div className="pb-0">
                <DashboardMockup />
            </div>
            <SocialProof />
        </>
    );
}
