import type { Metadata } from "next";
import Link from "next/link";
import { Scissors, Calendar, UserCheck, Clock, Star, Gift, CreditCard, BarChart3 } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Solusi Salon & Spa - Booking & Manajemen Layanan",
    description: "Software salon dan spa lengkap dengan booking online, manajemen stylist/therapist, paket layanan, dan membership.",
};

const FEATURES = [
    {
        title: "Booking Online",
        description: "Customer bisa booking sendiri via web atau aplikasi. Pilih layanan, stylist, dan slot waktu yang tersedia.",
        icon: Calendar,
    },
    {
        title: "Assign Stylist",
        description: "Atur jadwal stylist/therapist dan assign customer ke staff yang sesuai keahliannya.",
        icon: UserCheck,
    },
    {
        title: "Paket Layanan",
        description: "Buat paket bundle: hair + facial + manicure dengan harga spesial.",
        icon: Gift,
    },
    {
        title: "Manajemen Slot",
        description: "Atur durasi tiap layanan dan mencegah double booking.",
        icon: Clock,
    },
    {
        title: "Membership & Loyalty",
        description: "Point rewards, tier member, dan promo khusus member.",
        icon: Star,
    },
    {
        title: "Deposit & Prepaid",
        description: "Terima deposit atau paket prepaid untuk cashflow lebih baik.",
        icon: CreditCard,
    },
];

const BENEFITS = [
    { title: "No-Show Reduction", desc: "Reminder otomatis via WA/SMS 24 jam & 1 jam sebelum jadwal", icon: Clock },
    { title: "Upsell Package", desc: "Rekomendasi paket bundle saat booking", icon: Gift },
    { title: "Staff Performance", desc: "Track rating dan jumlah service per stylist", icon: Star },
];

export default function SalonPage() {
    return (
        <>
            <PageHero
                badgeLabel="Solusi Industri"
                title="Software Salon & Spa"
                subtitle="Booking & Layanan Profesional"
                description="Booking online, manajemen stylist/therapist, paket layanan, dan membership. Tingkatkan pengalaman customer salon Anda."
                primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
                secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Khusus Salon & Spa</Heading>
                        <Text variant="lead" align="center">
                            Semua yang Anda butuhkan untuk mengelola salon dengan profesional.
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
                        <Heading as="h2">Keuntungan untuk Bisnis Anda</Heading>
                        <Text variant="lead" align="center">
                            Optimalkan operasional dan tingkatkan revenue salon.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-3">
                        {BENEFITS.map((item) => (
                            <div key={item.title} className="text-center p-8 rounded-2xl bg-background border border-border/60">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
                                    <item.icon className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                                <Text variant="muted">{item.desc}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Calendar className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Booking Calendar Preview</Text>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Heading as="h2">Alur Booking Sederhana</Heading>
                        <Text variant="lead">
                            Customer booking dengan mudah, Anda tinggal fokus melayani.
                        </Text>
                        <ol className="space-y-3">
                            {[
                                "Customer pilih layanan & stylist",
                                "Pilih slot waktu yang tersedia",
                                "Terima konfirmasi booking",
                                "Reminder otomatis sebelum jadwal",
                                "Check-in dan mulai layanan"
                            ].map((item, idx) => (
                                <li key={item} className="flex items-center gap-3">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                        {idx + 1}
                                    </div>
                                    <Text className="text-sm">{item}</Text>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Modernisasi Salon Anda?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Mulai terima booking online dan kelola salon dengan lebih efisien.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/solusi/franchise">Lihat Solusi Franchise →</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
