"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Truck,
    GitBranch,
    BarChart3,
    Check,
    Zap,
    ChevronLeft,
    ChevronRight,
    ArrowRight
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui"
import { SectionClient } from "./SectionClient"

// --- FEATURES DATA ---

const FEATURES = [
    {
        title: "Kembangkan Bisnis, Bukan Kerumitan",
        description: "Beres memerdekakan owner dari rutinitas operasional yang menjemukan. POS, inventori, dan keuangan terhubung otomatis dalam satu dashboard terpadu.",
        items: [
            "Laporan seluruh cabang real-time",
            "Stok terpantau otomatis",
            "Akuntansi tercatat instan"
        ],
        icon: Zap,
        stats: "20+",
        statsLabel: "Jam Hemat Per Minggu"
    },
    {
        title: "Logistik Sebagai Mesin Laba",
        description: "Kelola kurir internal dan integrasi Gojek/Grab dalam satu pintu. Optimalkan rute dan biaya kirim untuk margin yang lebih sehat.",
        items: [
            "Otomasi pemilihan vendor termurah",
            "Live tracking semua pengiriman",
            "Efisiensi biaya logistik 40-60%"
        ],
        icon: Truck,
        stats: "40-60%",
        statsLabel: "Efisiensi Biaya Kirim"
    },
    {
        title: "Skalabilitas Tanpa Batas",
        description: "Sistem yang dirancang untuk tumbuh bersama Anda. Tambah cabang baru dalam hitungan menit dengan replikasi SOP yang sudah matang.",
        items: [
            "Multi-cabang tanpa biaya tambahan",
            "Sentralisasi kontrol stok & harga",
            "Replikasi sistem operasional"
        ],
        icon: GitBranch,
        stats: "1 ke 10",
        statsLabel: "Cabang Tanpa Chaos"
    },
    {
        title: "Keputusan Berbasis Data Nyata",
        description: "Berhenti menebak-nebak. Dapatkan insight mendalam tentang performa menu, efektivitas promosi, hingga profitabilitas per cabang.",
        items: [
            "Analitik performa produk",
            "Insight perilaku pelanggan",
            "Laporan laba-rugi otomatis"
        ],
        icon: BarChart3,
        stats: "100%",
        statsLabel: "Akurasi Data Bisnis"
    }
]

// --- CAROUSEL COMPONENT ---

