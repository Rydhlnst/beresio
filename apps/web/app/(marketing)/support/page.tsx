import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { complianceConfig, buildMailtoUrl, buildWhatsAppUrl } from "@repo/ui/compliance";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata, pageKeywords } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Pusat Bantuan & Support",
    path: "/support",
    description: `Kanal dukungan resmi ${complianceConfig.brandName} untuk onboarding, operasional, billing, dan eskalasi pengaduan.`,
    keywords: pageKeywords.support,
});

const supportCards = [
    {
        title: "WhatsApp Support",
        description: "Untuk pertanyaan operasional cepat dan kendala harian.",
        icon: MessageCircle,
        href: buildWhatsAppUrl(complianceConfig.supportWhatsApp, "Halo tim support Beres Cloud, saya butuh bantuan."),
        cta: "Buka WhatsApp",
        external: true,
    },
    {
        title: "Email Support",
        description: "Untuk issue yang membutuhkan lampiran dan tracking formal.",
        icon: Mail,
        href: buildMailtoUrl(complianceConfig.supportEmail, "Permintaan Dukungan Beres Cloud"),
        cta: "Kirim Email",
        external: false,
    },
    {
        title: "Kanal Pengaduan",
        description: "Untuk eskalasi layanan, billing, atau kepatuhan kebijakan.",
        icon: LifeBuoy,
        href: buildMailtoUrl(complianceConfig.complaintChannel, "Pengaduan Layanan Beres Cloud"),
        cta: "Ajukan Pengaduan",
        external: false,
    },
];

export default function SupportPage() {
    return (
        <>
            <PageHero
                badgeLabel="Support Resmi"
                title="Pusat Bantuan"
                subtitle={complianceConfig.brandName}
                description="Semua permintaan support diproses lewat kanal resmi agar SLA dan audit trail tetap jelas."
                primaryCta={{ label: "Hubungi Support", href: buildWhatsAppUrl(complianceConfig.supportWhatsApp) }}
                secondaryCta={{ label: "Kebijakan Refund", href: "/refund-cancellation" }}
                align="center"
            />

            <Section>
                <div className="grid gap-6 md:grid-cols-3">
                    {supportCards.map((card) => (
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
                                    <Link href={card.href} target={card.external ? "_blank" : undefined} rel={card.external ? "noreferrer" : undefined}>
                                        {card.cta}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </Section>

            <Section>
                <div className="rounded-2xl border border-border/60 bg-background p-6">
                    <Heading as="h2">SLA & Identitas Layanan</Heading>
                    <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                        <li>Respon awal support: maksimal 1 hari kerja.</li>
                        <li>Jam layanan: {complianceConfig.businessHours}.</li>
                        <li>Entitas layanan: {complianceConfig.legalEntityName}.</li>
                        <li>Alamat terdaftar: {complianceConfig.businessAddress}.</li>
                    </ul>
                </div>
            </Section>
        </>
    );
}
