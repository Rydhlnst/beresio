"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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
import { ImageUpload } from "@/components/shared/image-upload";

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
    isOwner: boolean;
};

type SectionItem = {
    id: string;
    label: string;
    description?: string;
    danger?: boolean;
};

const OWNER_SECTIONS: SectionItem[] = [
    { id: "Organisasi", label: "Organisasi", description: "Identitas dan profil bisnis." },
    { id: "Tim", label: "Tim", description: "Kelola anggota dan role." },
    { id: "Integrasi", label: "Integrasi", description: "Sambungkan channel dan pembayaran." },
];

const BASE_SECTIONS: SectionItem[] = [
    { id: "Profil", label: "Profil", description: "Informasi akun pribadi." },
    { id: "Keamanan", label: "Keamanan", description: "Password dan verifikasi." },
    { id: "Notifikasi", label: "Notifikasi", description: "Pengaturan alert dan email." },
    { id: "Billing", label: "Billing", description: "Rencana dan penggunaan." },
    { id: "Ekspor Data", label: "Ekspor Data", description: "Unduh data operasional." },
    { id: "Hapus Akun", label: "Hapus Akun", description: "Tindakan permanen.", danger: true },
];

function getMetadataValue(metadata: unknown, key: string): string | null {
    if (!metadata || typeof metadata !== "object") return null;
    const value = (metadata as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
    return null;
}

function ToggleSwitch({
    checked,
    onChange,
    ariaLabel,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    ariaLabel: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors",
                checked ? "bg-primary border-primary" : "bg-muted border-border"
            )}
        >
            <span
                className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                    checked ? "translate-x-5" : "translate-x-0.5"
                )}
            />
        </button>
    );
}

function SettingsGroup({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                {description ? (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                ) : null}
            </div>
            <div className="overflow-hidden rounded-xl border border-border/60 bg-background/40 divide-y divide-border/60">
                {children}
            </div>
        </div>
    );
}

