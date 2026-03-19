import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Tambah Cabang | Beres",
    description: "Tambah cabang baru untuk organisasi",
};

export default function CabangNewPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Tambah Cabang</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Lengkapi data cabang baru untuk mulai monitoring performa.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/cabang">Kembali</Link>
                </Button>
            </div>

            <SectionCard title="Detail Cabang" description="Informasi dasar cabang baru.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Nama cabang" />
                    <Input placeholder="Kota / Area" />
                    <Input placeholder="Alamat lengkap" />
                    <Input placeholder="Nomor telepon" />
                </div>
                <div className="mt-4">
                    <Button className="h-9 text-xs font-semibold">Simpan Cabang</Button>
                </div>
            </SectionCard>
        </div>
    );
}
