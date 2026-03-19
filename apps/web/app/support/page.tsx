import Link from "next/link";
import { LifeBuoy, BookOpen, MessageCircle, ArrowRight } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

const SUPPORT_CARDS = [
    {
        title: "Pusat Bantuan",
        description: "Panduan singkat dan jawaban cepat untuk pertanyaan umum.",
        icon: BookOpen,
        href: "/tutorial",
        cta: "Lihat Tutorial",
    },
    {
        title: "Live Support",
        description: "Butuh bantuan cepat? Hubungi tim kami untuk solusi langsung.",
        icon: MessageCircle,
        href: "/sales",
        cta: "Hubungi Tim",
    },
    {
        title: "Status Layanan",
        description: "Pantau informasi terbaru tentang ketersediaan layanan.",
        icon: LifeBuoy,
        href: "/support",
        cta: "Cek Status",
    },
];

export default function SupportPage() {
    return (
        <>
            <PageHero
                badgeLabel="Support 24/7"
                title="Pusat Bantuan"
                subtitle="Untuk Bisnis Anda"
                description="Kami siap membantu mulai dari onboarding, troubleshooting, sampai konsultasi operasional."
                primaryCta={{ label: "Hubungi Support", href: "#contact" }}
                secondaryCta={{ label: "Lihat Tutorial", href: "/tutorial" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Cara Kami Membantu</Heading>
                        <Text variant="lead" align="center">
                            Pilih jalur bantuan yang paling cepat untuk tim Anda.
                        </Text>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {SUPPORT_CARDS.map((card) => (
                            <Card key={card.title} className="border-border/60 flex flex-col">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                        <card.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{card.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    <Text variant="muted">{card.description}</Text>
                                    <Button variant="outline" className="rounded-2xl mt-auto" asChild>
                                        <Link href={card.href}>
                                            {card.cta}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section id="contact">
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Butuh Bantuan Lebih Lanjut?</Heading>
                    <Text variant="lead" align="center">
                        Tim kami akan menindaklanjuti permintaan support Anda secepat mungkin.
                    </Text>
                    <Button className="rounded-2xl px-8" asChild>
                        <Link href="/sales">
                            Hubungi Tim Support
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Section>
        </>
    );
}
