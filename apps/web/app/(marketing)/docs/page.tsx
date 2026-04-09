import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Search, ArrowRight, FileText, PlayCircle, Code, HelpCircle, Zap } from "lucide-react";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Dokumentasi - Panduan Lengkap",
    description: "Dokumentasi lengkap Beres.io. Panduan setup, tutorial penggunaan, API reference, dan FAQ untuk membantu Anda memaksimalkan platform.",
};

const CATEGORIES = [
    {
        title: "Getting Started",
        icon: Zap,
        items: [
            { label: "Setup Awal Organisasi", href: "#" },
            { label: "Menambahkan Outlet", href: "#" },
            { label: "Invite Tim", href: "#" },
            { label: "Konfigurasi Pembayaran", href: "#" },
        ],
    },
    {
        title: "Panduan Penggunaan",
        icon: FileText,
        items: [
            { label: "Cara Transaksi POS", href: "#" },
            { label: "Manajemen Inventori", href: "#" },
            { label: "Generate Laporan", href: "#" },
            { label: "Export Data", href: "#" },
        ],
    },
    {
        title: "Video Tutorial",
        icon: PlayCircle,
        items: [
            { label: "Beres.io Basics", href: "/tutorial" },
            { label: "Setup Inventory", href: "/tutorial" },
            { label: "Advanced Reporting", href: "/tutorial" },
            { label: "Multi-Outlet Setup", href: "/tutorial" },
        ],
    },
    {
        title: "Developer API",
        icon: Code,
        items: [
            { label: "API Overview", href: "#" },
            { label: "Authentication", href: "#" },
            { label: "Endpoints", href: "#" },
            { label: "Webhooks", href: "#" },
        ],
    },
];

const QUICK_LINKS = [
    { label: "FAQ", href: "/support", icon: HelpCircle },
    { label: "Changelog", href: "/changelog", icon: FileText },
    { label: "Hubungi Support", href: "/support", icon: BookOpen },
];

export default function DocsPage() {
    return (
        <>
            <PageHero
                badgeLabel="Pusat Bantuan"
                title="Dokumentasi"
                subtitle="Panduan Lengkap"
                description="Semua yang perlu Anda ketahui untuk menggunakan Beres.io secara maksimal. Dari setup awal sampai fitur advanced."
                primaryCta={{ label: "Mulai Belajar", href: "#categories" }}
                secondaryCta={{ label: "Video Tutorial", href: "/tutorial" }}
                align="center"
            />

            <Section id="categories">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Pilih Topik</Heading>
                        <Text variant="lead" align="center">
                            Dokumentasi terorganisir berdasarkan kategori untuk memudahkan pencarian.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {CATEGORIES.map((category) => (
                            <Card key={category.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                        <category.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{category.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {category.items.map((item) => (
                                            <li key={item.label}>
                                                <Link 
                                                    href={item.href}
                                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors group"
                                                >
                                                    <span className="text-sm">{item.label}</span>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section className="bg-muted/30">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Heading as="h2">Tidak Menemukan yang Anda Cari?</Heading>
                        <Text variant="lead">
                            Tim support kami siap membantu menjawab pertanyaan Anda.
                        </Text>
                        <div className="flex flex-wrap gap-4">
                            {QUICK_LINKS.map((link) => (
                                <Button key={link.label} variant="outline" className="rounded-2xl" asChild>
                                    <Link href={link.href}>
                                        <link.icon className="h-4 w-4 mr-2" />
                                        {link.label}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div className="aspect-video rounded-2xl bg-background flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Search className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Search Documentation</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Mulai?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Bergabung dengan Beres.io dan mulai kelola bisnis Anda dengan lebih baik.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/support">Hubungi Support</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
