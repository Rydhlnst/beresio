import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Buat Role | Beres",
    description: "Tambah role baru untuk tim",
};

export default function RoleNewPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Buat Role Baru</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Buat role khusus sesuai kebutuhan organisasi.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/tim/roles">Kembali</Link>
                </Button>
            </div>

            <SectionCard title="Informasi Role" description="Nama dan deskripsi role.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Nama role" />
                    <Input placeholder="Slug (opsional)" />
                </div>
                <div className="mt-4">
                    <Input placeholder="Deskripsi singkat" />
                </div>
                <div className="mt-4">
                    <Button className="h-9 text-xs font-semibold">Simpan Role</Button>
                </div>
            </SectionCard>
        </div>
    );
}
