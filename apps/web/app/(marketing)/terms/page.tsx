import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Scale, ShieldCheck, ArrowRight } from "lucide-react";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata, pageKeywords } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Syarat & Ketentuan Penggunaan",
    path: "/terms",
    description: "Syarat dan ketentuan penggunaan Beres.io. Pahami hak, kewajiban, dan tanggung jawab dalam menggunakan platform kasir digital kami.",
    keywords: pageKeywords.terms,
});

const TERMS_POINTS = [
    {
        title: "Kewajiban Pengguna",
        description: "Gunakan akun secara bertanggung jawab dan jaga keamanan akses.",
        icon: ShieldCheck,
    },
    {
        title: "Hak & Lisensi",
        description: "Beres.io memberikan akses layanan sesuai paket berlangganan.",
        icon: Scale,
    },
    {
        title: "Perubahan Layanan",
        description: "Kami akan memberi tahu sebelum perubahan signifikan diberlakukan.",
        icon: FileText,
    },
];

export default function TermsPage() {
    return (
        <>
            <PageHero
                badgeLabel="Legal"
                title="Syarat & Ketentuan"
                subtitle="Penggunaan Beres.io"
                description="Ringkasan aturan penggunaan, hak, dan tanggung jawab antara Beres.io dan pengguna."
                primaryCta={{ label: "Baca Privacy", href: "/privacy" }}
                secondaryCta={{ label: "Hubungi Support", href: "/support" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Poin Penting</Heading>
                        <Text variant="lead" align="center">
                            Ini adalah ringkasan singkat sebelum dokumen final dipublikasikan.
                        </Text>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {TERMS_POINTS.map((point) => (
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
                    <Heading as="h2">Butuh Klarifikasi?</Heading>
                    <Text variant="lead" align="center">
                        Hubungi tim kami jika ada bagian yang perlu dijelaskan lebih detail.
                    </Text>
                    <Button className="rounded-2xl px-8" asChild>
                        <Link href="/support">
                            Hubungi Tim Legal
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </Section>
        </>
    );
}
