import type { Metadata } from "next";
import Link from "next/link";
import { PlayCircle, ClipboardList, Presentation, ArrowRight } from "lucide-react";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata, pageKeywords } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Jadwalkan Demo Software Kasir",
    path: "/demo",
    description: "Lihat demo Beres Cloud dalam aksi. Sesi demo singkat untuk menunjukkan cara kerja POS, inventori, dan laporan keuangan dalam satu platform.",
    keywords: pageKeywords.demo,
});

const DEMO_STEPS = [
    {
        title: "Ceritakan Kebutuhan",
        description: "Bagikan jenis bisnis, jumlah cabang, dan alur operasional.",
        icon: ClipboardList,
    },
    {
        title: "Demo Terarah",
        description: "Kami tunjukkan fitur yang paling relevan untuk tim Anda.",
        icon: Presentation,
    },
    {
        title: "Rencana Implementasi",
        description: "Dapatkan rekomendasi setup dan timeline go-live.",
        icon: PlayCircle,
    },
];

export default function DemoPage() {
    return (
        <>
            <PageHero
                badgeLabel="Jadwalkan Demo"
                title="Lihat Beres Cloud"
                subtitle="Dalam Aksi Nyata"
                description="Sesi demo singkat untuk menunjukkan bagaimana Beres Cloud membantu transaksi, inventori, dan laporan keuangan berjalan rapi."
                primaryCta={{ label: "Jadwalkan Demo", href: "/sales" }}
                secondaryCta={{ label: "Join Wishlist", href: "/wishlist" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Apa yang Akan Anda Dapatkan</Heading>
                        <Text variant="lead" align="center">
                            Demo fokus pada workflow bisnis Anda, bukan sekadar fitur umum.
                        </Text>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {DEMO_STEPS.map((step) => (
                            <Card key={step.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10">
                                        <step.icon className="h-5 w-5 text-brand" />
                                    </div>
                                    <CardTitle className="text-base">{step.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text variant="muted">{step.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Memulai?</Heading>
                    <Text variant="lead" align="center">
                        Kami akan menghubungi Anda untuk menentukan jadwal yang paling nyaman.
                    </Text>
                    <Button className="rounded-2xl px-8" asChild>
                        <Link href="/sales">
                            Hubungi Tim Sales
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Section>
        </>
    );
}
