"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Checkbox } from "@repo/ui/checkbox";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { BranchFormClient, type BranchPayload } from "./branch-form-client";
import { createBranchAction } from "../../_actions/branches";
import { assignMemberToBranchAction } from "@/app/(dashboard)/team/actions";
import { toast } from "sonner";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { cn } from "@/lib/utils";

type MemberOption = {
    id: string;
    name: string;
    email: string;
    roleName?: string | null;
    status?: string | null;
    primaryBranch?: { id: string; name: string } | null;
};

type BranchCreateWizardClientProps = {
    members: MemberOption[];
    orgOverviewPath: string;
};

const STEPS = [
    { id: 1, label: "Detail Cabang", description: "Lengkapi data cabang baru." },
    { id: 2, label: "Assign Tim", description: "Pilih anggota untuk cabang ini." },
];

export function BranchCreateWizardClient({ members, orgOverviewPath }: BranchCreateWizardClientProps) {
    const router = useTransitionRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [branchPayload, setBranchPayload] = useState<BranchPayload | null>(null);
    const [memberQuery, setMemberQuery] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [primaryMembers, setPrimaryMembers] = useState<string[]>([]);

    const filteredMembers = useMemo(() => {
        const query = memberQuery.trim().toLowerCase();
        if (!query) return members;
        return members.filter((member) => (
            member.name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query) ||
            (member.roleName ?? "").toLowerCase().includes(query)
        ));
    }, [memberQuery, members]);

    const selectedCount = selectedMembers.length;

    const handleNext = async (payload: BranchPayload) => {
        setBranchPayload(payload);
        setStep(2);
    };

    const toggleMember = (memberId: string) => {
        setSelectedMembers((prev) => (
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        ));
        setPrimaryMembers((prev) => prev.filter((id) => id !== memberId));
    };

    const togglePrimary = (memberId: string) => {
        setSelectedMembers((prev) => (prev.includes(memberId) ? prev : [...prev, memberId]));
        setPrimaryMembers((prev) => (
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        ));
    };

    const handleCreate = async (skipAssign?: boolean) => {
        if (!branchPayload) {
            toast.error("Lengkapi detail cabang terlebih dahulu.");
            setStep(1);
            return;
        }

        setIsSubmitting(true);

        const codePrefix = branchPayload.nama_cabang
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 3)
            .toUpperCase();
        const codeNumber = Math.floor(100 + Math.random() * 900);
        const code = `${codePrefix}-${codeNumber}`;

        const result = await createBranchAction({
            name: branchPayload.nama_cabang,
            code,
            address: branchPayload.alamat_lengkap,
            phone: branchPayload.nomor_telepon,
            isActive: true,
        });

        if (!result.ok) {
            setIsSubmitting(false);
            toast.error(result.error || "Gagal membuat cabang.");
            return;
        }

        const branchId = result.data?.id as string | undefined;
        if (!branchId) {
            setIsSubmitting(false);
            toast.error("Cabang berhasil dibuat, tapi ID cabang tidak ditemukan.");
            return;
        }

        const selectedAssignments = skipAssign
            ? []
            : selectedMembers.map((memberId) => ({
                  memberId,
                  isPrimary: primaryMembers.includes(memberId),
              }));

        if (selectedAssignments.length > 0) {
            const results = await Promise.all(
                selectedAssignments.map((assignment) =>
                    assignMemberToBranchAction({
                        memberId: assignment.memberId,
                        branchId,
                        isPrimary: assignment.isPrimary,
                    })
                )
            );

            const failed = results.filter((res) => !res.ok).length;
            if (failed > 0) {
                setIsSubmitting(false);
                toast.error(`Cabang dibuat, tapi ${failed} assignment gagal.`);
                router.push(orgOverviewPath);
                return;
            }
        }

        setIsSubmitting(false);
        toast.success("Cabang berhasil dibuat!");
        router.push(orgOverviewPath);
    };

    const defaultValues = branchPayload
        ? {
              namaCabang: branchPayload.nama_cabang,
              provinsi: branchPayload.provinsi,
              kota: branchPayload.kota,
              alamatLengkap: branchPayload.alamat_lengkap,
              kecamatan: branchPayload.kecamatan,
              kelurahan: branchPayload.kelurahan,
              kodePos: branchPayload.kode_pos,
              nomorTelepon: branchPayload.nomor_telepon,
              googlePlaceId: branchPayload.metadata.google_place_id,
              latitude: branchPayload.metadata.koordinat?.lat ?? null,
              longitude: branchPayload.metadata.koordinat?.lng ?? null,
              inputMethod: branchPayload.metadata.input_method,
          }
        : undefined;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Tambah Cabang</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Lengkapi data cabang baru dan assign tim yang bertugas.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href={orgOverviewPath}>Kembali</Link>
                </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {STEPS.map((item) => {
                    const isActive = item.id === step;
                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "rounded-lg border border-border/60 px-4 py-3",
                                isActive ? "bg-muted/30" : "bg-background"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-[11px] font-semibold",
                                        isActive
                                            ? "border-primary/40 text-primary"
                                            : "border-border text-muted-foreground"
                                    )}
                                >
                                    Step {item.id}
                                </Badge>
                                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        </div>
                    );
                })}
            </div>

            {step === 1 ? (
                <SectionCard title="Detail Cabang" description="Informasi dasar cabang baru.">
                    <BranchFormClient
                        onSubmit={handleNext}
                        isSubmitting={isSubmitting}
                        defaultValues={defaultValues}
                        submitLabel="Lanjut: Assign Tim"
                    />
                </SectionCard>
            ) : (
                <SectionCard title="Assign Tim" description="Pilih anggota yang bertugas di cabang ini.">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {selectedCount} dipilih
                                </Badge>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-8 text-xs"
                                    onClick={() => {
                                        const allIds = members.map((member) => member.id);
                                        setSelectedMembers(allIds);
                                    }}
                                >
                                    Pilih semua
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-8 text-xs"
                                    onClick={() => {
                                        setSelectedMembers([]);
                                        setPrimaryMembers([]);
                                    }}
                                >
                                    Reset
                                </Button>
                            </div>
                            <div className="w-full sm:w-64">
                                <Input
                                    value={memberQuery}
                                    onChange={(event) => setMemberQuery(event.target.value)}
                                    placeholder="Cari nama, email, role..."
                                    className="h-9"
                                />
                            </div>
                        </div>

                        {members.length === 0 ? (
                            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                                Belum ada anggota tim. Kamu bisa membuat cabang dulu, lalu assign anggota nanti.
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                                Anggota tidak ditemukan.
                            </div>
                        ) : (
                            <div className="divide-y divide-border/60 rounded-lg border border-border/60">
                                {filteredMembers.map((member) => {
                                    const isSelected = selectedMembers.includes(member.id);
                                    const isPrimary = primaryMembers.includes(member.id);
                                    return (
                                        <div key={member.id} className="flex items-start gap-3 p-4">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleMember(member.id)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {member.roleName ?? "Member"}
                                                    </Badge>
                                                    {member.primaryBranch?.name ? (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            Primary: {member.primaryBranch.name}
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{member.email}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant={isPrimary ? "default" : "outline"}
                                                className="h-8 text-xs"
                                                onClick={() => togglePrimary(member.id)}
                                            >
                                                {isPrimary ? "Primary" : "Jadikan Primary"}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-9 text-xs font-semibold"
                                onClick={() => setStep(1)}
                                disabled={isSubmitting}
                            >
                                Kembali
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-9 text-xs font-semibold"
                                    onClick={() => handleCreate(true)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Menyimpan..." : "Simpan Tanpa Assign"}
                                </Button>
                                <Button
                                    type="button"
                                    className="h-9 text-xs font-semibold"
                                    onClick={() => handleCreate(false)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Menyimpan..." : "Simpan & Assign"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
