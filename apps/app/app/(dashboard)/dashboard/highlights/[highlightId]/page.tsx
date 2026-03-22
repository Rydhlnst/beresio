import Link from "next/link";
import { Metadata } from "next";
import { headers } from "next/headers";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { apiClient } from "@/lib/api-client";
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { AlertTriangle } from "lucide-react";
import { archiveHighlightAction } from "../_actions/highlights";

type HighlightPageProps = {
    params: { highlightId: string };
};

export const metadata: Metadata = {
    title: "Detail Highlight | Beres",
    description: "Detail highlight dashboard",
};

export default async function DashboardHighlightDetailPage({ params }: HighlightPageProps) {
    const cookie = (await headers()).get("cookie") || "";
    const highlightRes = await apiClient.api.dashboard.highlights[":id"].$get(
        { param: { id: params.highlightId } },
        { headers: { cookie } }
    );

    if (!highlightRes.ok) {
        console.error("Failed to fetch highlight:", await highlightRes.text());
    }

    const body = highlightRes.ok ? await highlightRes.json() : null;
    const highlight = (body as any)?.data ?? null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Detail Highlight</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        ID highlight: {params.highlightId}
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/dashboard/highlights">Kembali</Link>
                </Button>
            </div>

            {!highlight ? (
                <CardEmptyState
                    icon={AlertTriangle}
                    title="Highlight tidak ditemukan"
                    description="Highlight ini mungkin sudah dihapus atau diarsipkan."
                />
            ) : (
                <SectionCard title="Ringkasan" description="Preview highlight di dashboard.">
                    <div className="space-y-2 text-sm">
                        <p className="font-semibold text-foreground">{highlight.title ?? "Judul highlight"}</p>
                        <p className="text-xs text-muted-foreground">
                            {highlight.description ?? "Belum ada deskripsi highlight."}
                        </p>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button className="h-9 text-xs font-semibold">Edit Highlight</Button>
                        <form action={archiveHighlightAction.bind(null, highlight.id)}>
                            <Button variant="outline" className="h-9 text-xs font-semibold" type="submit">
                                Arsipkan
                            </Button>
                        </form>
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
