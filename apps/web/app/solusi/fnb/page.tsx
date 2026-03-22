import type { Metadata } from "next";
import Link from "next/link";
import { UtensilsCrossed, ChefHat, Truck, Table, Clock, Receipt, Star, BarChart3 } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Solusi F&B - Dine-in, Takeaway & Delivery",
    description: "Software restoran dan F&B lengkap. Kelola dine-in, takeaway, delivery, kitchen display system, dan laporan penjualan dalam satu platform.",
};

const FEATURES = [
    {
        title: "Multi-Channel Order",
        description: "Terima order dari dine-in, takeaway, delivery, dan online marketplace dalam satu sistem.",
        icon: Receipt,
    },
    {
        title: "Kitchen Display System",
        description: "Kirim order langsung ke dapur via KDS. Pantau status masakan: ordered, cooking, ready.",
        icon: ChefHat,
    },
    {
        title: "Table Management",
        description: "Atur layout meja, reservasi, dan split bill untuk grup besar.",
        icon: Table,
    },
    {
        title: "Delivery Integration",
        description: "Integrasi dengan Gojek, Grab, atau driver sendiri untuk pesanan delivery.",
        icon: Truck,
    },
    {
        title: "Menu Management",
        description: "Kelola menu dengan varian, addon, combo package, dan dynamic pricing.",
        icon: UtensilsCrossed,
    },
    {
        title: "Analytics F&B",
        description: "Analisis menu favorit, peak hour, dan profit margin per item.",
        icon: BarChart3,
    },
];

const CHANNELS = [
    { title: "Dine-in", desc: "Order di tempat dengan table service", icon: Table },
    { title: "Takeaway", desc: "Customer ambil sendiri di outlet", icon: Receipt },
    { title: "Delivery", desc: "Diantar ke alamat customer", icon: Truck },
];

export default function FnbPage() {
    return (
        <>
            <PageHero
                badgeLabel="Solusi Industri"
                title="Software F&B"
                subtitle="Restoran, Cafe & Cloud Kitchen"
                description="Kelola dine-in, takeaway, dan delivery dalam satu platform. Kitchen Display System, table management, dan integrasi delivery terpadu."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Lengkap untuk F&B</Heading>
                        <Text variant="lead" align="center">
                            Dari order masuk sampai masakan sampai ke meja, semua terintegrasi.
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
                        <Heading as="h2">Semua Channel dalam Satu Sistem</Heading>
                        <Text variant="lead" align="center">
                            Tidak perlu pindah-pindah sistem untuk order yang berbeda.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        {CHANNELS.map((channel) => (
                            <div key={channel.title} className="text-center p-8 rounded-2xl bg-background border border-border/60">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
                                    <channel.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{channel.title}</h3>
                                <Text variant="muted">{channel.desc}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="aspect-video rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <ChefHat className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Kitchen Display System Preview</Text>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Heading as="h2">Optimalkan Operasional Dapur</Heading>
                        <Text variant="lead">
                            Kitchen Display System membantu dapur bekerja lebih efisien dan mengurangi kesalahan order.
                        </Text>
                        <ul className="space-y-3">
                            {[
                                "Order langsung muncul di layar dapur",
                                "Warna berbeda untuk priority order",
                                "Timer untuk tracking cooking time",
                                "Notifikasi saat masakan siap",
                                "Inventory auto-deduct saat dish selesai"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <Star className="h-5 w-5 text-primary" />
                                    <Text className="text-sm">{item}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Tingkatkan Efisiensi Restoran?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Mulai kelola restoran Anda dengan sistem yang terintegrasi dan modern.
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
