import Link from "next/link";
import { Play, ClipboardCheck, Boxes, ArrowRight } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

const TUTORIAL_MODULES = [
    {
        title: "Setup Awal",
        description: "Daftar organisasi, tambah outlet, dan atur tim.",
        icon: ClipboardCheck,
    },
    {
        title: "Transaksi Harian",
        description: "Latih kasir, konfigurasi metode pembayaran, dan cetak struk.",
        icon: Play,
    },
    {
        title: "Inventori & Laporan",
        description: "Pantau stok, mutasi, serta laporan keuangan otomatis.",
        icon: Boxes,
    },
];

export default function TutorialPage() {
    return (
        <>
            <PageHero
                badgeLabel="Video Tutorial"
                title="Belajar Lebih Cepat"
                subtitle="Dalam 5 Menit"
                description="Panduan singkat agar tim Anda langsung mahir menggunakan Beres.io."
                primaryCta={{ label: "Mulai Belajar", href: "#modules" }}
                secondaryCta={{ label: "Hubungi Support", href: "/support" }}
                align="center"
            />

            <Section id="modules">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Modul Populer</Heading>
                        <Text variant="lead" align="center">
                            Pilih materi berdasarkan kebutuhan operasional tim Anda.
                        </Text>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {TUTORIAL_MODULES.map((module) => (
                            <Card key={module.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                        <module.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{module.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text variant="muted">{module.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Butuh Materi Tambahan?</Heading>
                    <Text variant="lead" align="center">
                        Kami dapat menyiapkan sesi onboarding khusus untuk tim Anda.
                    </Text>
                    <Button className="rounded-2xl px-8" asChild>
                        <Link href="/sales">
                            Jadwalkan Sesi Khusus
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Section>
        </>
    );
}
