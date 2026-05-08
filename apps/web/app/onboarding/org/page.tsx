import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, Users, ArrowRight } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Input, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata } from "@/lib/seo";
import { requireSessionWithOrganization } from "@/lib/authz";

export const metadata: Metadata = seoMetadata({
    title: "Onboarding - Siapkan Organisasi Anda",
    path: "/onboarding/org",
    description: "Onboarding Beres Cloud - Lengkapi data organisasi Anda untuk memulai menggunakan platform kasir digital.",
    noIndex: true, // Onboarding should not be indexed
});

const ONBOARDING_STEPS = [
    {
        title: "Identitas Bisnis",
        description: "Masukkan nama usaha dan kategori industri.",
        icon: Building2,
    },
    {
        title: "Detail Outlet",
        description: "Tambah lokasi outlet utama dan jam operasional.",
        icon: MapPin,
    },
    {
        title: "Undang Tim",
        description: "Tambahkan staf untuk akses kasir dan manajer.",
        icon: Users,
    },
];

export default async function OnboardingOrgPage() {
    // AuthZ guard: onboarding is only for authenticated users in an organization.
    await requireSessionWithOrganization();
    return (
        <>
            <PageHero
                badgeLabel="Onboarding"
                title="Siapkan Organisasi Anda"
                subtitle="Dalam Beberapa Langkah"
                description="Lengkapi informasi dasar agar tim Beres Cloud bisa menyiapkan konfigurasi terbaik untuk bisnis Anda."
                primaryCta={{ label: "Mulai Isi Data", href: "#form" }}
                secondaryCta={{ label: "Kembali ke Dashboard", href: "/dashboard" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Tahapan Onboarding</Heading>
                        <Text variant="lead" align="center">
                            Isi data secara bertahap agar setup berjalan cepat dan rapi.
                        </Text>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        {ONBOARDING_STEPS.map((step) => (
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

            <Section id="form">
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
                    <div className="space-y-4">
                        <Heading as="h2">Mulai Dengan Data Dasar</Heading>
                        <Text variant="lead">
                            Informasi ini akan membantu kami menyiapkan struktur organisasi dan outlet pertama Anda.
                        </Text>
                        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                            <span>- Anda bisa menambahkan outlet tambahan setelah onboarding selesai.</span>
                            <span>- Tim support akan membantu jika ada data yang perlu disesuaikan.</span>
                        </div>
                    </div>

                    <Card className="border-border/60">
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Text variant="detail">Nama Bisnis</Text>
                                <Input placeholder="Contoh: Beres Coffee" />
                            </div>
                            <div className="space-y-2">
                                <Text variant="detail">Kategori Industri</Text>
                                <Input placeholder="F&B, Retail, Laundry, dll." />
                            </div>
                            <div className="space-y-2">
                                <Text variant="detail">Lokasi Outlet Utama</Text>
                                <Input placeholder="Kota / area" />
                            </div>
                            <Button className="w-full rounded-2xl" type="button" asChild>
                                <Link href="/dashboard">
                                    Simpan & Lanjutkan
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Text variant="muted">
                                Data onboarding dipakai untuk konfigurasi awal tenant dan verifikasi kesiapan operasional.
                            </Text>
                        </CardContent>
                    </Card>
                </div>
            </Section>
        </>
    );
}
