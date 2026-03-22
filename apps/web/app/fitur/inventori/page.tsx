import type { Metadata } from "next";
import Link from "next/link";
import { Package, Bell, BarChart3, History, Tags, Truck, AlertTriangle, Search } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Manajemen Inventori - Pantau Stok Real-Time",
    description: "Kelola inventori bisnis Anda dengan mudah. Pantau stok real-time, dapatkan alert otomatis, dan lacak riwayat pergerakan barang.",
};

const FEATURES = [
    {
        title: "Stok Real-Time",
        description: "Pantau level stok secara live dari semua cabang dalam satu dashboard terpusat.",
        icon: BarChart3,
    },
    {
        title: "Alert Stok Menipis",
        description: "Dapatkan notifikasi otomatis saat stok mendekati batas minimum yang Anda tentukan.",
        icon: Bell,
    },
    {
        title: "Riwayat Pergerakan",
        description: "Lacak siapa yang menginput, mengedit, atau menghapus item dari inventori.",
        icon: History,
    },
    {
        title: "Multi-Varian Produk",
        description: "Kelola produk dengan varian ukuran, warna, atau atribut lain dalam satu entri.",
        icon: Tags,
    },
    {
        title: "Transfer antar Cabang",
        description: "Pindahkan stok antar outlet dengan approval workflow yang terstruktur.",
        icon: Truck,
    },
    {
        title: "Pencarian Cepat",
        description: "Temukan produk dalam hitungan detik dengan pencarian berbasis nama, SKU, atau barcode.",
        icon: Search,
    },
];

const ALERTS = [
    { title: "Stok Hampir Habis", desc: "Notifikasi saat stok di bawah threshold", icon: AlertTriangle },
    { title: "Stok Over", desc: "Peringatan untuk produk yang menumpuk", icon: Package },
    { title: "Expired Soon", desc: "Alert untuk produk mendekati kadaluarsa", icon: Bell },
];

export default function InventoriPage() {
    return (
        <>
            <PageHero
                badgeLabel="Manajemen Stok"
                title="Kontrol Inventori"
                subtitle="Penuh & Presisi"
                description="Pantau stok real-time dari semua cabang. Dapatkan alert otomatis dan lacak setiap pergerakan barang dengan mudah."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Lihat Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Manajemen Inventori Lengkap</Heading>
                        <Text variant="lead" align="center">
                            Semua tools yang Anda butuhkan untuk mengelola stok dengan efisien.
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

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Heading as="h2">Sistem Alert Pintar</Heading>
                        <Text variant="lead">
                            Tidak perlu lagi cek stok manual setiap hari. Sistem kami akan memberitahu Anda saat ada yang perlu diperhatikan.
                        </Text>
                        <div className="space-y-4">
                            {ALERTS.map((alert) => (
                                <div key={alert.title} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                                        <alert.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{alert.title}</h3>
                                        <Text variant="muted" className="text-sm">{alert.desc}</Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Package className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Dashboard Inventori Preview</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Hindari Kehabisan Stok</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Mulai kelola inventori bisnis Anda dengan lebih baik hari ini.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/fitur/laporan">Lihat Laporan & Analitik →</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
