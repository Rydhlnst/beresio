import type { Metadata } from "next";
import Link from "next/link";
import { Users, Shield, UserPlus, UserCog, Key, Activity, Clock, Award } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Manajemen Tim - Role & Akses yang Fleksibel",
    description: "Atur tim dan akses staff dengan mudah. Role-based access control, activity tracking, dan manajemen shift dalam satu platform.",
};

const FEATURES = [
    {
        title: "Role-Based Access",
        description: "Tentukan hak akses berdasarkan role: Admin, Manager, Kasir, Gudang, dll.",
        icon: Shield,
    },
    {
        title: "Tambah Staff Mudah",
        description: "Invite staff via email dan mereka langsung dapat akses sesuai role.",
        icon: UserPlus,
    },
    {
        title: "Activity Tracking",
        description: "Lacak aktivitas setiap staff: transaksi yang dibuat, stok yang diubah, dll.",
        icon: Activity,
    },
    {
        title: "Manajemen Shift",
        description: "Atur jadwal shift staff dan pantau kehadiran.",
        icon: Clock,
    },
    {
        title: "Performance Insights",
        description: "Lihat performa individu staff berdasarkan metrik yang relevan.",
        icon: Award,
    },
    {
        title: "Akses Per Cabang",
        description: "Batasi staff hanya bisa akses cabang tempat mereka bertugas.",
        icon: UserCog,
    },
];

const ROLES_DETAIL = [
    {
        name: "Owner",
        icon: Key,
        permissions: ["Akses penuh", "Tambah/hapus cabang", "Kelola billing", "Semua laporan"],
    },
    {
        name: "Admin",
        icon: Shield,
        permissions: ["Kelola user & role", "Lihat semua data", "Edit konfigurasi", "Export laporan"],
    },
    {
        name: "Manager",
        icon: UserCog,
        permissions: ["Kelola stok", "Lihat laporan", "Approve transfer", "Kelola staff"],
    },
    {
        name: "Kasir",
        icon: Users,
        permissions: ["Buat transaksi", "Lihat produk", "Cetak struk", "History transaksi sendiri"],
    },
];

export default function TimPage() {
    return (
        <>
            <PageHero
                badgeLabel="Team Management"
                title="Manajemen Tim"
                subtitle="Organisasi yang Terstruktur"
                description="Atur akses staff per cabang dengan role yang fleksibel. Track aktivitas dan kelola performa tim dalam satu dashboard."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Lihat Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Manajemen Tim</Heading>
                        <Text variant="lead" align="center">
                            Kelola tim dengan mudah, dari onboarding sampai performance tracking.
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
                        <Heading as="h2">Role & Permission Standar</Heading>
                        <Text variant="lead" align="center">
                            Gunakan template role yang sudah kami siapkan atau buat custom role sendiri.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {ROLES_DETAIL.map((role) => (
                            <div key={role.name} className="p-6 rounded-2xl bg-background border border-border/60">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                        <role.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{role.name}</h3>
                                        <Text variant="muted" className="text-sm">Role bawaan</Text>
                                    </div>
                                </div>
                                <ul className="space-y-2">
                                    {role.permissions.map((perm) => (
                                        <li key={perm} className="flex items-center gap-2 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            {perm}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Heading as="h2">Keamanan Data Terjamin</Heading>
                        <Text variant="lead">
                            Setiap aktivitas staff tercatat dan bisa dilacak. Tidak ada lagi kebingungan siapa yang mengubah data.
                        </Text>
                        <div className="space-y-4">
                            {[
                                { label: "Activity Log", desc: "Riwayat semua aksi user" },
                                { label: "IP Tracking", desc: "Catat IP address setiap login" },
                                { label: "Session Management", desc: "Pantau device yang login" },
                                { label: "2FA Support", desc: "Verifikasi dua langkah" },
                            ].map((item) => (
                                <div key={item.label} className="flex items-start gap-3">
                                    <Activity className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <div className="font-medium">{item.label}</div>
                                        <Text variant="muted" className="text-sm">{item.desc}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Users className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Team Management Dashboard Preview</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Bangun Tim yang Efisien</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Mulai atur role dan akses tim Anda dengan struktur yang jelas.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/solusi/retail">Lihat Solusi Retail →</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
