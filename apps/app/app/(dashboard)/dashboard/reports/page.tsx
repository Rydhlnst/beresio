import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Dashboard Reports | Beres",
    description: "Ringkasan laporan dan ekspor data",
};

const REPORTS = [
    {
        id: "report-1",
        title: "Laporan Penjualan Harian",
        description: "Ringkasan transaksi per hari.",
    },
    {
        id: "report-2",
        title: "Laporan Produk Terlaris",
        description: "Produk dengan performa terbaik.",
    },
    {
        id: "report-3",
        title: "Laporan Cabang",
        description: "Performa cabang dan kontribusi revenue.",
    },
];

export default function DashboardReportsPage() {
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

            <div className="grid gap-4 sm:grid-cols-2">
                {REPORTS.map((report) => (
                    <SectionCard key={report.id} title={report.title} description={report.description}>
                        <div className="flex items-center gap-2">
                            <Button className="h-8 text-xs font-semibold">Buka</Button>
                            <Button variant="outline" className="h-8 text-xs font-semibold">Export</Button>
                        </div>
                    </SectionCard>
                ))}
            </div>
        </div>
    );
}
