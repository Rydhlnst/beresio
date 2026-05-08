import type { Metadata } from "next";
import Link from "next/link";
import { Target, Eye, Heart, Users, Award, Globe } from "lucide-react";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Tentang Kami",
    description: "Kenali tim di balik Beres Cloud. Misi kami adalah membantu UMKM Indonesia digitalisasi operasional bisnis mereka.",
};

const VALUES = [
    {
        title: "Customer First",
        description: "Kebutuhan pelanggan adalah prioritas utama dalam setiap keputusan produk.",
        icon: Heart,
    },
    {
        title: "Simplicity",
        description: "Teknologi harus memudahkan, tidak membingungkan. Kita desain untuk simplicity.",
        icon: Target,
    },
    {
        title: "Transparency",
        description: "Harga transparan, data aman, dan komunikasi jujur dalam setiap interaksi.",
        icon: Eye,
    },
    {
        title: "Continuous Improvement",
        description: "Selalu belajar dan berkembang untuk memberikan nilai terbaik.",
        icon: Award,
    },
];

const STATS = [
    { value: "500+", label: "Bisnis Terbantu" },
    { value: "50+", label: "Kota di Indonesia" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
];

export default function AboutPage() {
    return (
        <>
            <PageHero
                badgeLabel="Tentang Kami"
                title="Membangun Masa Depan"
                subtitle="Bisnis UMKM Indonesia"
                description="Beres Cloud lahir dari keinginan untuk membantu UMKM Indonesia bertumbuh dengan teknologi yang terjangkau dan mudah digunakan."
                primaryCta={{ label: "Join Tim Kami", href: "/careers" }}
                secondaryCta={{ label: "Hubungi Kami", href: "/support" }}
                align="center"
            />

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Heading as="h2">Cerita Kami</Heading>
                        <Text variant="lead">
                            Beres Cloud dimulai dari pengamatan bahwa banyak UMKM di Indonesia masih menggunakan pencatatan manual atau software yang terlalu kompleks dan mahal.
                        </Text>
                        <Text>
                            Kami percaya setiap bisnis, sekecil apapun, berhak mendapatkan akses ke teknologi yang bisa membantu mereka berkembang. Dengan prinsip simplicity dan affordability, kami membangun platform yang mudah dipelajari namun powerful.
                        </Text>
                        <Text>
                            Hari ini, Beres Cloud telah membantu ratusan bisnis di berbagai industri: dari laundry, F&B, retail, sampai salon dan franchise. Perjalanan masih panjang, dan kami terus berkembang bersama para entrepreneur Indonesia.
                        </Text>
                    </div>
                    <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Globe className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Beres Cloud Team</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section className="bg-muted/30">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Nilai-Nilai Kami</Heading>
                        <Text variant="lead" align="center">
                            Prinsip yang menuntun setiap keputusan dan tindakan kami.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {VALUES.map((value) => (
                            <Card key={value.title} className="border-border/60">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                                            <value.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{value.title}</h3>
                                            <Text variant="muted" className="text-sm">{value.description}</Text>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="text-center p-6 rounded-2xl bg-muted/50">
                            <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                            <Text variant="muted">{stat.label}</Text>
                        </div>
                    ))}
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Gabung dalam Perjalanan Kami</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Kami selalu mencari talenta yang passionate untuk membantu UMKM Indonesia bertumbuh.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/careers">Lihat Lowongan</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/partnership">Partnership</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
