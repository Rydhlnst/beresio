"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/select";
import { createInviteAction } from "@/app/(dashboard)/team/actions";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { updateOnboardingMetadataAction } from "@/app/onboarding/_actions/organization";

type TeamOnboardingFormProps = {
    roles: Array<{ id: string; name: string; slug: string }>;
    branches: Array<{ id: string; name: string; code: string }>;
};

export function TeamOnboardingForm({ roles, branches }: TeamOnboardingFormProps) {
    const { replace } = useTransitionRouter();
    const [invites, setInvites] = useState(() => [
        { id: crypto.randomUUID(), email: "", roleId: undefined as string | undefined, branchId: undefined as string | undefined },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const roleOptions = useMemo(() => {
        if (roles.length > 0) return roles;
        return [{ id: "owner-fallback", name: "Owner", slug: "owner" }];
    }, [roles]);

    const goToDashboard = async () => {
        const metadataResult = await updateOnboardingMetadataAction({
            onboardingCompleted: true,
            onboardingCompletedAt: new Date().toISOString(),
            teamInviteStepCompleted: true,
            teamInviteStepCompletedAt: new Date().toISOString(),
        });
        if (!metadataResult.ok) {
            // Team invite step is optional; do not block dashboard access on metadata write failure.
            toast.error(`${metadataResult.error} Melanjutkan ke dashboard...`);
        }
        replace("/");
    };

    const handleSkip = async () => {
        setIsSubmitting(true);
        try {
            await goToDashboard();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInvite = async () => {
        const validInvites = invites
            .map((invite) => ({ ...invite, email: invite.email.trim() }))
            .filter((invite) => invite.email.length > 0);

        if (validInvites.length === 0) {
            toast.error("Isi minimal satu email tim atau pilih Selesaikan Setup.");
            return;
        }

        setIsSubmitting(true);
        try {
            for (const invite of validInvites) {
                const result = await createInviteAction({
                    email: invite.email,
                    roleId: invite.roleId,
                    branchId: invite.branchId,
                });

                if (!result.ok) {
                    toast.error(result.error);
                    return;
                }
            }

            toast.success("Undangan tim berhasil dikirim.");
            await goToDashboard();
        } catch {
            toast.error("Terjadi kesalahan sistem. Coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground">Undang anggota tim pertama</h3>
                <p className="text-sm text-muted-foreground">
                    Langkah ini opsional. Kamu bisa skip dan lanjut setup tim dari menu Dashboard.
                </p>
            </div>

            <div className="space-y-3">
                {invites.map((invite) => (
                    <div key={invite.id} className="grid gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1.2fr_0.8fr_0.9fr_auto]">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email</p>
                            <Input
                                type="email"
                                placeholder="nama@perusahaan.com"
                                value={invite.email}
                                onChange={(event) => setInvites((current) => current.map((item) => item.id === invite.id ? { ...item, email: event.target.value } : item))}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Role</p>
                            <Select
                                value={invite.roleId}
                                onValueChange={(value) => setInvites((current) => current.map((item) => item.id === invite.id ? { ...item, roleId: value } : item))}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roleOptions.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cabang</p>
                            <Select
                                value={invite.branchId}
                                onValueChange={(value) => setInvites((current) => current.map((item) => item.id === invite.id ? { ...item, branchId: value } : item))}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opsional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name} ({branch.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setInvites((current) => current.length === 1 ? current : current.filter((item) => item.id !== invite.id))}
                                disabled={isSubmitting || invites.length === 1}
                                aria-label="Hapus undangan"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInvites((current) => [...current, { id: crypto.randomUUID(), email: "", roleId: undefined, branchId: undefined }])}
                    disabled={isSubmitting}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah undangan
                </Button>
                <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleSkip} disabled={isSubmitting}>
                    Selesaikan Setup
                </Button>
                <Button type="button" onClick={handleInvite} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                        </>
                    ) : (
                            "Kirim Undangan"
                    )}
                </Button>
                </div>
            </div>
        </div>
    );
}
