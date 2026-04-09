import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp, ShoppingCart, Users, ArrowRight } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Dashboard - Ringkasan Bisnis Anda",
    path: "/dashboard",
    description: "Dashboard Beres.io - Pantau metrik bisnis, transaksi, dan aktivitas tim dalam satu layar.",
    noIndex: true, // Dashboard should not be indexed
});

const DASHBOARD_METRICS = [
    { label: "Transaksi Hari Ini", value: "—", icon: ShoppingCart },
    { label: "Pendapatan Bulan Ini", value: "—", icon: TrendingUp },
    { label: "Tim Aktif", value: "—", icon: Users },
];

const QUICK_ACTIONS = [
    {
        title: "Lengkapi Profil Bisnis",
        description: "Tambah detail outlet, jam operasional, dan metode pembayaran.",
        href: "/onboarding/org",
        cta: "Lanjutkan Onboarding",
    },
    {
        title: "Jadwalkan Demo Lanjutan",
        description: "Dapatkan walkthrough fitur advanced bersama tim kami.",
        href: "/demo",
        cta: "Jadwalkan Demo",
    },
    {
        title: "Butuh Bantuan?",
        description: "Tim support siap membantu konfigurasi awal Anda.",
        href: "/support",
        cta: "Hubungi Support",
    },
];

export default function DashboardPage() {
    return (
        <>
            <PageHero
                badgeLabel="Dashboard"
                title="Ringkasan Bisnis Anda"
                subtitle="Dalam Satu Layar"
                description="Halaman ini akan menampilkan metrik utama, aktivitas terbaru, dan rekomendasi langkah berikutnya."
                primaryCta={{ label: "Lanjutkan Onboarding", href: "/onboarding/org" }}
                secondaryCta={{ label: "Lihat Tutorial", href: "/tutorial" }}
                align="left"
            />

            <Section>
                <div className="space-y-8">
                    <Heading as="h2">Ringkasan Cepat</Heading>
                    <div className="grid gap-6 md:grid-cols-3">
                        {DASHBOARD_METRICS.map((metric) => (
                            <Card key={metric.label} className="border-border/60">
                                <CardHeader className="flex-row items-center justify-between space-y-0">
                                    <CardTitle className="text-sm">{metric.label}</CardTitle>
                                    <metric.icon className="h-4 w-4 text-brand" />
                                </CardHeader>
                                <CardContent>
                                    <Text className="text-3xl font-bold">{metric.value}</Text>
                                    <Text variant="muted">Data akan muncul setelah integrasi awal selesai.</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="space-y-8">
                    <Heading as="h2">Aksi Cepat</Heading>
                    <div className="grid gap-6 md:grid-cols-3">
                        {QUICK_ACTIONS.map((action) => (
                            <Card key={action.title} className="border-border/60 flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-base">{action.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <Text variant="muted">{action.description}</Text>
                                    <Button variant="outline" className="rounded-2xl mt-auto" asChild>
                                        <Link href={action.href}>
                                            {action.cta}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>
        </>
    );
}
