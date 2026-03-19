import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Profile Settings | Beres",
    description: "Kelola profil pengguna",
};

export default function SettingsProfilePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Profil</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Perbarui data akun dan preferensi pribadi.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/settings">Kembali</Link>
                </Button>
            </div>

            <SectionCard title="Informasi Akun" description="Lengkapi data dasar akun Anda.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Nama lengkap" />
                    <Input placeholder="Email" type="email" />
                    <Input placeholder="Nomor WhatsApp" />
                    <Input placeholder="Jabatan" />
                </div>
                <div className="mt-4">
                    <Button className="h-9 text-xs font-semibold">Simpan Perubahan</Button>
                </div>
            </SectionCard>
        </div>
    );
}
