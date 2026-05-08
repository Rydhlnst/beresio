import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { complianceConfig, buildMailtoUrl, buildWhatsAppUrl } from "@repo/ui/compliance";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Hubungi Sales",
    path: "/sales",
    description:
        "Konsultasi langsung dengan tim Beres Cloud untuk kesiapan onboarding bisnis dan aktivasi pembayaran Midtrans/Xendit.",
    keywords: ["hubungi sales beres cloud", "konsultasi onboarding payment gateway", "demo saas umkm"],
});

const cards = [
    {
        title: "Konsultasi Kebutuhan",
        description: "Review model bisnis, vertical, dan flow transaksi agar sesuai review gateway.",
        icon: MessageCircle,
    },
    {
        title: "Mapping Payment Provider",
        description: "Tentukan skenario Midtrans/Xendit untuk transaksi merchant dan billing SaaS.",
        icon: ShieldCheck,
    },
    {
        title: "Rencana Implementasi",
        description: "Susun timeline aktivasi sandbox, uji flow, dan kesiapan go-live production.",
        icon: CalendarCheck,
    },
];

export default function SalesPage() {
    const salesWhatsappUrl = buildWhatsAppUrl(
        complianceConfig.supportWhatsApp,
        "Halo tim Beres Cloud, saya ingin konsultasi sales dan kesiapan onboarding payment gateway."
    );

    return (
        <>
            <PageHero
                badgeLabel="Hubungi Sales"
                title="Diskusi Langsung"
                subtitle={`dengan Tim ${complianceConfig.brandName}`}
                description="Untuk mempercepat onboarding payment gateway, hubungi tim kami melalui kanal resmi berikut."
                primaryCta={{ label: "Chat WhatsApp Sales", href: salesWhatsappUrl }}
                secondaryCta={{ label: "Lihat Checkout Demo", href: "/billing/checkout" }}
                align="center"
            />

            <Section>
                <div className="grid gap-6 md:grid-cols-3">
                    {cards.map((card) => (
                        <Card key={card.title} className="border-border/60">
                            <CardHeader className="space-y-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10">
                                    <card.icon className="h-5 w-5 text-brand" />
                                </div>
                                <CardTitle className="text-base">{card.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Text variant="muted">{card.description}</Text>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </Section>

            <Section>
                <div className="grid gap-6 rounded-2xl border border-border/60 bg-background p-6 lg:grid-cols-2">
                    <div className="space-y-3">
                        <Heading as="h2">Kanal Operasional Resmi</Heading>
                        <p className="text-sm text-muted-foreground">
                            Tidak ada form placeholder. Semua permintaan ditindaklanjuti via kanal resmi agar jejak komunikasi dan SLA jelas.
                        </p>
                        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                            <li>Respons awal: maksimal 1 hari kerja.</li>
                            <li>Jam layanan: {complianceConfig.businessHours}.</li>
                            <li>Escalation path: {complianceConfig.complaintChannel}.</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <Button asChild className="h-11 w-full rounded-xl justify-start">
                            <Link href={salesWhatsappUrl} target="_blank" rel="noreferrer">
                                WhatsApp Sales ({complianceConfig.supportWhatsApp})
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-11 w-full rounded-xl justify-start">
                            <Link href={buildMailtoUrl(complianceConfig.supportEmail, "Permintaan Konsultasi Sales Beres Cloud")}>
                                Email Sales ({complianceConfig.supportEmail})
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-11 w-full rounded-xl justify-start">
                            <Link href={buildMailtoUrl(complianceConfig.complaintChannel, "Eskalasi Pengaduan Layanan Beres Cloud")}>
                                Kanal Pengaduan ({complianceConfig.complaintChannel})
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
