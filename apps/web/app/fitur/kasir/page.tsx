import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart, Receipt, CreditCard, Printer, Smartphone, Zap } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Kasir Digital (POS) - Transaksi Cepat & Multi-Payment",
    description: "Kasir digital Beres.io mendukung multi-payment, cetak struk otomatis, dan integrasi QRIS. Transaksi lebih cepat dengan antarmuka yang intuitif.",
};

const FEATURES = [
    {
        title: "Multi-Payment",
        description: "Terima pembayaran tunai, transfer, QRIS, kartu debit/kredit dalam satu platform.",
        icon: CreditCard,
    },
    {
        title: "Cetak Struk Otomatis",
        description: "Integrasi dengan printer thermal untuk cetak struk instan setelah transaksi.",
        icon: Printer,
    },
    {
        title: "Mode Offline",
        description: "Transaksi tetap berjalan meski koneksi internet terputus. Sinkronisasi otomatis saat online.",
        icon: Zap,
    },
    {
        title: "Split Bill",
        description: "Pisah tagihan untuk grup customer dengan mudah dan cepat.",
        icon: Receipt,
    },
    {
        title: "Aplikasi Kasir Mobile",
        description: "Gunakan smartphone atau tablet sebagai terminal kasir. Tidak perlu perangkat mahal.",
        icon: Smartphone,
    },
    {
        title: "Dashboard Real-time",
        description: "Pantau transaksi harian, pendapatan, dan item terlaris secara live.",
        icon: ShoppingCart,
    },
];

const WORKFLOW = [
    { step: "1", title: "Scan/Input Item", desc: "Scan barcode atau pilih item dari katalog" },
    { step: "2", title: "Pilih Payment", desc: "Tunai, QRIS, transfer, atau kartu" },
    { step: "3", title: "Konfirmasi", desc: "Review total dan diskon otomatis" },
    { step: "4", title: "Struk Keluar", desc: "Cetak atau kirim struk digital" },
];

export default function KasirPage() {
    return (
        <>
            <PageHero
                badgeLabel="Fitur Unggulan"
                title="Kasir Digital"
                subtitle="Cepat & Andal"
                description="Transaksi lebih cepat dengan antarmuka intuitif. Dukung multi-payment, cetak struk otomatis, dan mode offline untuk bisnis Anda."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Lengkap untuk Kasir Modern</Heading>
                        <Text variant="lead" align="center">
                            Semua yang Anda butuhkan untuk transaksi yang efisien dan profesional.
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
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Alur Transaksi Sederhana</Heading>
                        <Text variant="lead" align="center">
                            Hanya 4 langkah untuk menyelesaikan setiap transaksi.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {WORKFLOW.map((item) => (
                            <div key={item.step} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-muted/50">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                                    {item.step}
                                </div>
                                <h3 className="font-semibold mb-2">{item.title}</h3>
                                <Text variant="muted" className="text-sm">{item.desc}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Meningkatkan Efisiensi Kasir?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Bergabung dengan ratusan bisnis yang telah beralih ke kasir digital Beres.io
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">
                                Mulai Free Trial
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/harga">Lihat Paket Harga</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
