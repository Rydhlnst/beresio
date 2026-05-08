"use client";

import { useEffect, useMemo, useState } from "react";
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
import { cn } from "@repo/ui/lib/utils";
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
    contentClassName?: string;
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
    contentClassName,
}: FAQProps) {
    const items = faqs ?? DEFAULT_FAQS;
    const derivedCategories = useMemo(() => {
        if (categories && categories.length > 0) return categories;
        const unique = Array.from(new Set(items.map((faq) => faq.category)));
        return unique.length ? unique : DEFAULT_CATEGORIES;
    }, [categories, items]);

    const fallbackCategory = derivedCategories[0] ?? "";
    const initialCategory =
        defaultCategory && derivedCategories.includes(defaultCategory)
            ? defaultCategory
            : fallbackCategory;

    const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
    const hasSingleCategory = derivedCategories.length <= 1;
    const activeFaqs = useMemo(
        () => items.filter((faq) => faq.category === activeCategory),
        [activeCategory, items]
    );

    useEffect(() => {
        if (!derivedCategories.includes(activeCategory)) {
            setActiveCategory(initialCategory);
        }
    }, [activeCategory, derivedCategories, initialCategory]);

    return (
        <SectionClient
            id="faq"
            className={hasSingleCategory ? "bg-muted/20" : "bg-background"}
            contentClassName={contentClassName}
        >
            <div className="relative z-10 mx-auto mb-14 flex max-w-4xl flex-col items-center justify-center text-center sm:mb-16">
                {hasSingleCategory && (
                    <>
                        <div className="pointer-events-none absolute -left-2 top-[calc(100%-2rem)] hidden sm:block">
                            <div className="h-12 w-12 -rotate-12 rounded-2xl border border-border/60 bg-background/70" />
                            <div className="-mt-5 ml-8 flex h-10 w-14 rotate-6 items-center justify-center rounded-2xl border border-border/60 bg-background/80">
                                <div className="flex gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                </div>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute right-0 top-[calc(100%-2.8rem)] hidden items-center gap-3 sm:flex">
                            <HelpCircle className="h-8 w-8 text-muted-foreground stroke-[1.5]" />
                            <div className="flex h-16 w-16 rotate-12 items-center justify-center rounded-full border border-border/60 bg-background/85">
                                <Info className="h-7 w-7 text-muted-foreground stroke-[2]" />
                            </div>
                        </div>
                    </>
                )}

                <Badge
                    variant="secondary"
                    className="rounded-full border-0 bg-brand/10 px-4 py-1.5 font-normal text-brand hover:bg-brand/15"
                >
                    {badgeLabel}
                </Badge>
                <h2 className="mt-5 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5.2vw,4rem)] font-normal tracking-tight text-foreground">
                    {title}
                </h2>
                <p className="mt-4 max-w-3xl text-base text-muted-foreground sm:text-lg">
                    {description}
                </p>
            </div>

            <div
                className={cn(
                    "relative z-10",
                    hasSingleCategory
                        ? "mx-auto max-w-4xl"
                        : "grid grid-cols-1 gap-8 lg:grid-cols-[min(260px,22%)_1fr] lg:gap-14"
                )}
            >
                {!hasSingleCategory && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            Kategori
                        </h3>
                        <ul className="space-y-2">
                            {derivedCategories.map((category) => (
                                <li key={category}>
                                    <button
                                        onClick={() => setActiveCategory(category)}
                                        className={cn(
                                            "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                                            activeCategory === category
                                                ? "border-primary/35 bg-background font-normal text-foreground shadow-sm"
                                                : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground"
                                        )}
                                    >
                                        {category}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="w-full space-y-4">
                    <Accordion
                        key={activeCategory}
                        type="single"
                        collapsible
                        className="w-full space-y-3.5"
                        defaultValue={activeFaqs.length ? "item-0" : undefined}
                    >
                        {activeFaqs.map((faq, index) => (
                            <AccordionItem
                                key={`${faq.question}-${index}`}
                                value={`item-${index}`}
                                className="rounded-2xl border border-border/70 bg-background px-6 transition-all data-[state=open]:border-primary/35 data-[state=open]:shadow-[0_10px_28px_-20px_hsl(var(--foreground)/0.45)]"
                            >
                                <AccordionTrigger className="py-5 text-left text-base font-medium text-foreground hover:no-underline [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-muted-foreground sm:text-lg">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <div className="mt-7 rounded-2xl border border-border/70 bg-background/80 p-6 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1.5">
                                <h3 className="flex items-center gap-2 text-base font-medium text-foreground sm:text-lg">
                                    <Info className="h-4 w-4 text-primary" />
                                    Masih punya pertanyaan?
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Jika belum menemukan jawaban, tim Beres siap bantu kapan pun Anda butuh.
                                </p>
                            </div>
                            {contactCtaHref ? (
                                <Button
                                    variant="outline"
                                    className="rounded-full border-border/70 bg-transparent px-6 py-2 text-foreground hover:bg-muted/50"
                                    asChild
                                >
                                    <Link href={contactCtaHref}>{contactCtaLabel}</Link>
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    className="rounded-full border-border/70 bg-transparent px-6 py-2 text-foreground hover:bg-muted/50"
                                >
                                    {contactCtaLabel}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SectionClient>
    );
}
