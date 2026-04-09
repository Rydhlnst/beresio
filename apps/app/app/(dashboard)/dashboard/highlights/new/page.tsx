import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { createHighlightAction } from "../_actions/highlights";

export const metadata: Metadata = {
    title: "Buat Highlight",
    description: "Buat highlight baru untuk dashboard",
};

export default function DashboardHighlightNewPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Buat Highlight</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Tambahkan insight yang ingin ditampilkan di dashboard.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/dashboard/highlights">Kembali</Link>
                </Button>
            </div>

            <form action={createHighlightAction}>
                <SectionCard title="Detail Highlight" description="Isi informasi ringkas highlight.">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input name="title" placeholder="Judul highlight" required />
                        <Input name="category" placeholder="Kategori (mis. Revenue, Order)" />
                    </div>
                    <div className="mt-4">
                        <Input name="description" placeholder="Deskripsi singkat" />
                    </div>
                    <div className="mt-4">
                        <Button type="submit" className="h-9 text-xs font-semibold">
                            Simpan Highlight
                        </Button>
                    </div>
                </SectionCard>
            </form>
        </div>
    );
}
