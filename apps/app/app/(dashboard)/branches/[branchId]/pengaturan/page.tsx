import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { SectionCard } from "@/components/dashboard/shared/section-card";

type CabangSettingsPageProps = {
    params: { branchId: string };
};

export const metadata: Metadata = {
    title: "Pengaturan Cabang | Beres",
    description: "Konfigurasi cabang",
};

export default function CabangSettingsPage({ params }: CabangSettingsPageProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Pengaturan Cabang</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        ID cabang: {params.branchId}
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href={`/cabang/${params.branchId}`}>Kembali</Link>
                </Button>
            </div>

            <SectionCard title="Info Cabang" description="Perbarui data cabang.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Nama cabang" />
                    <Input placeholder="Nomor telepon" />
                    <Input placeholder="Alamat lengkap" />
                    <Input placeholder="Kota / Area" />
                </div>
                <div className="mt-4">
                    <Button className="h-9 text-xs font-semibold">Simpan Perubahan</Button>
                </div>
            </SectionCard>
        </div>
    );
}
