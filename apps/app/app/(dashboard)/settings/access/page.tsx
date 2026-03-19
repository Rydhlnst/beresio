import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Access Settings | Beres",
    description: "Kelola role dan izin akses",
};

export default function SettingsAccessPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Akses & Role</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Atur role, izin, dan undangan anggota tim.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/settings">Kembali</Link>
                </Button>
            </div>

            <SectionCard title="Kelola Role" description="Buat dan atur role sesuai kebutuhan tim.">
                <div className="flex flex-wrap gap-3">
                    <Button className="h-9 text-xs font-semibold" asChild>
                        <Link href="/tim/roles">Lihat Role</Link>
                    </Button>
                    <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                        <Link href="/tim/roles/new">Buat Role Baru</Link>
                    </Button>
                </div>
            </SectionCard>

            <SectionCard title="Undangan Anggota" description="Pantau undangan anggota yang masih pending.">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground">3 undangan pending</p>
                        <p className="text-xs text-muted-foreground">Terakhir dikirim 2 hari lalu.</p>
                    </div>
                    <Button variant="outline" className="h-8 text-xs font-semibold" asChild>
                        <Link href="/tim">Kelola Undangan</Link>
                    </Button>
                </div>
            </SectionCard>
        </div>
    );
}