export function SettingsPageClient({ organization, billing, isOwner }: SettingsPageClientProps) {
    const sections = useMemo(
        () => (isOwner ? [...OWNER_SECTIONS, ...BASE_SECTIONS] : BASE_SECTIONS),
        [isOwner]
    );
    const defaultSection = useMemo(() => {
        return sections.find((section) => section.id === "Notifikasi")?.id ?? sections[0]?.id ?? "Notifikasi";
    }, [sections]);

    const [activeSection, setActiveSection] = useState(defaultSection);
    const [logoUrl, setLogoUrl] = useState<string | undefined>(organization?.logoUrl ?? undefined);
    const [desktopNotif, setDesktopNotif] = useState(true);
    const [unreadBadge, setUnreadBadge] = useState(true);
    const [emailComms, setEmailComms] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [muteSounds, setMuteSounds] = useState(false);
    const [pushTimeout, setPushTimeout] = useState("10");

    useEffect(() => {
        if (!sections.find((section) => section.id === activeSection)) {
            setActiveSection(defaultSection);
        }
    }, [sections, activeSection, defaultSection]);

    const orgName = organization?.name ?? "";
    const orgSlug = organization?.slug ?? "";
    const orgTimezone = getMetadataValue(organization?.metadata, "timezone") ?? "";
    const orgCurrency = getMetadataValue(organization?.metadata, "currency") ?? "";
    const currencyDefault = orgCurrency || undefined;

    const plan = billing?.plan ?? null;
    const planName = plan ? `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan` : "Plan belum tersedia";
    const branchUsage = billing?.usage?.branches;
    const memberUsage = billing?.usage?.members;
    const branchLimit = branchUsage?.limit === null ? "Tak terbatas" : (branchUsage?.limit ?? "-");
    const memberLimit = memberUsage?.limit === null ? "Tak terbatas" : (memberUsage?.limit ?? "-");

    return (
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Pengaturan
                </p>
                <nav className="space-y-1">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={cn(
                                "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                                activeSection === section.id
                                    ? "bg-muted/60 text-foreground shadow-sm"
                                    : section.danger
                                        ? "text-destructive hover:bg-destructive/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            )}
                        >
                            {section.label}
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-sm space-y-8">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Account Settings
                    </p>
                    <h1 className="text-2xl font-semibold text-foreground mt-2">{activeSection}</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        {sections.find((section) => section.id === activeSection)?.description}
                    </p>
                </div>

                {activeSection === "Organisasi" && (
                    <div className="space-y-6">
                        <div className="rounded-xl border border-border/60 bg-background/40 p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-4">Logo Organisasi</h3>
                                <ImageUpload
                                    value={logoUrl}
                                    onChange={(url) => setLogoUrl(url)}
                                    onClear={() => setLogoUrl(undefined)}
                                />
                            </div>
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
                        <SettingsGroup
                            title="Alamat & Legalitas"
                            description="Informasi yang muncul di invoice atau kontrak."
                        >
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Alamat Bisnis</p>
                                    <p className="text-xs text-muted-foreground mt-1">Belum diatur</p>
                                </div>
                                <Button variant="outline" className="h-9 text-xs font-semibold">Isi Detail</Button>
                            </div>
                        </SettingsGroup>
                    </div>
                )}

                {activeSection === "Tim" && (
                    <div className="space-y-4">
                        <SettingsGroup
                            title="Akses & Role"
                            description="Kelola role, izin, dan undangan tim."
                        >
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Kelola Anggota</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Tambah anggota dan atur cabang utama.
                                    </p>
                                </div>
                                <Button asChild variant="outline" className="h-9 text-xs font-semibold">
                                    <Link href="/tim">Buka</Link>
                                </Button>
                            </div>
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Role & Izin</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Buat role khusus untuk tim.
                                    </p>
                                </div>
                                <Button asChild variant="outline" className="h-9 text-xs font-semibold">
                                    <Link href="/tim/roles">Kelola</Link>
                                </Button>
                            </div>
                        </SettingsGroup>
                    </div>
                )}

                {activeSection === "Integrasi" && (
                    <SettingsGroup
                        title="Integrasi Bisnis"
                        description="Aktifkan channel operasional dan pembayaran."
                    >
                        <div className="px-4 py-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Gojek / Grab</p>
                                <p className="text-xs text-muted-foreground mt-1">Belum terhubung</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Hubungkan</Button>
                        </div>
                        <div className="px-4 py-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Payment Gateway</p>
                                <p className="text-xs text-muted-foreground mt-1">Midtrans - QRIS</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Kelola</Button>
                        </div>
                        <div className="px-4 py-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">WhatsApp Notif</p>
                                <p className="text-xs text-muted-foreground mt-1">Nonaktif</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Aktifkan</Button>
                        </div>
                    </SettingsGroup>
                )}

                {activeSection === "Profil" && (
                    <div className="space-y-4">
                        <SettingsGroup
                            title="Profil Akun"
                            description="Informasi dasar yang digunakan untuk notifikasi."
                        >
                            <div className="px-4 py-4 grid gap-3 sm:grid-cols-2">
                                <Input placeholder="Nama lengkap" defaultValue="" />
                                <Input placeholder="Email" defaultValue="" />
                            </div>
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <p className="text-xs text-muted-foreground">
                                    Kamu bisa ubah foto profil di menu akun.
                                </p>
                                <Button className="h-9 text-xs font-semibold">Simpan Profil</Button>
                            </div>
                        </SettingsGroup>
                    </div>
                )}

                {activeSection === "Keamanan" && (
                    <SettingsGroup
                        title="Kebijakan Keamanan"
                        description="Atur ketatnya password dan verifikasi."
                    >
                        <div className="px-4 py-4 grid gap-4 sm:grid-cols-2">
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
                        <div className="px-4 py-4 flex justify-end">
                            <Button className="h-9 text-xs font-semibold">Simpan Keamanan</Button>
                        </div>
                    </SettingsGroup>
                )}

                {activeSection === "Notifikasi" && (
                    <div className="space-y-6">
                        <SettingsGroup
                            title="Notifikasi Aplikasi"
                            description="Kontrol notifikasi yang muncul di perangkat."
                        >
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Enable Desktop Notification</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Terima pemberitahuan pesan, kontrak, dan dokumen.
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={desktopNotif}
                                    onChange={setDesktopNotif}
                                    ariaLabel="Desktop notification"
                                />
                            </div>
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Enable Unread Badge</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Menampilkan badge saat ada pesan belum dibaca.
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={unreadBadge}
                                    onChange={setUnreadBadge}
                                    ariaLabel="Unread badge"
                                />
                            </div>
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Push Notification Time-out</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Waktu timeout sebelum notifikasi otomatis hilang.
                                    </p>
                                </div>
                                <div className="w-40">
                                    <Select value={pushTimeout} onValueChange={setPushTimeout}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih durasi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5 menit</SelectItem>
                                            <SelectItem value="10">10 menit</SelectItem>
                                            <SelectItem value="30">30 menit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </SettingsGroup>

                        <SettingsGroup
                            title="Email Notifications"
                            description="Pengaturan email yang masuk ke owner."
                        >
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Communication Emails</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Email untuk pesan, kontrak, dan dokumen.
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={emailComms}
                                    onChange={setEmailComms}
                                    ariaLabel="Email komunikasi"
                                />
                            </div>
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Announcements & Updates</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Informasi pembaruan produk dan fitur baru.
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={emailUpdates}
                                    onChange={setEmailUpdates}
                                    ariaLabel="Email pembaruan"
                                />
                            </div>
                        </SettingsGroup>

                        <SettingsGroup
                            title="Sounds"
                            description="Kontrol suara notifikasi."
                        >
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Disable All Notification Sounds</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Matikan suara notifikasi aplikasi.
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={muteSounds}
                                    onChange={setMuteSounds}
                                    ariaLabel="Mute sounds"
                                />
                            </div>
                        </SettingsGroup>
                    </div>
                )}

                {activeSection === "Billing" && (
                    <div className="space-y-4">
                        <SettingsGroup
                            title="Plan & Usage"
                            description="Rangkuman paket dan batas penggunaan."
                        >
                            <div className="px-4 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Plan Aktif</p>
                                    <p className="text-xs text-muted-foreground mt-1">{planName}</p>
                                </div>
                                <Button variant="outline" className="h-9 text-xs font-semibold">Upgrade</Button>
                            </div>
                            <div className="px-4 py-4 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground">Cabang</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {branchUsage?.current ?? "-"} / {branchLimit}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground">Anggota</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {memberUsage?.current ?? "-"} / {memberLimit}
                                    </p>
                                </div>
                            </div>
                        </SettingsGroup>
                    </div>
                )}

                {activeSection === "Ekspor Data" && (
                    <SettingsGroup
                        title="Ekspor Data"
                        description="Unduh laporan data untuk analisis."
                    >
                        <div className="px-4 py-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Laporan Transaksi</p>
                                <p className="text-xs text-muted-foreground mt-1">CSV untuk periode terakhir.</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Unduh</Button>
                        </div>
                        <div className="px-4 py-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Data Produk</p>
                                <p className="text-xs text-muted-foreground mt-1">Backup data katalog.</p>
                            </div>
                            <Button variant="outline" className="h-9 text-xs font-semibold">Unduh</Button>
                        </div>
                    </SettingsGroup>
                )}

                {activeSection === "Hapus Akun" && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-destructive">Hapus Akun</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Tindakan ini tidak bisa dibatalkan. Semua data organisasi akan terhapus.
                            </p>
                        </div>
                        <Button variant="destructive" className="h-9 text-xs font-semibold">
                            Hapus Akun Permanen
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
