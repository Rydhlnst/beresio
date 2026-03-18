"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { Section } from "./Section";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@repo/ui/accordion";
import { Button } from "@repo/ui/button";
import { Info, HelpCircle, FileText } from "lucide-react";

export type FAQItem = {
    category: string;
    question: string;
    answer: string;
};

export type FAQProps = {
    title?: string;
    description?: string;
    badgeLabel?: string;
    categories?: string[];
    faqs?: FAQItem[];
    defaultCategory?: string;
    contactCtaLabel?: string;
    contactCtaHref?: string;
};

const DEFAULT_CATEGORIES = [
    "Tentang Beres",
    "Fitur & Modul",
    "Harga & Paket",
    "Setup & Onboarding",
    "Pengiriman & Fulfillment",
    "Integrasi",
    "Keamanan & Data",
    "Dukungan",
];

const DEFAULT_FAQS: FAQItem[] = [
    {
        category: "Tentang Beres",
        question: "Apa itu Beres?",
        answer:
            "Beres adalah platform ERP berbasis cloud untuk UMKM Indonesia dengan banyak cabang. Menggabungkan POS, inventori, akuntansi, dan manajemen pengiriman dalam satu sistem - lebih lengkap dari POS biasa, lebih terjangkau dari ERP enterprise.",
    },
    {
        category: "Tentang Beres",
        question: "Siapa target pengguna Beres?",
        answer:
            "Beres cocok untuk bisnis F&B (restoran, kafe, cloud kitchen), retail, laundry, dan salon yang memiliki 2-10 cabang dan ingin mengelola operasional secara terpusat.",
    },
    {
        category: "Harga & Paket",
        question: "Berapa harga Beres?",
        answer:
            "Harga resmi akan diumumkan saat peluncuran. Namun, kami berkomitmen untuk memberikan solusi ERP yang jauh lebih terjangkau dibanding kompetitor. Gabung wishlist sekarang untuk mendapatkan penawaran eksklusif Early Bird!",
    },
    {
        category: "Harga & Paket",
        question: "Apakah ada free trial?",
        answer:
            "Tentu! Saat peluncuran nanti, Anda akan mendapatkan 14 hari akses gratis untuk mencoba seluruh fitur Professional tanpa perlu memasukkan informasi kartu kredit.",
    },
    {
        category: "Harga & Paket",
        question: "Mengapa menggunakan model harga per organisasi?",
        answer:
            "Kami ingin mendukung pertumbuhan UMKM tanpa beban biaya tambahan per cabang. Dengan model ini, Anda bebas berekspansi tanpa khawatir biaya langganan membengkak seiring bertambahnya lokasi bisnis Anda.",
    },
    {
        category: "Pengiriman & Fulfillment",
        question: "Apa keunggulan sistem pengiriman Beres?",
        answer:
            "Beres menggabungkan driver internal dan layanan pihak ketiga (Gojek/Grab) dalam satu dashboard. Kamu bisa tracking real-time, membandingkan biaya, dan menganalisis performa driver - sesuatu yang tidak ada di Moka, Pawoon, maupun Qasir.",
    },
    {
        category: "Fitur & Modul",
        question: "Modul apa saja yang tersedia?",
        answer:
            "POS multi-cabang, manajemen inventori, akuntansi double-entry, CRM, manajemen pengiriman, dan laporan analitik. Semua terintegrasi tanpa perlu aplikasi tambahan.",
    },
    {
        category: "Keamanan & Data",
        question: "Apakah data bisnis saya aman?",
        answer:
            "Ya. Beres menggunakan arsitektur multi-tenant dengan isolasi data per organisasi, enkripsi, audit log, dan autentikasi 2FA. SLA uptime 99.9% untuk paket Enterprise.",
    },
    {
        category: "Dukungan",
        question: "Bagaimana cara mendapatkan bantuan?",
        answer:
            "Starter: email support. Professional: WhatsApp prioritas. Enterprise: 24/7 dedicated support + account manager + sesi onboarding personal.",
    },
];

