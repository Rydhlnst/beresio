import Link from "next/link";
import { Metadata } from "next";
import { complianceConfig } from "@repo/ui/compliance";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Billing Settings",
    description: "Kelola paket, kesiapan gateway, dan status billing",
};

export default function SettingsBillingPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kelola paket aktif, kesiapan gateway, dan status transaksi billing secara transparan.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/settings">Kembali</Link>
                </Button>
            </div>

            <SectionCard
                title="Status Billing Saat Ini"
                description="Mode tampilan billing saat ini adalah compliance-ready demo mode."
                actions={
                    <Badge variant="outline" className="text-[11px] font-semibold border-amber-300/60 text-amber-900 bg-amber-50">
                        Demo Mode
                    </Badge>
                }
            >
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">Belum ada charge live yang dijalankan dari halaman ini.</p>
                    <p>
                        Aktifkan koneksi production gateway setelah legal profile, kebijakan, dan flow status transaksi dinyatakan siap.
                    </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Button className="h-9 text-xs font-semibold" asChild>
                        <Link href="https://beres.cloud/billing/checkout" target="_blank" rel="noreferrer">Buka Checkout Demo</Link>
                    </Button>
                    <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                        <Link href="https://beres.cloud/billing/status/INV-DEMO-240415?state=pending" target="_blank" rel="noreferrer">Lihat Status Demo</Link>
                    </Button>
                </div>
            </SectionCard>

            <SectionCard title="Riwayat Invoice" description="Data invoice ditarik dari sistem billing saat integrasi live aktif.">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Belum ada invoice live untuk ditampilkan. Setelah aktivasi production, daftar invoice akan muncul otomatis di sini.
                </div>
            </SectionCard>

            <SectionCard title="Kanal Billing Resmi" description="Gunakan kanal resmi untuk pertanyaan billing dan pengaduan.">
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p><span className="font-semibold text-foreground">Support:</span> {complianceConfig.supportEmail}</p>
                    <p><span className="font-semibold text-foreground">Pengaduan:</span> {complianceConfig.complaintChannel}</p>
                    <p><span className="font-semibold text-foreground">Jam layanan:</span> {complianceConfig.businessHours}</p>
                </div>
            </SectionCard>
        </div>
    );
}
