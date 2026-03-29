"use client";

import { useMemo, useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";
import { SectionClient } from "./SectionClient";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@repo/ui/accordion";
import { Button } from "@repo/ui/button";
import { Info, HelpCircle } from "lucide-react";

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
        return unique.length ? unique : ["Tentang Beres", "Fitur & Modul", "Harga & Paket", "Dukungan"];
    }, [categories, items]);

    const initialCategory =
        defaultCategory && derivedCategories.includes(defaultCategory)
            ? defaultCategory
            : derivedCategories[0];

    const [activeCategory, setActiveCategory] = useState(initialCategory);

    return (
        <SectionClient id="faq" className="bg-background">
            {/* Decorative elements */}
            <div className="absolute top-10 right-10 md:right-20 hidden md:block">
                <div className="relative">
                    <div className="absolute -left-10 top-4">
                        <HelpCircle className="w-6 h-6 text-muted-foreground/50 stroke-[1.5]" />
                    </div>
                    <div className="w-14 h-14 rounded-full border-2 border-border/40 flex items-center justify-center bg-background rotate-12 relative z-10">
                        <Info className="w-6 h-6 text-muted-foreground/50 stroke-[2]" />
                    </div>
                </div>
            </div>

            {/* Header - align start */}
            <div className="max-w-3xl mb-[clamp(2rem,5vw,4rem)] relative z-10">
                <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/15 rounded-full px-4 py-1.5 font-medium border-0 mb-4"
                >
                    {badgeLabel}
                </Badge>
                <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-black tracking-tight leading-[1.1] text-foreground mb-4">
                    {title}
                </h2>
                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl">
                    {description}
                </p>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12 relative z-10">
                {/* Categories Sidebar */}
                <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground mb-4 px-3">Kategori</h3>
                    <ul className="space-y-1">
                        {derivedCategories.map((category) => (
                            <li key={category}>
                                <button
                                    onClick={() => setActiveCategory(category)}
                                    className={cn(
                                        "w-full text-left py-2.5 px-3 rounded-lg text-sm transition-all relative",
                                        activeCategory === category
                                            ? "bg-primary/10 text-primary font-semibold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
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
                        className="w-full space-y-3"
                        defaultValue="item-0"
                    >
                        {items
                            .filter((faq) => faq.category === activeCategory)
                            .map((faq, index) => (
                                <AccordionItem
                                    key={index}
                                    value={`item-${index}`}
                                    className="bg-muted/30 border border-border/60 rounded-xl px-5 data-[state=open]:bg-background data-[state=open]:border-primary/30 data-[state=open]:shadow-sm"
                                >
                                    <AccordionTrigger className="text-base font-semibold hover:no-underline text-foreground py-5 [&[data-state=open]]:text-foreground [&>svg]:text-foreground [&>svg]:w-4 [&>svg]:h-4">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                    </Accordion>

                    {/* Contact Card */}
                    <div className="mt-8 bg-muted/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-border/60">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-foreground" />
                                <h3 className="text-base font-bold text-foreground">Masih punya pertanyaan?</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Jika belum menemukan jawaban, jangan ragu untuk menghubungi kami.
                            </p>
                        </div>
                        {contactCtaHref ? (
                            <Button
                                variant="outline"
                                className="rounded-full px-6 py-2 border-border/60 text-foreground bg-transparent hover:bg-muted/40 flex-shrink-0"
                                asChild
                            >
                                <Link href={contactCtaHref}>{contactCtaLabel}</Link>
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="rounded-full px-6 py-2 border-border/60 text-foreground bg-transparent hover:bg-muted/40 flex-shrink-0"
                            >
                                {contactCtaLabel}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </SectionClient>
    );
}


