import Link from "next/link";
import { Metadata } from "next";
import { headers } from "next/headers";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { apiClient } from "@/lib/api-client";
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
    title: "Dashboard Reports",
    description: "Ringkasan laporan dan ekspor data",
};

export default async function DashboardReportsPage() {
    const cookie = (await headers()).get("cookie") || "";
    const reportsRes = await apiClient.api.dashboard.reports.catalog.$get(undefined, {
        headers: { cookie },
    });

    if (!reportsRes.ok) {
        console.error("Failed to fetch report catalog:", await reportsRes.text());
    }

    const body = reportsRes.ok ? await reportsRes.json() : null;
    const reports = (body as any)?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Dashboard Reports</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Pilih laporan yang ingin diekspor atau dibagikan.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/dashboard">Kembali ke Dashboard</Link>
                </Button>
            </div>

            {reports.length === 0 ? (
                <CardEmptyState
                    icon={AlertTriangle}
                    title="Belum ada laporan"
                    description="Katalog laporan belum tersedia."
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {reports.map((report: any) => (
                        <SectionCard
                            key={report.id}
                            title={report.name ?? "Laporan"}
                            description={`ID laporan: ${report.id}`}
                        >
                            <div className="flex items-center gap-2">
                                <Button className="h-8 text-xs font-semibold">Buka</Button>
                                <Button variant="outline" className="h-8 text-xs font-semibold">Export</Button>
                            </div>
                        </SectionCard>
                    ))}
                </div>
            )}
        </div>
    );
}
