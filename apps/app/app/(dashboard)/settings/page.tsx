import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Settings | Beres",
    description: "Kelola profil, billing, akses, dan notifikasi",
};

const SETTINGS_LINKS = [
    {
        title: "Profil",
        description: "Ubah nama, email, dan preferensi akun.",
        href: "/settings/profile",
    },
    {
        title: "Billing",
        description: "Lihat paket aktif, invoice, dan upgrade plan.",
        href: "/settings/billing",
    },
    {
        title: "Akses",
        description: "Atur role, izin, dan undangan tim.",
        href: "/settings/access",
    },
    {
        title: "Notifikasi",
        description: "Atur preferensi notifikasi email dan aplikasi.",
        href: "/settings/notifications",
    },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Pilih menu untuk mengatur konfigurasi akun dan organisasi.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {SETTINGS_LINKS.map((item) => (
                    <SectionCard
                        key={item.href}
                        title={item.title}
                        description={item.description}
                        actions={
                            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold" asChild>
                                <Link href={item.href}>Buka</Link>
                            </Button>
                        }
                    >
                        <p className="text-xs text-muted-foreground">
                            Kelola detail {item.title.toLowerCase()} di halaman ini.
                        </p>
                    </SectionCard>
                ))}
            </div>
        </div>
    );
}
