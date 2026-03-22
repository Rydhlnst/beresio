"use client";

import Link from "next/link";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { BranchFormClient, type BranchPayload } from "./_components/branch-form-client";
import { createBranchAction } from "../_actions/branches";
import { toast } from "sonner";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { useState } from "react";

export default function CabangNewPage() {
    const router = useTransitionRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (payload: BranchPayload) => {
        setIsSubmitting(true);

        // Generate branch code from name (first 3 chars + random 3 digits)
        const codePrefix = payload.nama_cabang
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 3)
            .toUpperCase();
        const codeNumber = Math.floor(100 + Math.random() * 900);
        const code = `${codePrefix}-${codeNumber}`;

        const result = await createBranchAction({
            name: payload.nama_cabang,
            code,
            address: payload.alamat_lengkap,
            phone: payload.nomor_telepon,
            isActive: true,
        });

        setIsSubmitting(false);

        if (!result.ok) {
            toast.error(result.error || "Gagal membuat cabang.");
            return;
        }

        toast.success("Cabang berhasil dibuat!");
        router.push("/cabang");
    };

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
                <BranchFormClient onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </SectionCard>
        </div>
    );
}
