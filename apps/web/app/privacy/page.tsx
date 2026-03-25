import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, FileText, ArrowRight } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata, pageKeywords } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Kebijakan Privasi - Perlindungan Data Bisnis Anda",
    description: "Kebijakan privasi Beres.io. Pelajari bagaimana kami mengelola data bisnis Anda dengan aman, enkripsi terkini, dan kontrol akses ketat.",
    keywords: pageKeywords.privacy,
});

const PRIVACY_POINTS = [
    {
        title: "Data yang Dikumpulkan",
        description: "Informasi akun, data transaksi, dan konfigurasi outlet.",
        icon: FileText,
    },
    {
        title: "Keamanan",
        description: "Akses dibatasi, audit log, dan kontrol berbasis peran.",
        icon: Lock,
    },
    {
        title: "Hak Anda",
        description: "Minta salinan data, perbaikan, atau penghapusan sesuai kebijakan.",
        icon: ShieldCheck,
    },
];

export default function PrivacyPage() {
    return (
        <>
            <PageHero
                badgeLabel="Legal"
                title="Kebijakan Privasi"
                subtitle="Beres.io"
                description="Ringkasan cara kami mengelola data, keamanan, dan hak Anda sebagai pengguna."
                primaryCta={{ label: "Hubungi Support", href: "/support" }}
                secondaryCta={{ label: "Syarat & Ketentuan", href: "/terms" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Ringkasan Utama</Heading>
                        <Text variant="lead" align="center">
                            Versi singkat sebelum dokumen legal lengkap dipublikasikan.
                        </Text>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {PRIVACY_POINTS.map((point) => (
                            <Card key={point.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                        <point.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{point.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text variant="muted">{point.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Butuh Penjelasan Lebih Lengkap?</Heading>
                    <Text variant="lead" align="center">
                        Tim kami siap membantu menjelaskan kebijakan data dan keamanan.
                    </Text>
                    <Button className="rounded-2xl px-8" asChild>
                        <Link href="/support">
                            Hubungi Tim Privacy
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Section>
        </>
    );
}
