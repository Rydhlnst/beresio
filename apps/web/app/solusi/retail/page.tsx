import type { Metadata } from "next";
import Link from "next/link";
import { Store, Barcode, ArrowLeftRight, Package, Tag, Users, Gift, BarChart3 } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Solusi Retail - POS, Barcode & Manajemen Produk",
    description: "Software retail lengkap dengan barcode scanner, varian produk, retur & penukaran, membership, dan laporan penjualan terperinci.",
};

const FEATURES = [
    {
        title: "Barcode Scanning",
        description: "Scan produk dengan barcode scanner atau kamera smartphone untuk transaksi cepat.",
        icon: Barcode,
    },
    {
        title: "Varian Produk",
        description: "Kelola produk dengan varian: ukuran, warna, dan atribut lain dalam satu SKU.",
        icon: Package,
    },
    {
        title: "Retur & Penukaran",
        description: "Proses retur dan tukar barang dengan mudah dengan refund ke cash atau store credit.",
        icon: ArrowLeftRight,
    },
    {
        title: "Promo & Diskon",
        description: "Buat promo: buy X get Y, diskon persentase, flash sale, dan voucher.",
        icon: Tag,
    },
    {
        title: "Membership",
        description: "Kelola member dengan point reward, tier level, dan birthday rewards.",
        icon: Users,
    },
    {
        title: "Gift Card",
        description: "Terbitkan gift card fisik atau digital sebagai produk atau voucher.",
        icon: Gift,
    },
];

const BENEFITS = [
    { label: "Checkout", value: "3x", desc: "Lebih cepat dengan barcode" },
    { label: "Accuracy", value: "99%", desc: "Dengan sistem terintegrasi" },
    { label: "Stock Sync", value: "Real-time", desc: "Antar semua channel" },
    { label: "Reporting", value: "50+", desc: "Metrik bisnis tersedia" },
];

export default function RetailPage() {
    return (
        <>
            <PageHero
                badgeLabel="Solusi Industri"
                title="Software Retail"
                subtitle="Toko, Minimarket & Boutique"
                description="Kelola toko retail dengan barcode scanning, varian produk, retur, membership, dan promo. Semua dalam satu platform terintegrasi."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Lengkap untuk Retail</Heading>
                        <Text variant="lead" align="center">
                            Dari stock intake sampai checkout, semua proses retail tercakup.
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
                        <Heading as="h2">Efisiensi yang Dirasakan</Heading>
                        <Text variant="lead" align="center">
                            Tingkatkan kecepatan dan akurasi operasional toko Anda.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {BENEFITS.map((item) => (
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
                    <div className="space-y-6">
                        <Heading as="h2">Multi-Channel Retail</Heading>
                        <Text variant="lead">
                            Jual di toko fisik, e-commerce, dan marketplace dengan stok yang tersinkronisasi.
                        </Text>
                        <ul className="space-y-3">
                            {[
                                "Toko fisik dengan POS",
                                "Toko online dengan webstore",
                                "Marketplace: Tokopedia, Shopee, TikTok Shop",
                                "WhatsApp Commerce",
                                "Stok terpusat semua channel"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <Store className="h-5 w-5 text-primary" />
                                    <Text className="text-sm">{item}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Barcode className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Retail POS Preview</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Upgrade Toko Anda?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Mulai kelola retail dengan sistem modern yang terintegrasi.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/solusi/salon">Lihat Solusi Salon →</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
