import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { SectionCard } from "@/components/dashboard/shared/section-card";

type CabangDetailPageProps = {
    params: { branchId: string };
};

export const metadata: Metadata = {
    title: "Detail Cabang | Beres",
    description: "Detail performa cabang",
};

export default function CabangDetailPage({ params }: CabangDetailPageProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Detail Cabang</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        ID cabang: {params.branchId}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                        <Link href="/cabang">Kembali</Link>
                    </Button>
                    <Button className="h-9 text-xs font-semibold" asChild>
                        <Link href={`/cabang/${params.branchId}/pengaturan`}>Pengaturan</Link>
                    </Button>
                </div>
            </div>

            <SectionCard title="Status Cabang" description="Ringkasan status operasional cabang.">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[11px] font-semibold border-emerald-200 bg-emerald-50 text-emerald-700">
                        Aktif
                    </Badge>
                    <span className="text-xs text-muted-foreground">Terakhir update 10 menit lalu.</span>
                </div>
            </SectionCard>

            <SectionCard title="Performa Singkat" description="Ringkasan order dan revenue.">
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                        <p className="text-xs text-muted-foreground">Order Hari Ini</p>
                        <p className="text-lg font-semibold text-foreground">32</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                        <p className="text-xs text-muted-foreground">Revenue Hari Ini</p>
                        <p className="text-lg font-semibold text-foreground">Rp 1.250.000</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                        <p className="text-xs text-muted-foreground">Staff Aktif</p>
                        <p className="text-lg font-semibold text-foreground">6</p>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}