export function FAQ({
    title = "Pertanyaan Populer",
    description = "Temukan jawaban untuk pertanyaan umum tentang Beres dan bagaimana kami dapat membantu bisnis Anda.",
    badgeLabel = "Solusi ERP Terintegrasi",
    categories,
    faqs,
    defaultCategory,
    contactCtaLabel = "Hubungi kami",
    contactCtaHref,
}: FAQProps) {
    const items = faqs ?? DEFAULT_FAQS;
    const derivedCategories = useMemo(() => {
        if (categories && categories.length > 0) return categories;
        const unique = Array.from(new Set(items.map((faq) => faq.category)));
        return unique.length ? unique : DEFAULT_CATEGORIES;
    }, [categories, items]);

    const initialCategory =
        defaultCategory && derivedCategories.includes(defaultCategory)
            ? defaultCategory
            : derivedCategories[0];

    const [activeCategory, setActiveCategory] = useState(initialCategory);

    return (
        <Section id="faq" className="bg-background">
            {/* Decorative top right SVGs */}
            <div className="absolute top-10 right-10 md:right-32 hidden md:block">
                <div className="relative">
                    <div className="absolute -left-12 top-4">
                        <HelpCircle className="w-8 h-8 text-muted-foreground stroke-[1.5]" />
                    </div>
                    <div className="w-16 h-16 rounded-full border-2 border-border/60 flex items-center justify-center bg-background rotate-12 relative z-10">
                        <Info className="w-8 h-8 text-muted-foreground stroke-[2]" />
                    </div>
                </div>
            </div>

            {/* Decorative center left SVGs */}
            <div className="absolute top-24 left-10 md:left-40 hidden md:block">
                <div className="relative">
                    <div className="w-12 h-10 border-2 border-border/60 rounded-xl bg-background -rotate-12 flex items-center justify-center relative z-10">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground hidden" />
                    </div>
                    <div className="absolute top-6 left-8 w-14 h-10 border-2 border-border/60 rounded-xl bg-background rotate-6 flex items-center justify-center z-20">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16 relative z-10">
                <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/15 rounded-full px-4 py-1.5 font-medium border-0"
                >
                    {badgeLabel}
                </Badge>
                <h2 className="text-[clamp(1.75rem,5vw,3.25rem)] font-bold tracking-tight text-foreground mt-6">
                    {title}
                </h2>
                <p className="text-muted-foreground max-w-2xl text-lg mt-4">
                    {description}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[min(260px,22%)_1fr] gap-8 lg:gap-16 relative z-10">
                {/* Categories Sidebar */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary mb-6">Kategori</h3>
                    <ul className="space-y-2">
                        {derivedCategories.map((category) => (
                            <li key={category}>
                                <button
                                    onClick={() => setActiveCategory(category)}
                                    className={`w-full text-left py-2 px-4 transition-colors relative ${
                                        activeCategory === category
                                            ? "text-foreground font-medium"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {/* Active Indicator Line */}
                                    {activeCategory === category && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-sm" />
                                    )}
                                    {category}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Accordions */}
                <div className="space-y-4 w-full">
                    <Accordion
                        key={activeCategory}
                        type="single"
                        collapsible
                        className="w-full space-y-4"
                        defaultValue="item-0"
                    >
                        {items
                            .filter((faq) => faq.category === activeCategory)
                            .map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="bg-muted/30 border border-border/60 rounded-lg px-6 data-[state=open]:bg-background data-[state=open]:border data-[state=open]:border-primary/40 data-[state=open]:shadow-sm"
                                >
                                    <AccordionTrigger className="text-lg font-semibold hover:no-underline text-foreground py-6 [&[data-state=open]]:text-foreground [&>svg]:text-foreground [&>svg]:w-5 [&>svg]:h-5 aria-expanded:no-underline">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                    </Accordion>

                    {/* Contact Card */}
                    <div className="mt-8 bg-muted/40 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-border/60">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-foreground" />
                                <h3 className="text-lg font-bold text-foreground">Masih punya pertanyaan?</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Jika belum menemukan jawaban, jangan ragu untuk menghubungi kami.
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="hidden md:block">
                                <div className="relative">
                                    <FileText className="w-8 h-8 text-muted-foreground -rotate-12 absolute -left-8 -top-2" />
                                </div>
                            </div>
                            {contactCtaHref ? (
                                <Button
                                    variant="outline"
                                    className="rounded-full px-6 py-2 border-border/60 text-foreground bg-transparent hover:bg-muted/40"
                                    asChild
                                >
                                    <Link href={contactCtaHref}>{contactCtaLabel}</Link>
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="rounded-full px-6 py-2 border-border/60 text-foreground bg-transparent hover:bg-muted/40"
                                >
                                    {contactCtaLabel}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    );
}
