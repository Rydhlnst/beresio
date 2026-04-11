"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
    const [email, setEmail] = useState("");
    const [roleId, setRoleId] = useState<string | undefined>(undefined);
    const [branchId, setBranchId] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const roleOptions = useMemo(() => {
        if (roles.length > 0) return roles;
        return [{ id: "owner-fallback", name: "Owner", slug: "owner" }];
    }, [roles]);

    const goToDashboard = async () => {
        const metadataResult = await updateOnboardingMetadataAction({
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
        if (!email.trim()) {
            toast.error("Email tim wajib diisi.");
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createInviteAction({
                email: email.trim(),
                roleId,
                branchId,
            });

            if (!result.ok) {
                toast.error(result.error);
                return;
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

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email</p>
                    <Input
                        type="email"
                        placeholder="nama@perusahaan.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Role</p>
                    <Select value={roleId} onValueChange={setRoleId} disabled={isSubmitting}>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cabang (Opsional)</p>
                    <Select value={branchId} onValueChange={setBranchId} disabled={isSubmitting}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih cabang" />
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
            </div>

            <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleSkip} disabled={isSubmitting}>
                    Lewati & Masuk Dashboard
                </Button>
                <Button type="button" onClick={handleInvite} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memproses...
                        </>
                    ) : (
                        "Kirim Undangan & Masuk Dashboard"
                    )}
                </Button>
            </div>
        </div>
    );
}
