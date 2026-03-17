"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/table";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

const SECTIONS = [
    "Penjualan",
    "Order",
    "Inventory",
    "Pickup & Delivery",
];

const SUMMARY_CARDS = [
    { label: "Total Revenue", value: "Rp 82,4jt" },
    { label: "Order Selesai", value: "1.248" },
    { label: "Cancellation Rate", value: "2,4%" },
];

const DETAIL_ROWS = [
    { label: "Sudirman", revenue: "Rp 24,8jt", orders: 320, rate: "98%" },
    { label: "Kemang", revenue: "Rp 18,2jt", orders: 260, rate: "96%" },
    { label: "Depok", revenue: "Rp 12,9jt", orders: 210, rate: "94%" },
];

export function ReportsPageClient() {
    const [activeSection, setActiveSection] = useState(SECTIONS[0]);

    return (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Laporan</p>
                <nav className="space-y-1">
                    {SECTIONS.map((section) => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={cn(
                                "w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors",
                                activeSection === section
                                    ? "bg-muted/60 text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            {section}
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">{activeSection}</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Ringkasan metrik utama untuk {activeSection.toLowerCase()}.
                    </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Select defaultValue="today">
                            <SelectTrigger className="min-w-[180px]">
                                <SelectValue placeholder="Rentang tanggal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Hari Ini</SelectItem>
                                <SelectItem value="7d">7 Hari</SelectItem>
                                <SelectItem value="30d">30 Hari</SelectItem>
                                <SelectItem value="month">Bulan Ini</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                            <SelectTrigger className="min-w-[180px]">
                                <SelectValue placeholder="Semua cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                <SelectItem value="sudirman">Sudirman</SelectItem>
                                <SelectItem value="kemang">Kemang</SelectItem>
                                <SelectItem value="depok">Depok</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="h-9 text-xs font-semibold">
                            <Download className="h-3.5 w-3.5 mr-2" />
                            PDF
                        </Button>
                        <Button variant="outline" className="h-9 text-xs font-semibold">
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Excel
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {SUMMARY_CARDS.map((card) => (
                        <div key={card.label} className="rounded-xl border border-border/60 bg-card p-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{card.label}</p>
                            <p className="text-xl font-semibold text-foreground mt-2">{card.value}</p>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-foreground">Chart Overview</p>
                        <span className="text-xs text-muted-foreground">Update terakhir: 5 menit lalu</span>
                    </div>
                    <div className="h-48 rounded-lg border border-dashed border-border/60 bg-muted/20 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Chart akan ditampilkan di sini</span>
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cabang</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Completion Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {DETAIL_ROWS.map((row) => (
                                <TableRow key={row.label}>
                                    <TableCell className="font-semibold">{row.label}</TableCell>
                                    <TableCell>{row.revenue}</TableCell>
                                    <TableCell>{row.orders}</TableCell>
                                    <TableCell>{row.rate}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
