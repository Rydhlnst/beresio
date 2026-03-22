import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { BranchFormClient } from "./_components/branch-form-client";

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
                <BranchFormClient />
            </SectionCard>
        </div>
    );
}
