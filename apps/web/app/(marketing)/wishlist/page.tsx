import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Input, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Join Wishlist - Akses Prioritas",
    path: "/wishlist",
    description: "Daftar wishlist Beres.io untuk mendapatkan akses beta lebih awal, onboarding gratis, dan diskon spesial peluncuran. Slot terbatas!",
    keywords: ["wishlist software kasir", "early access POS", "beta testing UMKM", "diskon peluncuran"],
});

const WISHLIST_BENEFITS = [
    {
        title: "Akses Lebih Dulu",
        description: "Dapatkan undangan prioritas saat produk siap digunakan.",
        icon: Sparkles,
    },
    {
        title: "Onboarding Dipandu",
        description: "Tim kami bantu setup awal agar bisnis Anda langsung siap jalan.",
        icon: ShieldCheck,
    },
    {
        title: "Demo Eksklusif",
        description: "Lihat fitur utama dan alur kerja sebelum publik rilis.",
        icon: Calendar,
    },
];

export default function WishlistPage() {
    return (
        <>
            <PageHero
                badgeLabel="Wishlist Beres.io"
                title="Dapatkan Akses Prioritas"
                subtitle="Sebelum Peluncuran Resmi"
                description="Masuk dalam antrean VIP untuk mencoba Beres.io lebih dulu, lengkap dengan sesi onboarding dan demo pribadi."
                primaryCta={{ label: "Join Wishlist", href: "#join" }}
                secondaryCta={{ label: "Lihat Demo", href: "/demo" }}
                align="center"
            />

            <Section id="benefits">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Kenapa Join Wishlist?</Heading>
                        <Text variant="lead" align="center">
                            Biar tim Anda bisa siap dari sekarang dan tidak ketinggalan akses awal.
                        </Text>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {WISHLIST_BENEFITS.map((benefit) => (
                            <Card key={benefit.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10">
                                        <benefit.icon className="h-5 w-5 text-brand" />
                                    </div>
                                    <CardTitle className="text-base">{benefit.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text variant="muted">{benefit.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section id="join">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
                    <div className="space-y-4">
                        <Heading as="h2">Daftar Dalam 1 Menit</Heading>
                        <Text variant="lead">
                            Tinggalkan kontak utama agar kami bisa mengirim update dan jadwal demo.
                        </Text>
                        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                            <span>- Undangan akses beta dikirim bertahap.</span>
                            <span>- Data Anda aman dan hanya digunakan untuk komunikasi produk.</span>
                        </div>
                    </div>

                    <Card className="border-border/60">
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Text variant="detail">Nama Lengkap</Text>
                                <Input placeholder="Nama Anda" />
                            </div>
                            <div className="space-y-2">
                                <Text variant="detail">Email Bisnis</Text>
                                <Input type="email" placeholder="nama@bisnis.com" />
                            </div>
                            <div className="space-y-2">
                                <Text variant="detail">Nama Usaha</Text>
                                <Input placeholder="Nama usaha Anda" />
                            </div>
                            <Button className="w-full rounded-2xl" type="button" asChild>
                                <Link href="/sales">
                                    Kirim Minat
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Text variant="muted">
                                Form asli akan aktif saat fase beta dibuka. Untuk sementara, tim sales akan menghubungi Anda.
                            </Text>
                        </CardContent>
                    </Card>
                </div>
            </Section>
        </>
    );
}
