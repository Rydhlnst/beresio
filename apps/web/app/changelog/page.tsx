import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Calendar, Tag, ArrowRight, Sparkles, Bug, Zap } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Badge } from "@repo/ui/badge";

export const metadata: Metadata = {
    title: "Changelog - Update & Perubahan Beres.io",
    description: "Lihat update terbaru, fitur baru, perbaikan bug, dan improvement yang kami rilis untuk Beres.io.",
};

const RELEASES = [
    {
        version: "v2.4.0",
        date: "Maret 2025",
        type: "feature",
        title: "Multi-Cabang 2.0",
        description: "Major update untuk fitur multi-cabang dengan transfer stok antar cabang, laporan konsolidasi, dan hierarki akses yang lebih fleksibel.",
        highlights: ["Transfer stok antar cabang", "Laporan konsolidasi", "Regional manager role", "Cross-branch analytics"],
    },
    {
        version: "v2.3.2",
        date: "Februari 2025",
        type: "fix",
        title: "Bug Fixes & Performance",
        description: "Perbaikan bug dan peningkatan performa untuk pengalaman pengguna yang lebih baik.",
        highlights: ["Fix: Sync delay pada stok", "Improve: Loading time dashboard", "Fix: Export PDF timeout", "Improve: Mobile responsiveness"],
    },
    {
        version: "v2.3.0",
        date: "Januari 2025",
        type: "feature",
        title: "Delivery Integration",
        description: "Integrasi dengan layanan pengiriman Gojek dan Grab. Tracking real-time dan notifikasi otomatis untuk pelanggan.",
        highlights: ["Gojek/Grab integration", "Real-time tracking", "Auto notification", "Delivery fee calculation"],
    },
    {
        version: "v2.2.0",
        date: "Desember 2024",
        type: "feature",
        title: "Advanced Reporting",
        description: "Dashboard analitik yang lebih powerful dengan custom report builder dan export multi-format.",
        highlights: ["Custom report builder", "Export to Excel/CSV", "Scheduled reports", "P&L visualization"],
    },
    {
        version: "v2.1.0",
        date: "November 2024",
        type: "feature",
        title: "API v1 Release",
        description: "Public API untuk integrasi dengan aplikasi pihak ketiga. Dokumentasi lengkap dan sandbox environment.",
        highlights: ["Public API access", "Webhook support", "API documentation", "Rate limiting"],
    },
    {
        version: "v2.0.0",
        date: "Oktober 2024",
        type: "feature",
        title: "Beres.io 2.0 Launch",
        description: "Platform baru dengan arsitektur yang lebih scalable, UI yang lebih modern, dan fitur yang lebih lengkap.",
        highlights: ["New UI/UX", "Improved performance", "Mobile app beta", "New pricing plans"],
    },
];

const TYPE_ICONS = {
    feature: Sparkles,
    fix: Bug,
    improvement: Zap,
};

const TYPE_LABELS = {
    feature: "Feature",
    fix: "Bug Fix",
    improvement: "Improvement",
};

const TYPE_COLORS = {
    feature: "bg-green-500/10 text-green-600",
    fix: "bg-red-500/10 text-red-600",
    improvement: "bg-blue-500/10 text-blue-600",
};

export default function ChangelogPage() {
    return (
        <>
            <PageHero
                badgeLabel="Product Updates"
                title="Changelog"
                subtitle="Update Terbaru"
                description="Lihat fitur baru, perbaikan, dan improvement yang kami rilis. Beres.io terus berkembang untuk melayani Anda lebih baik."
                primaryCta={{ label: "Lihat Roadmap", href: "#" }}
                secondaryCta={{ label: "Hubungi Support", href: "/support" }}
                align="center"
            />

            <Section>
                <div className="max-w-3xl mx-auto space-y-12">
                    {RELEASES.map((release) => {
                        const Icon = TYPE_ICONS[release.type as keyof typeof TYPE_ICONS];
                        return (
                            <div key={release.version} className="relative pl-8 border-l border-border/60">
                                <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-background border-2 border-primary" />
                                
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge variant="secondary" className="rounded-full">
                                            {release.version}
                                        </Badge>
                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {release.date}
                                        </span>
                                        <Badge className={`rounded-full ${TYPE_COLORS[release.type as keyof typeof TYPE_COLORS]}`}>
                                            <Icon className="h-3 w-3 mr-1" />
                                            {TYPE_LABELS[release.type as keyof typeof TYPE_LABELS]}
                                        </Badge>
                                    </div>
                                    
                                    <div>
                                        <Heading as="h3" className="text-xl mb-2">{release.title}</Heading>
                                        <Text variant="muted">{release.description}</Text>
                                    </div>
                                    
                                    <ul className="space-y-2">
                                        {release.highlights.map((highlight) => (
                                            <li key={highlight} className="flex items-center gap-2 text-sm">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                {highlight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Punya Feedback?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Kami selalu terbuka untuk saran dan masukan untuk pengembangan Beres.io.
                    </Text>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Button size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/support">Kirim Feedback</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8" asChild>
                            <Link href="/docs">Lihat Dokumentasi</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
