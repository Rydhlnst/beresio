import type { Metadata } from "next";
import Link from "next/link";
import { GitBranch, Building2, Users, BarChart3, Shield, Layers, ArrowRightLeft, Globe } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Multi-Cabang - Kelola Semua Outlet Terpusat",
    description: "Kelola semua cabang bisnis Anda dari satu dashboard. Sinkronisasi data real-time, laporan konsolidasi, dan manajemen akses per outlet.",
};

const FEATURES = [
    {
        title: "Dashboard Terpusat",
        description: "Lihat performa semua cabang dalam satu dashboard dengan metrik yang dapat dibandingkan.",
        icon: BarChart3,
    },
    {
        title: "Sinkronisasi Real-Time",
        description: "Data transaksi, inventori, dan laporan sinkron otomatis antar cabang.",
        icon: ArrowRightLeft,
    },
    {
        title: "Manajemen Akses",
        description: "Atur siapa yang bisa akses data cabang mana dengan role-based access control.",
        icon: Shield,
    },
    {
        title: "Transfer Stok Antar Cabang",
        description: "Pindahkan barang antar outlet dengan approval workflow yang terstruktur.",
        icon: Layers,
    },
    {
        title: "Laporan Konsolidasi",
        description: "Generate laporan gabungan atau per cabang sesuai kebutuhan.",
        icon: GitBranch,
    },
    {
        title: "Multi-Regional Support",
        description: "Dukung cabang di kota atau provinsi berbeda dengan timezone dan currency lokal.",
        icon: Globe,
    },
];

const ROLES = [
    { title: "Super Admin", desc: "Akses penuh semua cabang", scope: "Semua Cabang" },
    { title: "Regional Manager", desc: "Kelola cabang di region tertentu", scope: "Per Region" },
    { title: "Outlet Manager", desc: "Akses hanya untuk cabang sendiri", scope: "Per Cabang" },
    { title: "Staff", desc: "Akses terbatas sesuai tugas", scope: "Custom" },
];

export default function MultiCabangPage() {
    return (
        <>
            <PageHero
                badgeLabel="Enterprise Ready"
                title="Multi-Cabang"
                subtitle="Satu Dashboard, Semua Outlet"
                description="Kelola semua cabang bisnis Anda dari satu tempat. Sinkronisasi data real-time, laporan konsolidasi, dan kontrol akses yang fleksibel."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Hubungi Sales", href: "/sales" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Multi-Cabang Lengkap</Heading>
                        <Text variant="lead" align="center">
                            Scale bisnis Anda tanpa khawatir sistem tidak bisa mengikuti.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((feature) => (
                            <Card key={feature.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                        <feature.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text variant="muted">{feature.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section className="bg-muted/30">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Role & Akses yang Fleksibel</Heading>
                        <Text variant="lead" align="center">
                            Tentukan siapa yang bisa melihat dan mengubah data di cabang mana.
                        </Text>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {ROLES.map((role) => (
                            <div key={role.title} className="p-6 rounded-2xl bg-background border border-border/60">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                        <Users className="h-5 w-5 text-primary" />
                                    </div>
                                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                                        {role.scope}
                                    </span>
                                </div>
                                <h3 className="font-semibold mb-2">{role.title}</h3>
                                <Text variant="muted" className="text-sm">{role.desc}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Building2 className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Multi-Outlet Dashboard Preview</Text>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Heading as="h2">Scale Tanpa Batas</Heading>
                        <Text variant="lead">
                            Dari 2 cabang sampai 200 cabang, sistem kami siap menyesuaikan.
                        </Text>
                        <ul className="space-y-3">
                            {[
                                "Tambah cabang baru dalam hitungan menit",
                                "Duplikat konfigurasi dari cabang existing",
                                "Pantau performa cabang lewat leaderboard",
                                "Bandbandingkan metrik antar cabang"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <Text className="text-sm">{item}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Scale Bisnis Anda?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Kelola semua cabang dengan efisien menggunakan satu platform terpadu.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/harga">Lihat Paket Enterprise</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
