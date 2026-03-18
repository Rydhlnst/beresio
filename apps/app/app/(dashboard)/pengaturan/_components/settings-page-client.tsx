"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/select";
import { cn } from "@/lib/utils";

const SECTIONS = [
    "Organisasi",
    "Langganan",
    "Integrasi",
    "Keamanan",
    "Notifikasi",
];

type SettingsPageClientProps = {
    organization: {
        id: string;
        name: string;
        slug?: string | null;
        businessType?: string | null;
        subscriptionPlan?: string | null;
        logoUrl?: string | null;
        metadata?: unknown;
    } | null;
    billing: {
        plan?: string | null;
        usage?: {
            branches?: { current: number; limit: number | null };
            members?: { current: number; limit: number | null };
        };
    } | null;
};

function getMetadataValue(metadata: unknown, key: string): string | null {
    if (!metadata || typeof metadata !== "object") return null;
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
    return null;
}

export function SettingsPageClient({ organization, billing }: SettingsPageClientProps) {
    const [activeSection, setActiveSection] = useState(SECTIONS[0]);
    const orgName = organization?.name ?? "";
    const orgSlug = organization?.slug ?? "";
    const orgTimezone = getMetadataValue(organization?.metadata, "timezone") ?? "";
    const orgCurrency = getMetadataValue(organization?.metadata, "currency") ?? "";
    const currencyDefault = orgCurrency || undefined;

    const plan = billing?.plan ?? null;
    const planName = plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan` : "Plan belum tersedia";
    const branchUsage = billing?.usage?.branches;
    const memberUsage = billing?.usage?.members;
    const branchLimit = branchUsage?.limit === null ? "∞" : (branchUsage?.limit ?? "—");
    const memberLimit = memberUsage?.limit === null ? "∞" : (memberUsage?.limit ?? "—");

    return (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pengaturan</p>
                <nav className="space-y-1">
                    {SECTIONS.map((section) => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={cn(
                                "w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors",
                                activeSection === section
                                    ? "bg-muted/60 text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            {section}
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">{activeSection}</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Atur konfigurasi {activeSection.toLowerCase()} organisasi kamu.
                    </p>
                </div>

                {activeSection === "Organisasi" && (
                    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input placeholder="Nama organisasi" defaultValue={orgName} />
                            <Input placeholder="Slug" defaultValue={orgSlug} />
                            <Input placeholder="Timezone" defaultValue={orgTimezone} />
                            <Select defaultValue={currencyDefault}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mata uang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="idr">IDR</SelectItem>
                                    <SelectItem value="usd">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="h-9 text-xs font-semibold">Simpan Perubahan</Button>
                    </div>
                )}

                {activeSection === "Langganan" && (
                    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Plan Aktif</p>
                                <p className="text-xs text-muted-foreground mt-1">{planName}</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Upgrade</Button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">Cabang</p>
                                <p className="text-lg font-semibold text-foreground">
                                    {branchUsage?.current ?? "—"} / {branchLimit}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground">Anggota</p>
                                <p className="text-lg font-semibold text-foreground">
                                    {memberUsage?.current ?? "—"} / {memberLimit}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeSection === "Integrasi" && (
                    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Gojek/Grab</p>
                                <p className="text-xs text-muted-foreground mt-1">Belum terhubung</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Hubungkan</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Payment Gateway</p>
                                <p className="text-xs text-muted-foreground mt-1">Midtrans • QRIS</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Kelola</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">WhatsApp Notif</p>
                                <p className="text-xs text-muted-foreground mt-1">Nonaktif</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Aktifkan</Button>
                        </div>
                    </div>
                )}

                {activeSection === "Keamanan" && (
                    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Select defaultValue="medium">
                                <SelectTrigger>
                                    <SelectValue placeholder="Password Policy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="strong">Strong</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue="off">
                                <SelectTrigger>
                                    <SelectValue placeholder="2FA" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="off">Nonaktif</SelectItem>
                                    <SelectItem value="on">Aktif</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="h-9 text-xs font-semibold">Simpan Keamanan</Button>
                    </div>
                )}

                {activeSection === "Notifikasi" && (
                    <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Email Ringkasan Harian</p>
                                <p className="text-xs text-muted-foreground mt-1">Dikirim ke owner</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Aktifkan</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Notifikasi Stok Rendah</p>
                                <p className="text-xs text-muted-foreground mt-1">Kirim ke branch manager</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Kelola</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
