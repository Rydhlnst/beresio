import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Shield, FileText, BarChart3, Users, Store, CheckCircle, Globe } from "lucide-react";
import { PageHero } from "../../_components/PageHero";
import { Section } from "../../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = {
    title: "Solusi Franchise - Standardisasi Multi-Gerai",
    description: "Kelola franchise dengan standardisasi operasional, approval workflow, royalty reporting, dan kontrol brand konsisten di semua gerai.",
};

const FEATURES = [
    {
        title: "Standardisasi Operasional",
        description: "Pastikan semua gerai menjalankan SOP yang sama: menu, harga, promo, dan layanan.",
        icon: CheckCircle,
    },
    {
        title: "Approval Workflow",
        description: "Franchisee mengajukan perubahan, franchisor approve/reject via dashboard.",
        icon: Shield,
    },
    {
        title: "Royalty Reporting",
        description: "Laporan penjualan otomatis untuk perhitungan royalty fee.",
        icon: FileText,
    },
    {
        title: "Dashboard Franchisor",
        description: "Pantau performa semua gerai franchise dalam satu dashboard terpusat.",
        icon: BarChart3,
    },
    {
        title: "Franchisee Portal",
        description: "Akses terpisah untuk franchisee dengan data hanya gerai mereka.",
        icon: Users,
    },
    {
        title: "Multi-Regional",
        description: "Dukung franchise di berbagai kota dengan konfigurasi lokal.",
        icon: Globe,
    },
];

const HIERARCHY = [
    { role: "Franchisor", access: "Semua gerai & laporan", icon: Building2 },
    { role: "Regional Manager", access: "Gerai di region tertentu", icon: Globe },
    { role: "Franchisee", access: "Hanya gerai sendiri", icon: Store },
    { role: "Staff Gerai", access: "Operasional harian", icon: Users },
];

export default function FranchisePage() {
    return (
        <>
            <PageHero
                badgeLabel="Enterprise Solution"
                title="Solusi Franchise"
                subtitle="Standardisasi & Kontrol"
                description="Standardisasi operasional di semua gerai franchise. Approval workflow, royalty reporting, dan kontrol brand konsisten."
                primaryCta={{ label: "Hubungi Sales", href: "/sales" }}
                secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
                align="center"
            />

            <Section>
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Fitur Khusus Franchise</Heading>
                        <Text variant="lead" align="center">
                            Kelola franchise dengan sistem yang mendukung pertumbuhan terkontrol.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {FEATURES.map((feature) => (
                            <Card key={feature.title} className="border-border/60">
                                <CardHeader className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                                        <feature.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-base">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Text variant="muted">{feature.description}</Text>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section className="bg-muted/30">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Hierarki Akses yang Jelas</Heading>
                        <Text variant="lead" align="center">
                            Setiap level memiliki akses sesuai perannya dalam ekosistem franchise.
                        </Text>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {HIERARCHY.map((item) => (
                            <div key={item.role} className="p-6 rounded-2xl bg-background border border-border/60">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                                    <item.icon className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">{item.role}</h3>
                                <Text variant="muted" className="text-sm">{item.access}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Heading as="h2">Standardisasi Tanpa Kehilangan Fleksibilitas</Heading>
                        <Text variant="lead">
                            Berikan guideline yang jelas sambil tetap memungkinkan adaptasi lokal yang diperlukan.
                        </Text>
                        <ul className="space-y-3">
                            {[
                                "Template menu & harga standar",
                                "Approval untuk promo lokal",
                                "Laporan royalty otomatis",
                                "Audit & compliance tracking",
                                "Training material integration"
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3">
                                    <Shield className="h-5 w-5 text-primary" />
                                    <Text className="text-sm">{item}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center border border-border/60">
                        <div className="text-center p-8">
                            <Building2 className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
                            <Text variant="muted">Franchise Dashboard Preview</Text>
                        </div>
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Siap Scale Franchise Anda?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Hubungi tim sales kami untuk demo khusus solusi franchise.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/sales">Hubungi Sales</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/fitur/multi-cabang">Lihat Fitur Multi-Cabang →</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
