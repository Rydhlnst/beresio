"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { Check, Loader2, Store, StoreIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@repo/ui/button";
import { cn } from "@/lib/utils";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { updateOnboardingMetadataAction, updateOrganizationModeAction } from "@/app/onboarding/_actions/organization";

type OrgMode = "single" | "multi";

type ModeOnboardingFormProps = {
    initialMode?: OrgMode;
};

const MODE_OPTIONS: Array<{
    value: OrgMode;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
}> = [
    {
        value: "single",
        title: "Single Branch",
        description: "Saya punya 1 lokasi tanpa rencana ekspansi dalam waktu dekat.",
        icon: Store,
    },
    {
        value: "multi",
        title: "Multi Branch",
        description: "Saya punya atau berencana membuka 2+ lokasi.",
        icon: StoreIcon,
    },
];

export function ModeOnboardingForm({ initialMode = "single" }: ModeOnboardingFormProps) {
    const { replace } = useTransitionRouter();
    const [selectedMode, setSelectedMode] = useState<OrgMode>(initialMode);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const modeResult = await updateOrganizationModeAction(selectedMode);
            if (!modeResult.ok) {
                toast.error(modeResult.error);
                return;
            }

            const metadataResult = await updateOnboardingMetadataAction({
                modeSelected: true,
                modeSelectedAt: new Date().toISOString(),
            });
            if (!metadataResult.ok) {
                toast.error(metadataResult.error);
                return;
            }

            toast.success("Mode bisnis berhasil disimpan.");
            replace("/onboarding/branch");
        } catch {
            toast.error("Terjadi kesalahan sistem. Coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
                {MODE_OPTIONS.map((mode) => {
                    const active = selectedMode === mode.value;
                    return (
                        <button
                            key={mode.value}
                            type="button"
                            onClick={() => setSelectedMode(mode.value)}
                            className={cn(
                                "rounded-xl border p-4 text-left transition",
                                active
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-background hover:border-primary/50"
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <mode.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                                {active ? (
                                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <Check className="h-3.5 w-3.5" />
                                    </span>
                                ) : null}
                            </div>
                            <p className="mt-4 text-sm font-semibold text-foreground">{mode.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{mode.description}</p>
                        </button>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <Button className="min-w-44" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        "Lanjut Setup Cabang"
                    )}
                </Button>
            </div>
        </div>
    );
}
