"use client";

import { useState } from "react";
import { toast } from "sonner";

import { BranchFormClient, type BranchPayload } from "@/app/(dashboard)/branches/new/_components/branch-form-client";
import { createBranchAction } from "@/app/(dashboard)/branches/_actions/branches";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { bootstrapRbacForActiveOrg } from "../../_actions/rbac";

interface TeamOnboardingFormProps {
  organizationId?: string;
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

export function TeamOnboardingForm({ organizationId }: TeamOnboardingFormProps) {
  const { replace } = useTransitionRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(payload: BranchPayload) {
    setIsLoading(true);
    try {
      let lastError: string | null = null;
      for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
        const code = buildBranchCode(payload.nama_cabang, attempt);
        const result = await createBranchAction({
          name: payload.nama_cabang,
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

          toast.success("Cabang pertama berhasil dibuat!");
          replace("/dashboard");
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-slate-900">Informasi Cabang Pertama</h3>
        <p className="text-sm text-slate-600">
          Isi detail cabang utama: nama cabang, lokasi, alamat, dan kontak operasional.
          {organizationId ? " Cabang ini akan langsung terhubung ke organisasi aktif." : ""}
        </p>
      </div>

      <BranchFormClient
        onSubmit={onSubmit}
        isSubmitting={isLoading}
        submitLabel="Selesai Setup & Masuk Dashboard"
      />
    </div>
  );
}
