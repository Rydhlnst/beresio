import type { Metadata } from "next";
import Link from "next/link";
import { Truck, MapPin, Bike, Store, Route, Clock, Bell, CheckCircle } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Manajemen Pengiriman - Integrasi Driver & Logistik",
    description: "Kelola pengiriman dengan mudah. Integrasi driver sendiri, Gojek, dan Grab dalam satu platform. Tracking real-time dan notifikasi otomatis.",
};

const FEATURES = [
    {
        title: "Multi-Kurir",
        description: "Pilih driver sendiri, Gojek, Grab, atau kurir eksternal lainnya dalam satu platform.",
        icon: Bike,
    },
    {
        title: "Tracking Real-Time",
        description: "Pantau posisi driver dan status pengiriman secara live di peta.",
        icon: MapPin,
    },
    {
        title: "Rute Optimal",
        description: "Sistem otomatis menentukan rute tercepat untuk multiple delivery.",
        icon: Route,
    },
    {
        title: "Notifikasi Pelanggan",
        description: "Customer otomatis mendapat update via WhatsApp/SMS saat driver berangkat & sampai.",
        icon: Bell,
    },
    {
        title: "Manajemen Driver",
        description: "Kelola data driver, jadwal, dan performa dalam satu dashboard.",
        icon: Truck,
    },
    {
        title: "Integrasi Toko Online",
        description: "Auto-create delivery order dari pesanan e-commerce Anda.",
        icon: Store,
    },
];

const DELIVERY_TYPES = [
    { title: "Instant", time: "1-3 jam", icon: Clock, desc: "Pengiriman kilat untuk order mendesak" },
    { title: "Same Day", time: "4-8 jam", icon: Truck, desc: "Sampai di hari yang sama" },
    { title: "Next Day", time: "1 hari", icon: CheckCircle, desc: "Pengiriman hemat untuk non-urgent" },
];

export default function PengirimanPage() {
    return (
        <>
            <PageHero
                badgeLabel="Logistik Terpadu"
                title="Manajemen Pengiriman"
                subtitle="Semua dalam Satu Platform"
                description="Integrasi driver sendiri, Gojek, dan Grab. Tracking real-time, rute optimal, dan notifikasi otomatis untuk pelanggan Anda."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Lihat Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Lengkap untuk Pengiriman</Heading>
                        <Text variant="lead" align="center">
                            Semua yang Anda butuhkan untuk mengelola logistik dengan efisien.
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
                        <Heading as="h2">Pilihan Pengiriman Fleksibel</Heading>
                        <Text variant="lead" align="center">
                            Sesuaikan jenis pengiriman dengan kebutuhan dan budget Anda.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        {DELIVERY_TYPES.map((type) => (
                            <div key={type.title} className="text-center p-8 rounded-2xl bg-background border border-border/60">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
                                    <type.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{type.title}</h3>
                                <div className="text-primary font-semibold mb-3">{type.time}</div>
                                <Text variant="muted">{type.desc}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Heading as="h2">Integrasi Seamless</Heading>
                        <Text variant="lead">
                            Hubungkan Beres.io dengan platform e-commerce dan layanan pengiriman yang sudah Anda gunakan.
                        </Text>
                        <div className="grid grid-cols-2 gap-4">
                            {["Gojek", "Grab", "Shopify", "WooCommerce", "Tokopedia", "Shopee"].map((platform) => (
                                <div key={platform} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                    <div className="h-8 w-8 rounded bg-primary/20" />
                                    <span className="font-medium text-sm">{platform}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <MapPin className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Live Tracking Preview</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Sederhanakan Pengiriman Anda</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Hemat waktu dan biaya logistik dengan sistem terpadu Beres.io
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/fitur/tim">Lihat Manajemen Tim →</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
