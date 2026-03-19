import Link from "next/link";
import { PhoneCall, CalendarCheck, Building2, ArrowRight } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Input, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

const SALES_OPTIONS = [
    {
        title: "Konsultasi Kebutuhan",
        description: "Diskusikan proses bisnis dan kebutuhan integrasi.",
        icon: PhoneCall,
    },
    {
        title: "Penawaran Paket",
        description: "Kami bantu memilih paket paling pas untuk skala Anda.",
        icon: Building2,
    },
    {
        title: "Jadwal Implementasi",
        description: "Rencana go-live yang realistis dan terukur.",
        icon: CalendarCheck,
    },
];

export default function SalesPage() {
    return (
        <>
            <PageHero
                badgeLabel="Hubungi Sales"
                title="Diskusi Langsung"
                subtitle="Dengan Tim Beres.io"
                description="Ceritakan kebutuhan bisnis Anda dan kami siapkan solusi terbaik, dari demo hingga implementasi."
                primaryCta={{ label: "Kirim Detail", href: "#contact" }}
                secondaryCta={{ label: "Lihat Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Yang Bisa Kami Bantu</Heading>
                        <Text variant="lead" align="center">
                            Fokus pada workflow bisnis yang paling berdampak.
                        </Text>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {SALES_OPTIONS.map((option) => (
                            <Card key={option.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                        <option.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{option.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text variant="muted">{option.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section id="contact">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
                    <div className="space-y-4">
                        <Heading as="h2">Bagikan Detail Bisnis</Heading>
                        <Text variant="lead">
                            Kami akan menghubungi Anda dalam 1-2 hari kerja untuk menyiapkan sesi konsultasi.
                        </Text>
                        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                            <span>â€¢ Cocok untuk bisnis single outlet hingga multi-cabang.</span>
                            <span>â€¢ Tim kami siap bantu migrasi data jika dibutuhkan.</span>
                        </div>
                    </div>

                    <Card className="border-border/60">
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Text variant="detail">Nama Anda</Text>
                                <Input placeholder="Nama lengkap" />
                            </div>
                            <div className="space-y-2">
                                <Text variant="detail">Email / WhatsApp</Text>
                                <Input placeholder="Alamat email atau nomor WhatsApp" />
                            </div>
                            <div className="space-y-2">
                                <Text variant="detail">Nama Bisnis</Text>
                                <Input placeholder="Nama usaha / outlet" />
                            </div>
                            <Button className="w-full rounded-2xl" type="button" asChild>
                                <Link href="/wishlist">
                                    Kirim Permintaan
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Text variant="muted">
                                Form ini masih placeholder. Permintaan Anda akan diarahkan ke tim sales.
                            </Text>
                        </CardContent>
                    </Card>
                </div>
            </Section>
        </>
    );
}
