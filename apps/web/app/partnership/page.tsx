import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Store, Code, Building2, ArrowRight, CheckCircle } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Partnership - Kolaborasi dengan Beres.io",
    description: "Jadi partner Beres.io. Program reseller, integrasi teknologi, dan kerjasama strategis untuk pertumbuhan bersama.",
};

const PARTNERSHIP_TYPES = [
    {
        title: "Reseller Partner",
        description: "Jual Beres.io ke jaringan bisnis Anda dan dapatkan komisi menarik. Cocok untuk konsultan bisnis dan agency.",
        icon: Store,
        benefits: [
            "Komisi hingga 30%",
            "Marketing support",
            "Sales training",
            "Dedicated account manager",
        ],
    },
    {
        title: "Technology Partner",
        description: "Integrasikan aplikasi Anda dengan Beres.io. Buka peluang pasar baru melalui integration marketplace kami.",
        icon: Code,
        benefits: [
            "API & webhook access",
            "Integration support",
            "Co-marketing opportunities",
            "Partner directory listing",
        ],
    },
    {
        title: "Enterprise Partner",
        description: "Kerjasama strategis untuk deployment skala besar. Cocok untuk korporasi dan grup bisnis.",
        icon: Building2,
        benefits: [
            "Custom pricing",
            "White-label options",
            "Dedicated infrastructure",
            "Priority support",
        ],
    },
];

export default function PartnershipPage() {
    return (
        <>
            <PageHero
                badgeLabel="Partnership"
                title="Grow Together"
                subtitle="With Beres.io"
                description="Jadilah bagian dari ekosistem Beres.io. Bersama-sama kita bisa membantu lebih banyak UMKM Indonesia bertumbuh."
                primaryCta={{ label: "Apply Partnership", href: "#types" }}
                secondaryCta={{ label: "Hubungi Tim", href: "/sales" }}
                align="center"
            />

            <Section id="types">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Pilih Tipe Partnership</Heading>
                        <Text variant="lead" align="center">
                            Temukan program yang paling sesuai dengan bisnis Anda.
                        </Text>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {PARTNERSHIP_TYPES.map((type) => (
                            <Card key={type.title} className="border-border/60 flex flex-col">
                                <CardContent className="p-6 flex-1 flex flex-col">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                                        <type.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <Heading as="h3" className="text-xl mb-3">{type.title}</Heading>
                                    <Text variant="muted" className="mb-6">{type.description}</Text>
                                    <ul className="space-y-3 mb-6 flex-1">
                                        {type.benefits.map((benefit) => (
                                            <li key={benefit} className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button className="w-full rounded-2xl" asChild>
                                        <Link href="/sales">
                                            Pelajari Lebih Lanjut
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section className="bg-muted/30">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Heading as="h2">Mengapa Partner dengan Kami?</Heading>
                        <Text variant="lead">
                            Beres.io adalah platform yang trusted oleh ratusan bisnis. Dengan bergabung sebagai partner, Anda mendapatkan:
                        </Text>
                        <ul className="space-y-3">
                            {[
                                "Akses ke pasar UMKM yang besar",
                                "Product yang sudah proven dan reliable",
                                "Tim support yang responsif",
                                "Komunitas partner yang aktif",
                                "Peluang co-marketing",
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <Handshake className="h-5 w-5 text-primary" />
                                    <Text className="text-sm">{item}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="aspect-square rounded-2xl bg-background flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Handshake className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Partnership Illustration</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Berkolaborasi?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Hubungi tim partnership kami untuk diskusi lebih lanjut tentang bagaimana kita bisa tumbuh bersama.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/sales">Hubungi Tim Partnership</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/about">Tentang Beres.io</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
