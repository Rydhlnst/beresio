import type { Metadata } from "next";
import Link from "next/link";
import { WashingMachine, Clock, Bell, Package, CheckCircle, Truck, Sparkles, BarChart3 } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Solusi Laundry - Order, Tracking & Notifikasi Otomatis",
    description: "Software laundry lengkap dengan order management, tracking status cucian, notifikasi siap ambil, dan laporan keuangan otomatis.",
};

const FEATURES = [
    {
        title: "Order Management",
        description: "Terima order via kasir, WhatsApp, atau aplikasi customer. Otomatisasi nomor nota dan kode tracking.",
        icon: Package,
    },
    {
        title: "Tracking Cucian",
        description: "Customer bisa cek status cucian real-time: diterima, dicuci, disetrika, siap diambil.",
        icon: CheckCircle,
    },
    {
        title: "Notifikasi Otomatis",
        description: "Kirim notifikasi WhatsApp/SMS saat cucian siap diambil atau driver sampai.",
        icon: Bell,
    },
    {
        title: "Delivery & Pickup",
        description: "Kelola jadwal pickup dan delivery dengan driver internal atau eksternal.",
        icon: Truck,
    },
    {
        title: "Paket Layanan",
        description: "Atur berbagai paket: kiloan, satuan, express, dry clean dengan harga berbeda.",
        icon: Sparkles,
    },
    {
        title: "Laporan Lengkap",
        description: "Pantau omset harian, jumlah kiloan, customer baru vs repeat order.",
        icon: BarChart3,
    },
];

const WORKFLOW = [
    { step: "1", title: "Terima Order", desc: "Input atau terima order via WA" },
    { step: "2", title: "Weighing", desc: "Timbang dan tentukan harga" },
    { step: "3", title: "Process", desc: "Update status saat dikerjakan" },
    { step: "4", title: "Notify", desc: "Otomatis notif saat selesai" },
];

export default function LaundryPage() {
    return (
        <>
            <PageHero
                badgeLabel="Solusi Industri"
                title="Software Laundry"
                subtitle="Lengkap & Terintegrasi"
                description="Kelola order, tracking status cucian, notifikasi otomatis, dan delivery dalam satu platform. Cocok untuk laundry kiloan maupun premium."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Khusus Laundry</Heading>
                        <Text variant="lead" align="center">
                            Semua yang Anda butuhkan untuk menjalankan bisnis laundry dengan profesional.
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
                        <Heading as="h2">Alur Kerja Sederhana</Heading>
                        <Text variant="lead" align="center">
                            Dari order masuk sampai customer pickup, semua tercatat rapi.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {WORKFLOW.map((item) => (
                            <div key={item.step} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-background border border-border/60">
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
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Heading as="h2">Kenapa Laundry Pilih Beres.io?</Heading>
                        <Text variant="lead">
                            Kami memahami spesifik bisnis laundry dan membuat fitur yang benar-benar Anda butuhkan.
                        </Text>
                        <ul className="space-y-3">
                            {[
                                "Label barcode untuk setiap order",
                                "SMS/WhatsApp gateway terintegrasi",
                                "Membership & loyalty points",
                                "Integrasi printer thermal",
                                "Multi-cabang untuk chain laundry"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-primary" />
                                    <Text className="text-sm">{item}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <WashingMachine className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Laundry Dashboard Preview</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Modernisasi Laundry Anda?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Bergabung dengan ratusan laundry yang sudah beralih ke sistem digital.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/solusi/fnb">Lihat Solusi F&B →</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
