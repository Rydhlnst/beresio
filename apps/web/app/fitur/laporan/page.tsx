import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, TrendingUp, PieChart, FileText, Download, Calendar, Filter, Eye } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Laporan & Analitik - Dashboard Performa Bisnis",
    description: "Dashboard lengkap untuk memantau performa bisnis Anda. Laporan P&L, arus kas, penjualan, dan analitik mendalam lainnya.",
};

const REPORTS = [
    {
        title: "Profit & Loss",
        description: "Lihat pendapatan, pengeluaran, dan profit bersih secara real-time atau periode tertentu.",
        icon: TrendingUp,
    },
    {
        title: "Arus Kas",
        description: "Pantau cash in dan cash out untuk memastikan kesehatan finansial bisnis.",
        icon: BarChart3,
    },
    {
        title: "Penjualan per Produk",
        description: "Identifikasi produk terlaris dan yang perlu dipromosikan lebih.",
        icon: PieChart,
    },
    {
        title: "Laporan Perpajakan",
        description: "Generate laporan PPN dan pajak lainnya sesuai format yang diperlukan.",
        icon: FileText,
    },
    {
        title: "Export Multi-Format",
        description: "Export laporan ke PDF, Excel, atau CSV untuk kebutuhan presentasi.",
        icon: Download,
    },
    {
        title: "Jadwal Laporan",
        description: "Atur pengiriman laporan otomatis ke email setiap hari, minggu, atau bulan.",
        icon: Calendar,
    },
];

const INSIGHTS = [
    { label: "Total Penjualan", value: "Rp 125M+", desc: "Terproses via Beres.io" },
    { label: "Data Real-time", value: "< 1 detik", desc: "Update dashboard" },
    { label: "Format Export", value: "5+", desc: "PDF, Excel, CSV, JSON" },
    { label: "Metrik Tersedia", value: "50+", desc: "Berbagai metrik bisnis" },
];

export default function LaporanPage() {
    return (
        <>
            <PageHero
                badgeLabel="Business Intelligence"
                title="Laporan & Analitik"
                subtitle="Data-Driven Decisions"
                description="Dashboard lengkap untuk memantau performa bisnis. Dari P&L sampai analitik per produk, semua tersedia dalam satu klik."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Semua Laporan yang Anda Butuhkan</Heading>
                        <Text variant="lead" align="center">
                            Generate laporan kapan saja, di mana saja, dalam format yang Anda inginkan.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {REPORTS.map((report) => (
                            <Card key={report.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                        <report.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{report.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text variant="muted">{report.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section className="bg-muted/30">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Insight dalam Hitungan Detik</Heading>
                        <Text variant="lead" align="center">
                            Tidak perlu menunggu akhir bulan untuk tahu kondisi bisnis Anda.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {INSIGHTS.map((item) => (
                            <div key={item.label} className="text-center p-6 rounded-2xl bg-background border border-border/60">
                                <div className="text-3xl font-bold text-primary mb-2">{item.value}</div>
                                <div className="font-medium mb-1">{item.label}</div>
                                <Text variant="muted" className="text-sm">{item.desc}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="order-2 lg:order-1 aspect-video rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <BarChart3 className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Dashboard Analitik Preview</Text>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 space-y-6">
                        <Heading as="h2">Filter & Custom Report</Heading>
                        <Text variant="lead">
                            Buat laporan kustom sesuai kebutuhan spesifik bisnis Anda dengan filter yang fleksibel.
                        </Text>
                        <ul className="space-y-3">
                            {[
                                "Filter per cabang, periode, atau kategori",
                                "Bandbandingkan performa antar periode",
                                "Simpan template laporan favorit",
                                "Share laporan ke tim dengan link"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <Filter className="h-4 w-4 text-primary" />
                                    <Text className="text-sm">{item}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Ambil Keputusan Berdasarkan Data</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Mulai analisa performa bisnis Anda dengan laporan yang komprehensif.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/fitur/multi-cabang">Lihat Multi-Cabang →</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
