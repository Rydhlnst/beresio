"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    CreditCard,
    Users,
    Store,
    BarChart3,
    Heart,
    Settings,
    Search,
    TrendingUp,
    Package,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardPreview() {
    return (
        <div className="w-full h-full bg-[#E5F1E3] flex flex-col items-center justify-center p-8 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-white/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-[10%] right-[5%] w-[250px] h-[250px] bg-primary/5 rounded-full blur-[60px]" />

            <div className="w-full max-w-2xl space-y-8 relative z-10">
                <div className="space-y-4">
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-[#0A2540]">
                        The first <span className="text-primary italic inline-block relative">
                            eCommerce shop
                            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 100 8" preserveAspectRatio="none">
                                <path d="M0 5C30 2 70 2 100 5" stroke="currentColor" strokeWidth="3" fill="none" className="opacity-30" />
                            </svg>
                        </span> for everyone with A.I.
                    </h2>
                    <p className="text-lg font-medium text-[#425466] max-w-md">
                        Innovative software for AI-assisted shopping management
                    </p>
                </div>

                {/* Dashboard Mockup */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-[120%] lg:w-[130%] bg-white rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.12)] border border-white/50 overflow-hidden flex min-h-[500px]"
                >
                    {/* Sidebar */}
                    <div className="w-1/4 border-r border-border/40 p-6 flex flex-col gap-8 bg-[#FBFBFA]">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#0A2540] flex items-center justify-center p-1.5 shadow-lg shadow-[#0A2540]/10">
                                <svg viewBox="0 0 58 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 12C0 5.37258 5.37258 0 12 0H26V38H0V12Z" fill="white" />
                                    <path d="M0 42H26V80H12C5.37258 80 0 74.6274 0 68V42Z" fill="white" />
                                    <path d="M26 42H42C50.8366 42 58 49.1634 58 58V64C58 72.8366 50.8366 80 42 80H26V42Z" fill="white" />
                                    <path d="M26 0H42C50.8366 0 58 7.16344 58 16V22C58 30.8366 50.8366 38 42 38H26V0Z" fill="white" />
                                </svg>
                            </div>
                            <span className="font-bold text-[#0A2540] tracking-tight">SwiglyBusiness</span>
                        </div>

                        <nav className="flex flex-col gap-2">
                            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
                            <NavItem icon={<CreditCard size={18} />} label="My bank" />
                            <NavItem icon={<Users size={18} />} label="My clients" />
                            <NavItem icon={<Store size={18} />} label="My store" />
                            <NavItem icon={<BarChart3 size={18} />} label="My analytics" />
                            <NavItem icon={<Heart size={18} />} label="My experiences" />
                        </nav>

                        <div className="mt-auto space-y-4">
                            <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-3">Team members (12)</div>
                            <div className="h-10 w-3/4 bg-muted/20 rounded-xl" />
                            <NavItem icon={<Search size={18} />} label="Support" />
                            <NavItem icon={<Settings size={18} />} label="Settings" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 flex flex-col gap-8 bg-white">
                        <header className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-[#0A2540]">Overview</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                                <div className="pl-10 pr-4 py-2 bg-muted/20 rounded-xl text-xs font-medium text-muted-foreground/40 w-48 flex items-center justify-between">
                                    <span>Search with AI</span>
                                    <span className="text-[10px] bg-white rounded px-1 border border-border/20 shadow-sm">/</span>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-3 gap-6">
                            <StatCard label="Products sold" value="12,400" icon={<Package className="text-blue-500" />} />
                            <StatCard label="Orders placed" value="4,850" icon={<TrendingUp className="text-emerald-500" />} />
                            <StatCard label="Unique customers" value="8,100" />
                        </div>

                        <div className="flex-1 flex gap-6">
                            <div className="w-1/2 bg-[#FBFBFA] rounded-3xl border border-border/20 p-6">
                                <div className="text-xs font-bold text-muted-foreground/60 mb-8">Sales</div>
                                <div className="space-y-4">
                                    <div className="h-4 w-1/2 bg-muted/20 rounded-full" />
                                    <div className="h-24 w-full bg-muted/10 rounded-xl" />
                                </div>
                            </div>
                            <div className="w-1/2 bg-[#FBFBFA] rounded-3xl border border-border/20 p-6">
                                <div className="text-xs font-bold text-muted-foreground/60 mb-8">Analytics</div>
                                <div className="flex items-end justify-between h-24 gap-1">
                                    {[30, 60, 45, 80, 50, 90, 65].map((h, i) => (
                                        <div key={i} className="flex-1 bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="text-xs font-bold text-muted-foreground/60">Recent activity</div>
                            <div className="w-full h-32 bg-[#FBFBFA] rounded-3xl border border-border/20" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer",
            active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}>
            {icon}
            <span>{label}</span>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
    return (
        <div className="p-6 rounded-3xl border border-border/10 bg-[#FBFBFA] space-y-4">
            <div className="text-[11px] font-bold text-muted-foreground/60 tracking-tight">{label}</div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#0A2540]">{value}</span>
                {icon && <div className="h-8 w-8 rounded-xl bg-white shadow-sm flex items-center justify-center p-2">{icon}</div>}
            </div>
        </div>
    );
}