function ValueCarousel() {
    const [activeIndex, setActiveIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    const next = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % FEATURES.length)
    }, [])

    const prev = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + FEATURES.length) % FEATURES.length)
    }, [])

    useEffect(() => {
        if (isPaused) return
        const interval = setInterval(next, 6000)
        return () => clearInterval(interval)
    }, [next, isPaused])

    const activeFeature = FEATURES[activeIndex]!
    const Icon = activeFeature.icon

    if (!activeFeature) return null

    return (
        <div
            className="relative w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
                {/* Visual Side */}
                <div className="flex-1 w-full relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            initial={{ opacity: 0, scale: 0.98, x: 10 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.98, x: -10 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full min-h-[clamp(280px,38vw,480px)] bg-muted/20 rounded-3xl border border-border/40 flex flex-col items-center justify-center p-8 md:p-12"
                        >
                            <div className="h-16 w-16 rounded-2xl bg-background border border-border/40 flex items-center justify-center mb-8 shadow-sm">
                                <Icon className="h-8 w-8 text-primary" />
                            </div>

                            <div className="flex flex-col items-center mb-8">
                                <span className="text-[clamp(2.5rem,6vw,3.5rem)] font-bold tracking-tighter text-foreground leading-none">
                                    {activeFeature.stats}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-3">
                                    {activeFeature.statsLabel}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                                {activeFeature.items.slice(0, 2).map((item, i) => (
                                    <div key={i} className="bg-background/40 backdrop-blur-sm border border-border/30 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Check className="h-3 w-3 text-primary" />
                                        </div>
                                        <p className="text-[10px] font-semibold text-foreground leading-tight">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Content Side - align start */}
                <div className="flex-1 w-full flex flex-col justify-center items-start">
                    {/* Progress Indicators */}
                    <div className="flex gap-2 mb-8">
                        {FEATURES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveIndex(i)}
                                aria-label={`Select feature ${i + 1}: ${FEATURES[i].title}`}
                                aria-current={i === activeIndex}
                                className={cn(
                                    "h-1.5 transition-all duration-500 rounded-full",
                                    i === activeIndex ? "w-10 bg-primary" : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                                )}
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeIndex}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-6 text-left"
                        >
                            <h3 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-black tracking-tight leading-[1.15] text-foreground">
                                {activeFeature.title}
                            </h3>
                            <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                                {activeFeature.description}
                            </p>

                            <div className="pt-2 grid grid-cols-1 gap-4">
                                {activeFeature.items.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                                        <span className="text-sm font-medium text-foreground/80 leading-snug">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="pt-10 flex gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={prev}
                            aria-label="Previous feature"
                            className="rounded-xl h-12 w-12 border-border/40 hover:bg-muted/50 hover:text-primary transition-all active:scale-95"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={next}
                            aria-label="Next feature"
                            className="rounded-xl h-12 w-12 border-border/40 hover:bg-muted/50 hover:text-primary transition-all active:scale-95"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- COMPARISON TABLE ---

function ComparisonSection() {
    const data = [
        { label: "Rekap Laporan", before: "Manual spreadsheet (5+ jam/mgg)", after: "Otomatis & Real-time (0 jam)" },
        { label: "Logistik Delivery", before: "WhatsApp & Koordinasi Manual", after: "Dashboard Terintegrasi" },
        { label: "Ekspansi Cabang", before: "Chaos & SOP Berantakan", after: "Replikasi Sistem Instan" },
        { label: "Kontrol Stok", before: "Sering Selisih & Habis", after: "Notifikasi & Sinkron Otomatis" },
        { label: "Keputusan Bisnis", before: "Feeling & Tebakan", after: "Data-driven Insight" },
    ]

    return (
        <div className="mt-[clamp(4rem,8vw,8rem)]">
            {/* Header - align start */}
            <div className="max-w-2xl mb-10">
                <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary mb-4">
                    Efektivitas Operasional
                </span>
                <h4 className="text-[clamp(1.5rem,3vw,2.25rem)] font-black tracking-tight leading-tight text-foreground">
                    Transformasi Bisnis Kamu Bersama Platform Beres.
                </h4>
            </div>

            {/* Table */}
            <div className="bg-muted/10 border border-border/40 rounded-3xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border/30 bg-muted/20">
                                <th className="py-5 px-[clamp(1rem,3vw,2rem)] text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                    Item Pekerjaan
                                </th>
                                <th className="py-5 px-[clamp(1rem,3vw,2rem)] text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 italic">
                                    Tanpa Beres
                                </th>
                                <th className="py-5 px-[clamp(1rem,3vw,2rem)] text-left text-[10px] font-bold uppercase tracking-widest text-primary">
                                    Bersama Beres
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-muted/20 transition-colors group">
                                    <td className="py-5 px-[clamp(1rem,3vw,2rem)] text-sm font-semibold text-foreground/80">
                                        {row.label}
                                    </td>
                                    <td className="py-5 px-[clamp(1rem,3vw,2rem)] text-sm text-muted-foreground/50 line-through decoration-muted-foreground/30">
                                        {row.before}
                                    </td>
                                    <td className="py-5 px-[clamp(1rem,3vw,2rem)] text-sm font-bold text-foreground">
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                <Check className="h-3 w-3 text-primary" />
                                            </div>
                                            {row.after}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// --- CTA SECTION ---

function ValueCTA() {
    return (
        <div className="mt-[clamp(4rem,8vw,8rem)] flex flex-col items-start">
            <div className="max-w-2xl">
                <h3 className="text-[clamp(1.5rem,3vw,2.25rem)] font-black tracking-tight leading-tight text-foreground mb-4">
                    Saatnya Berhenti Sibuk Mengurus, Mulai Bebas Memimpin.
                </h3>
                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed mb-8">
                    Otomatisasi operasional Anda hari ini dan amankan keunggulan kompetitif. 
                    Bergabunglah dengan ratusan pengusaha modern yang memilih cara pintar.
                </p>
            </div>
            <div className="flex flex-wrap gap-4">
                <Button
                    size="lg"
                    className="rounded-full px-8 h-12 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    asChild
                >
                    <a href="/wishlist">
                        Dapatkan Akses Awal
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                </Button>
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8 h-12 font-semibold text-base border-border/60 hover:bg-muted/50 transition-all"
                    asChild
                >
                    <a href="#features">Pelajari Fitur</a>
                </Button>
            </div>
        </div>
    )
}

// --- MAIN COMPONENT ---

export function ValueProposition() {
    return (
        <SectionClient id="value-proposition">
            {/* Header - align start */}
            <div className="max-w-3xl mb-[clamp(2.5rem,6vw,4rem)]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary mb-4">
                        Beyond Just An App
                    </span>
                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-black tracking-tight leading-[1.1] text-foreground mb-6">
                        Beres Bukan Sekadar Aplikasi — <br />
                        <span className="text-primary">Ini Adalah Cara Bisnis Kamu Tumbuh.</span>
                    </h2>
                    <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl">
                        Banyak UMKM berhenti tumbuh bukan karena produknya buruk, tapi karena ownernya tenggelam dalam operasional manual. Kami hadir untuk mengubah itu.
                    </p>
                </motion.div>
            </div>

            {/* Carousel Area */}
            <ValueCarousel />

            {/* Comparison Table */}
            <ComparisonSection />

            {/* CTA */}
            <ValueCTA />
        </SectionClient>
    )
}
