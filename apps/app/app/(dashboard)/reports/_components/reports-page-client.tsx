"use client";

import { useState, useTransition } from "react";
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
import { toast } from "sonner";
import { getReportSummaryAction, getReportTableAction } from "../_actions/reports";

type ReportRange = "today" | "7d" | "30d" | "month" | "custom";

type SummaryData = {
    revenueTotal: number;
    completedOrders: number;
    cancellationRate: number;
} | null;

type TableRowData = {
    branch: { id: string; name: string };
    revenue: number;
    orders: number;
    completionRate: number;
};

type Branch = {
    id: string;
    name: string;
};

type ReportsPageClientProps = {
    initialSummary: SummaryData;
    initialTableData: TableRowData[];
    branches: Branch[];
};

const SECTIONS = [
    "Penjualan",
    "Order",
    "Inventory",
    "Pickup & Delivery",
];

function formatCurrency(value: number) {
    if (value >= 1000000000) {
        return `Rp ${(value / 1000000000).toFixed(1)}M`;
    }
    if (value >= 1000000) {
        return `Rp ${(value / 1000000).toFixed(1)}jt`;
    }
    return `Rp ${value.toLocaleString("id-ID")}`;
}

export function ReportsPageClient({
    initialSummary,
    initialTableData,
    branches,
}: ReportsPageClientProps) {
    const normalizedBranches = branches;
    const [activeSection, setActiveSection] = useState(SECTIONS[0]);
    const [range, setRange] = useState<ReportRange>("today");
    const [branchId, setBranchId] = useState<string>("all");
    const [summary, setSummary] = useState<SummaryData>(initialSummary);
    const [tableData, setTableData] = useState<TableRowData[]>(initialTableData);
    const [isPending, startTransition] = useTransition();

    const handleFilterChange = (newRange: ReportRange, newBranchId: string) => {
        startTransition(async () => {
            const [summaryResult, tableResult] = await Promise.all([
                getReportSummaryAction({
                    range: newRange,
                    branchId: newBranchId === "all" ? undefined : newBranchId,
                }),
                getReportTableAction({ range: newRange }),
            ]);

            if (summaryResult.ok) {
                setSummary(summaryResult.data);
            }
            if (tableResult.ok) {
                setTableData(tableResult.data);
            }
        });
    };

    const handleExport = (format: "pdf" | "excel") => {
        toast.info(`Export ${format.toUpperCase()} sedang dikembangkan.`);
    };

    const summaryCards = summary
        ? [
              { label: "Total Revenue", value: formatCurrency(summary.revenueTotal) },
              { label: "Order Selesai", value: summary.completedOrders.toLocaleString("id-ID") },
              { label: "Cancellation Rate", value: `${summary.cancellationRate}%` },
          ]
        : [
              { label: "Total Revenue", value: "-" },
              { label: "Order Selesai", value: "-" },
              { label: "Cancellation Rate", value: "-" },
          ];

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
                        <Select
                            value={range}
                            onValueChange={(value) => {
                                const newRange = value as ReportRange;
                                setRange(newRange);
                                handleFilterChange(newRange, branchId);
                            }}
                            disabled={isPending}
                        >
                            <SelectTrigger className="min-w-[180px]">
                                <SelectValue placeholder="Rentang tanggal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Hari Ini</SelectItem>
                                <SelectItem value="7d">7 Hari</SelectItem>
                                <SelectItem value="30d">30 Hari</SelectItem>
                                <SelectItem value="month">Bulan Ini</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={branchId}
                            onValueChange={(value) => {
                                setBranchId(value);
                                handleFilterChange(range, value);
                            }}
                            disabled={isPending}
                        >
                            <SelectTrigger className="min-w-[180px]">
                                <SelectValue placeholder="Semua cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Cabang</SelectItem>
                                {normalizedBranches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="h-9 text-xs font-semibold"
                            onClick={() => handleExport("pdf")}
                        >
                            <Download className="h-3.5 w-3.5 mr-2" />
                            PDF
                        </Button>
                        <Button
                            variant="outline"
                            className="h-9 text-xs font-semibold"
                            onClick={() => handleExport("excel")}
                        >
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Excel
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    {summaryCards.map((card) => (
                        <div key={card.label} className="rounded-xl border border-border/60 bg-card p-4">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{card.label}</p>
                            <p className="text-xl font-semibold text-foreground mt-2">
                                {isPending ? "..." : card.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-foreground">Chart Overview</p>
                        <span className="text-xs text-muted-foreground">
                            {isPending ? "Memuat..." : "Update terakhir: sekarang"}
                        </span>
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
                            {isPending ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        Memuat data...
                                    </TableCell>
                                </TableRow>
                            ) : tableData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        Tidak ada data untuk periode ini.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tableData.map((row) => (
                                    <TableRow key={row.branch.id}>
                                        <TableCell className="font-semibold">{row.branch.name}</TableCell>
                                        <TableCell>{formatCurrency(row.revenue)}</TableCell>
                                        <TableCell>{row.orders}</TableCell>
                                        <TableCell>{row.completionRate}%</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
