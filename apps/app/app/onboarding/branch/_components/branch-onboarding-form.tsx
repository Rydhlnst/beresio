"use client";

import { useState } from "react";
import { toast } from "sonner";

import { BranchFormClient, type BranchPayload } from "@/app/(dashboard)/branches/new/_components/branch-form-client";
import { createBranchAction } from "@/app/(dashboard)/branches/_actions/branches";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { bootstrapRbacForActiveOrg } from "@/app/onboarding/_actions/rbac";
import { updateOnboardingMetadataAction } from "@/app/onboarding/_actions/organization";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

interface BranchOnboardingFormProps {
    organizationId?: string;
    mode: "single" | "multi";
}

const MAX_CODE_ATTEMPTS = 5;

function buildBranchCode(branchName: string, attempt: number) {
    const compact = branchName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const prefix = (compact.slice(0, 3) || "BRN").padEnd(3, "X");
    const randomBlock = Math.floor(100 + Math.random() * 900).toString();
    const attemptSuffix = attempt > 0 ? attempt.toString() : "";
    return `${prefix}${randomBlock}${attemptSuffix}`.slice(0, 10);
}

function buildBranchAddress(payload: BranchPayload) {
    const area = [payload.kelurahan, payload.kecamatan, payload.kota, payload.provinsi]
        .map((part) => part?.trim())
        .filter(Boolean)
        .join(", ");
    if (!area) return payload.alamat_lengkap;
    return `${payload.alamat_lengkap} (${area})`;
}

function buildFirstBranchHours(openTime: string, closeTime: string, timezone: string) {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    return {
        timezone,
        schedule: days.map((day) => ({
            day,
            open: openTime,
            close: closeTime,
        })),
    };
}

export function BranchOnboardingForm({ organizationId, mode }: BranchOnboardingFormProps) {
    const { replace } = useTransitionRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [openTime, setOpenTime] = useState("09:00");
    const [closeTime, setCloseTime] = useState("21:00");
    const [timezone, setTimezone] = useState("Asia/Jakarta");

    async function onSubmit(payload: BranchPayload) {
        setIsLoading(true);
        try {
            const branchName = mode === "single" ? "Cabang Utama" : payload.nama_cabang;
            let lastError: string | null = null;
            for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
                const code = buildBranchCode(branchName, attempt);
                const result = await createBranchAction({
                    name: branchName,
                    code,
                    address: buildBranchAddress(payload),
                    phone: payload.nomor_telepon,
                    isActive: true,
                });

                if (result.ok) {
                    const bootstrapResult = await bootstrapRbacForActiveOrg();
                    if (!bootstrapResult.ok) {
                        toast.error("Role akses belum tersinkron. Silakan refresh setelah onboarding.");
                    }

                    const metadataResult = await updateOnboardingMetadataAction({
                        branchSetupCompleted: true,
                        branchSetupCompletedAt: new Date().toISOString(),
                        firstBranchId: result.data?.id ?? null,
                        firstBranchHours: buildFirstBranchHours(openTime, closeTime, timezone),
                    });
                    if (!metadataResult.ok) {
                        toast.error(metadataResult.error);
                        return;
                    }

                    toast.success("Cabang pertama berhasil dibuat!");
                    replace("/onboarding/team");
                    return;
                }

                const currentError = result.error ?? "Gagal membuat cabang.";
                lastError = currentError;
                if (!currentError.includes("Branch code already exists")) {
                    break;
                }
            }

            toast.error(lastError ?? "Gagal membuat cabang. Silakan coba lagi.");
        } catch {
            toast.error("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-5">
            <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground">Informasi Cabang Pertama</h3>
                <p className="text-sm text-muted-foreground">
                    {mode === "single"
                        ? "Mode single akan otomatis memakai nama cabang: Cabang Utama."
                        : "Isi detail cabang utama: nama cabang, lokasi, alamat, dan kontak operasional."}
                    {organizationId ? " Cabang ini akan langsung terhubung ke organisasi aktif." : ""}
                </p>
            </div>

            <BranchFormClient
                onSubmit={onSubmit}
                isSubmitting={isLoading}
                submitLabel="Lanjut ke Invite Team"
                layoutMode="step"
                fixedBranchName={mode === "single" ? "Cabang Utama" : undefined}
            />

            <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">Operating Hours</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Jam ini disimpan sebagai baseline onboarding di metadata organisasi.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Buka</p>
                        <Input type="time" value={openTime} onChange={(event) => setOpenTime(event.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tutup</p>
                        <Input type="time" value={closeTime} onChange={(event) => setCloseTime(event.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Timezone</p>
                        <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="button" variant="ghost" className="h-8 text-xs" onClick={() => replace("/onboarding/mode")}>
                    Kembali pilih mode
                </Button>
            </div>
        </div>
    );
}
