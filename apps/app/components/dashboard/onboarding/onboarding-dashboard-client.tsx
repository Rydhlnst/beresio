"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";

import { updateOnboardingMetadataAction } from "@/app/onboarding/_actions/organization";
import { Button } from "@repo/ui/button";
import { cn } from "@/lib/utils";

export type DashboardOnboardingState = {
    showWelcomeBanner: boolean;
    hasProducts: boolean;
    hasInvites: boolean;
    hasTransactions: boolean;
    paths: {
        pos: string;
        products: string;
        team: string;
    };
};

export function OnboardingWelcomeBanner({ state }: { state: DashboardOnboardingState | null }) {
    const [dismissed, setDismissed] = useState(!state?.showWelcomeBanner);
    if (!state || dismissed) return null;

    const ctas = [
        { label: "Buat transaksi pertama", href: state.paths.pos, visible: true },
        { label: "Tambah Produk", href: state.paths.products, visible: !state.hasProducts },
        { label: "Undang Tim", href: state.paths.team, visible: !state.hasInvites },
    ].filter((item) => item.visible);

    const handleDismiss = async () => {
        setDismissed(true);
        const result = await updateOnboardingMetadataAction({
            welcomeBannerDismissed: true,
            welcomeBannerDismissedAt: new Date().toISOString(),
        });
        if (!result.ok) toast.error(result.error);
    };

    return (
        <section className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-foreground">Selamat datang di Beres</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Setup dasar selesai. Lanjutkan langkah berikutnya untuk membuat operasional siap dipakai.
                    </p>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={handleDismiss} aria-label="Tutup welcome banner">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {ctas.map((cta) => (
                    <Button key={cta.href} asChild variant="outline" className="justify-between">
                        <Link href={cta.href}>
                            {cta.label}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                ))}
            </div>
        </section>
    );
}

export function OnboardingChecklistWidget({ state }: { state: DashboardOnboardingState | null }) {
    const items = useMemo(() => {
        if (!state) return [];
        return [
            { label: "Buat akun", done: true, href: null },
            { label: "Setup bisnis & cabang", done: true, href: null },
            { label: "Tambah produk", done: state.hasProducts, href: state.paths.products },
            { label: "Buat transaksi pertama", done: state.hasTransactions, href: state.paths.pos },
            { label: "Undang anggota tim", done: state.hasInvites, href: state.paths.team },
        ];
    }, [state]);

    if (!state || items.every((item) => item.done)) return null;

    const completed = items.filter((item) => item.done).length;

    return (
        <div className="mx-2 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-sidebar-foreground">Setup Beres kamu</p>
                <p className="text-xs font-semibold text-muted-foreground">{completed}/{items.length}</p>
            </div>
            <div className="mt-2 space-y-1 border-t border-sidebar-border pt-2">
                {items.map((item) => {
                    const content = (
                        <span className="flex min-h-7 items-center gap-2 rounded-lg px-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent">
                            <span
                                className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                    item.done && "border-primary bg-primary text-primary-foreground"
                                )}
                            >
                                {item.done ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className={cn("truncate", item.done && "text-muted-foreground")}>{item.label}</span>
                            {!item.done && item.href ? <ArrowRight className="ml-auto h-3.5 w-3.5" /> : null}
                        </span>
                    );

                    return item.done || !item.href ? (
                        <div key={item.label}>{content}</div>
                    ) : (
                        <Link key={item.label} href={item.href}>
                            {content}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
