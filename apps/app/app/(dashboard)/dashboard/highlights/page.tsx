import Link from "next/link";
import { Metadata } from "next";
import { headers } from "next/headers";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { apiClient } from "@/lib/api-client";
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
    title: "Highlights | Beres",
    description: "Kelola highlight performa bisnis",
};

export default async function DashboardHighlightsPage() {
    const cookie = (await headers()).get("cookie") || "";
    const highlightsRes = await apiClient.api.dashboard.highlights.$get(undefined, {
        headers: { cookie },
    });

    if (!highlightsRes.ok) {
        console.error("Failed to fetch highlights:", await highlightsRes.text());
    }

    const body = highlightsRes.ok ? await highlightsRes.json() : null;
    const highlights = (body as any)?.data ?? [];

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

            {highlights.length === 0 ? (
                <CardEmptyState
                    icon={AlertTriangle}
                    title="Belum ada highlight"
                    description="Buat highlight pertama untuk ditampilkan di dashboard."
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {highlights.map((item: any) => (
                        <SectionCard
                            key={item.id}
                            title={item.title ?? "Highlight"}
                            description={item.description ?? "Belum ada deskripsi"}
                        >
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
            )}
        </div>
    );
}
