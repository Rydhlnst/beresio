import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Billing Settings",
    description: "Kelola paket dan pembayaran",
};

export default function SettingsBillingPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Lihat paket aktif, riwayat invoice, dan upgrade plan.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/settings">Kembali</Link>
                </Button>
            </div>

            <SectionCard
                title="Paket Aktif"
                description="Ringkasan langganan organisasi."
                actions={
                    <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary bg-primary/10">
                        Aktif
                    </Badge>
                }
            >
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Starter Plan</p>
                    <p className="text-xs text-muted-foreground">
                        Batas cabang dan user mengikuti paket starter. Upgrade kapan saja.
                    </p>
                </div>
                <div className="mt-4">
                    <Button className="h-9 text-xs font-semibold">Upgrade Paket</Button>
                </div>
            </SectionCard>

            <SectionCard title="Invoice Terbaru" description="Riwayat pembayaran terakhir.">
                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Feb 2026</p>
                            <p className="text-xs text-muted-foreground">Rp 299.000</p>
                        </div>
                        <Button variant="outline" className="h-8 text-xs font-semibold">Unduh</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Jan 2026</p>
                            <p className="text-xs text-muted-foreground">Rp 299.000</p>
                        </div>
                        <Button variant="outline" className="h-8 text-xs font-semibold">Unduh</Button>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}
