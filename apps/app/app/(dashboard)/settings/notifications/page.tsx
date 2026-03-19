import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Notification Settings | Beres",
    description: "Kelola preferensi notifikasi",
};

export default function SettingsNotificationsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Notifikasi</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Atur notifikasi untuk order, stok, dan laporan.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/settings">Kembali</Link>
                </Button>
            </div>

            <SectionCard title="Email Ringkasan Harian" description="Kirim ringkasan performa setiap hari.">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Status: Nonaktif</p>
                        <p className="text-xs text-muted-foreground">Dikirim ke owner organisasi.</p>
                    </div>
                    <Button className="h-8 text-xs font-semibold">Aktifkan</Button>
                </div>
            </SectionCard>

            <SectionCard title="Notifikasi Stok Rendah" description="Peringatan saat stok di bawah batas aman.">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground">Status: Aktif</p>
                        <p className="text-xs text-muted-foreground">Dikirim ke branch manager.</p>
                    </div>
                    <Button variant="outline" className="h-8 text-xs font-semibold">Kelola</Button>
                </div>
            </SectionCard>
        </div>
    );
}
