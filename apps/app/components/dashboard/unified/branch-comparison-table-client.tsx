"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";

import { SectionCard } from "@/components/dashboard/shared/section-card";

type BranchComparisonRow = {
    branchId: string;
    branchCode: string;
    branchName: string;
    isActive: boolean;
    revenue: number;
    orderCount: number;
    quickLink: string;
};

type SortKey = "revenue" | "orderCount" | "branchName";

type BranchComparisonTableClientProps = {
    rows: BranchComparisonRow[];
};

export function BranchComparisonTableClient({ rows }: BranchComparisonTableClientProps) {
    const [sortKey, setSortKey] = useState<SortKey>("revenue");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const currencyFormatter = useMemo(() => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        });
    }, []);

    const sortedRows = useMemo(() => {
        return [...rows].sort((a, b) => {
            const dir = sortDirection === "asc" ? 1 : -1;
            if (sortKey === "branchName") {
                return a.branchName.localeCompare(b.branchName) * dir;
            }
            return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
        });
    }, [rows, sortDirection, sortKey]);

    const toggleSort = (nextKey: SortKey) => {
        if (sortKey === nextKey) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(nextKey);
        setSortDirection(nextKey === "branchName" ? "asc" : "desc");
    };

    return (
        <SectionCard title="Branch Comparison" description="Perbandingan performa antar cabang.">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                    <thead>
                        <tr className="border-b border-border/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="py-2 pr-3">Branch</th>
                            <th className="py-2 px-3">
                                <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("revenue")}>
                                    Revenue
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                </button>
                            </th>
                            <th className="py-2 px-3">
                                <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("orderCount")}>
                                    Orders
                                    <ArrowUpDown className="h-3.5 w-3.5" />
                                </button>
                            </th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 pl-3 text-right">Quick Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.map((row) => (
                            <tr key={row.branchId} className="border-b border-border/50 last:border-b-0">
                                <td className="py-3 pr-3">
                                    <p className="font-semibold text-foreground">{row.branchName}</p>
                                    <p className="text-xs text-muted-foreground uppercase">{row.branchCode}</p>
                                </td>
                                <td className="py-3 px-3 font-semibold text-foreground">
                                    {currencyFormatter.format(row.revenue)}
                                </td>
                                <td className="py-3 px-3 text-foreground">{row.orderCount}</td>
                                <td className="py-3 px-3">
                                    <Badge
                                        variant="outline"
                                        className={row.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
                                    >
                                        {row.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </td>
                                <td className="py-3 pl-3 text-right">
                                    <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                                        <Link href={row.quickLink}>Buka Cabang</Link>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </SectionCard>
    );
}
