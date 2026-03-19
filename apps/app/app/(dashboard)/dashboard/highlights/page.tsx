import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Highlights | Beres",
    description: "Kelola highlight performa bisnis",
};

const HIGHLIGHTS = [
    {
        id: "highlight-01",
        title: "Revenue naik 12%",
        description: "Perbandingan minggu ini vs minggu lalu.",
    },
    {
        id: "highlight-02",
        title: "Order pickup stabil",
        description: "Rata-rata 32 order per hari.",
    },
];

export default function DashboardHighlightsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Highlights</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Susun highlight performa yang ingin ditampilkan di dashboard.
                    </p>
                </div>
                <Button className="h-9 text-xs font-semibold" asChild>
                    <Link href="/dashboard/highlights/new">Buat Highlight</Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {HIGHLIGHTS.map((item) => (
                    <SectionCard key={item.id} title={item.title} description={item.description}>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="h-8 text-xs font-semibold" asChild>
                                <Link href={`/dashboard/highlights/${item.id}`}>Lihat Detail</Link>
                            </Button>
                            <Button variant="outline" className="h-8 text-xs font-semibold" asChild>
                                <Link href={`/dashboard/highlights/${item.id}`}>Edit</Link>
                            </Button>
                        </div>
                    </SectionCard>
                ))}
            </div>
        </div>
    );
}
