import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";

type HighlightPageProps = {
    params: { highlightId: string };
};

export const metadata: Metadata = {
    title: "Detail Highlight | Beres",
    description: "Detail highlight dashboard",
};

export default function DashboardHighlightDetailPage({ params }: HighlightPageProps) {
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

            <SectionCard title="Ringkasan" description="Preview highlight di dashboard.">
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Judul highlight</p>
                    <p className="text-xs text-muted-foreground">
                        Deskripsi singkat highlight akan muncul di sini.
                    </p>
                </div>
                <div className="mt-4 flex gap-2">
                    <Button className="h-9 text-xs font-semibold">Edit Highlight</Button>
                    <Button variant="outline" className="h-9 text-xs font-semibold">Arsipkan</Button>
                </div>
            </SectionCard>
        </div>
    );
}
