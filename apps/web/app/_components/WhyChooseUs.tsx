"use client"

import React from "react"
import { motion } from "framer-motion"
import {
    TrendingUp,
    CreditCard,
    Package,
    Users,
    FileText,
    Check,
    ArrowRight,
    Plus
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Button, Heading, Text } from "@repo/ui"
import { Section } from "./Section"
import { SectionCTA } from "./SectionCTA"

// --- ICONS & ASSETS ---

function BeresLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 58 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12C0 5.37258 5.37258 0 12 0H26V38H0V12Z" fill="#EE4822" />
            <path d="M0 42H26V80H12C5.37258 80 0 74.6274 0 68V42Z" fill="#EE4822" />
            <path d="M26 42H42C50.8366 42 58 49.1634 58 58V64C58 72.8366 50.8366 80 42 80H26V42Z" fill="#EE4822" />
            <path d="M26 0H42C50.8366 0 58 7.16344 58 16V22C58 30.8366 50.8366 38 42 38H26V0Z" fill="#EE4822" />
        </svg>
    )
}

function SlackIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.52c-1.392 0-2.52-1.128-2.522-2.52a2.52 2.52 0 0 1 2.522-2.52h2.52v2.52zm1.264 0a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.52 2.52v6.315a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.52-2.52v-6.315zM8.835 5.042a2.528 2.528 0 0 1-2.52-2.52c0-1.392 1.128-2.52 2.52-2.522a2.52 2.52 0 0 1 2.52 2.522v2.52h-2.52zm0 1.264a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.52h-6.315a2.528 2.528 0 0 1-2.52-2.52 2.528 2.528 0 0 1 2.52-2.52h6.315zM18.958 8.835a2.528 2.528 0 0 1 2.52-2.52c1.392 0 2.52 1.128 2.522 2.52a2.52 2.52 0 0 1-2.522 2.52h-2.52v-2.52zm-1.264 0a2.528 2.528 0 0 1-2.52 2.52 2.528 2.528 0 0 1-2.52-2.52v-6.315a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.52 2.52v6.315zM15.165 18.958a2.528 2.528 0 0 1 2.52 2.52c0 1.392-1.128 2.52-2.52 2.522a2.52 2.52 0 0 1-2.52-2.522v-2.52h2.52zm0-1.264a2.528 2.528 0 0 1-2.52-2.52 2.528 2.528 0 0 1 2.52-2.52h6.315a2.528 2.528 0 0 1 2.52 2.52 2.528 2.528 0 0 1-2.52 2.52h-6.315z" fill="currentColor" />
        </svg>
    )
}

function NotionIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M4.195 2.155C3.385 2.22 2.525 2.65 2.13 3.425C1.94 3.79 1.94 4.395 1.925 8.16C1.91 11.51 1.91 12.43 1.925 12.63C1.94 13.06 1.94 14.285 2.115 14.65C2.465 15.395 3.32 15.845 4.195 15.91L5.975 16.035C5.92 16.335 5.8 17.065 5.76 17.515C5.69 18.23 5.4 20.375 5.31 20.945C5.19 21.625 5.48 22.185 6.075 22.42C6.395 22.545 7.155 22.545 7.505 22.42C7.99 22.25 10.155 19.33 11.96 16.27C15.91 16.27 19.16 16.27 20.5 16.14C21.43 16.055 22.375 15.545 22.75 14.65C22.925 14.23 22.925 13.29 22.94 9.1C22.955 5.165 22.955 3.96 22.8 3.585C22.5 2.875 21.84 2.375 21 2.185C20.485 2.065 18.995 2.025 12.55 2.025C6.11 2.025 4.61 2.065 4.195 2.155ZM20.895 4.41C20.91 4.545 20.91 5.375 20.91 10.955V14.27H19.78C18.42 14.27 18.265 14.25 17.915 14.01C17.72 13.88 16.28 12.385 14.715 10.71V4.41H20.895ZM13.01 10.87H11.565L12.565 15.175H13.63L14.715 10.87H13.65V10.87ZM10.51 10.955V15.175H9.68C8.955 15.175 8.8 15.15 8.45 14.93C8.255 14.81 6.815 13.315 5.25 11.64V4.41H6.075L10.51 10.955ZM12.005 4.41V8.655L10.92 7.025V4.41H12.005Z" fill="black" />
        </svg>
    )
}

// --- MINI MOCKUP COMPONENTS ---

function EnterpriseSearchMockup() {
    return (
        <div className="w-full h-full bg-[#F06A50] flex flex-col items-center justify-start pt-12">
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-[90%] bg-white rounded-t-2xl shadow-2xl p-6 pb-20 relative overflow-hidden flex flex-col gap-6"
            >
                {/* Search Badge */}
                <div className="absolute top-4 right-4 bg-muted/30 text-[9px] font-bold px-3 py-1 rounded-full text-foreground/60 backdrop-blur-sm">
                    top customer requests this quarter
                </div>

                {/* Sub Header */}
                <div className="flex items-center gap-3 text-muted-foreground/40 mt-6 text-left">
                    <div className="h-4 w-4 rounded-sm bg-primary/10 flex items-center justify-center p-0.5 shadow-sm">
                        <TrendingUp className="h-full w-full text-primary" strokeWidth={3} />
                    </div>
                    <span className="text-[11px] font-bold text-foreground/40">24 Insight Ditemukan</span>
                    <div className="flex gap-1 items-center">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/20" />
                        <div className="h-4 w-4 rounded-full bg-blue-500/20" />
                        <div className="h-4 w-4 rounded-full bg-amber-500/20" />
                    </div>
                    <ArrowRight className="h-3 w-3 text-primary/40" />
                </div>

                <div className="space-y-6 text-left">
                    <div className="space-y-2">
                        <p className="text-[11px] text-foreground leading-relaxed">
                            Berdasarkan analisis GTM terbaru, berikut adalah <span className="font-bold">insight utama performa bisnis Anda</span> kuartal ini:
                        </p>
                        <div className="h-px bg-border/40 w-full" />
                    </div>

                    <div className="space-y-4">
                        <div className="bg-muted/5 rounded-xl p-4 border border-border/20 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <p className="text-[10px] font-black uppercase tracking-tight text-foreground">Tren Penjualan Teratas</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-foreground/70">1. Kopi Susu Gula Aren</p>
                                    <p className="text-[10px] font-black text-emerald-600">+18%</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-foreground/70">2. Pastry Box (Bundle)</p>
                                    <p className="text-[10px] font-black text-emerald-600">+12%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted/5 rounded-xl p-4 border border-border/20 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500" />
                                <p className="text-[10px] font-black uppercase tracking-tight text-foreground">Peringatan Stok</p>
                            </div>
                            <p className="text-[10px] text-foreground/60 leading-relaxed italic">
                                "Stok biji kopi Robusta di <span className="font-bold text-foreground">Gudang Menteng</span> tersisa <span className="font-bold text-amber-600">5kg</span>. Estimasi habis dalam 3 hari."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom App Bar */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 pb-6 w-full px-6">
                    <div className="flex items-center gap-1.5 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-border/40 shadow-xl">
                        <div className="h-10 w-10 bg-muted/20 rounded-xl border border-border/10 flex items-center justify-center p-2">
                            <SlackIcon className="h-full w-full text-zinc-600" />
                        </div>
                        <div className="h-10 w-10 bg-muted/20 rounded-xl border border-border/10 flex items-center justify-center p-2">
                            <NotionIcon className="h-full w-full" />
                        </div>
                        <motion.div
                            animate={{ y: -8 }}
                            className="h-14 w-14 bg-white rounded-2xl border border-border flex items-center justify-center p-2.5 shadow-lg"
                        >
                            <BeresLogo className="h-full w-full" />
                        </motion.div>
                        <div className="h-10 w-10 bg-muted/20 rounded-xl border border-border/10 flex items-center justify-center p-2">
                            <Package className="h-full w-full text-blue-500" />
                        </div>
                        <div className="h-10 w-10 bg-muted/20 rounded-xl border border-border/10 flex items-center justify-center p-2">
                            <TrendingUp className="h-full w-full text-emerald-500" />
                        </div>
                        <div className="h-10 w-10 bg-muted/10 rounded-xl border border-border/10 flex items-center justify-center p-2 opacity-60">
                            <Plus className="h-5 w-5 text-muted-foreground/60" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function FinanceMockup() {
    return (
        <div className="w-full h-full bg-emerald-500 overflow-hidden flex flex-col items-center pt-10">
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                className="w-[85%] bg-background rounded-2xl shadow-2xl p-6 space-y-6"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Arus Kas</span>
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                </div>
                <div className="space-y-1">
                    <Heading as="h4" className="text-2xl font-black text-foreground">Rp 45.850.000</Heading>
                    <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                        <ArrowRight className="h-2 w-2 -rotate-45" /> +12.5% dibanding bulan lalu
                    </p>
                </div>
                <div className="grid grid-cols-7 items-end gap-1.5 h-24 pt-4">
                    {[40, 70, 55, 90, 45, 60, 85].map((h, i) => (
                        <div key={i} className="bg-emerald-500/20 rounded-t-sm w-full transition-all" style={{ height: `${h}%` }} />
                    ))}
                </div>
                <div className="space-y-3 pt-4 border-t border-border/40">
                    {[
                        { label: "Penjualan Toko", amount: "Rp 32.400.000", color: "bg-emerald-500" },
                        { label: "Marketplace", amount: "Rp 13.450.000", color: "bg-blue-500" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={cn("h-2 w-2 rounded-full", item.color)} />
                            <p className="text-[10px] font-bold text-foreground flex-1">{item.label}</p>
                            <p className="text-[10px] font-black text-foreground">{item.amount}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

function InventoryMockup() {
    return (
        <div className="w-full h-full bg-blue-500 overflow-hidden flex flex-col items-center pt-10 px-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                className="w-full bg-background rounded-2xl shadow-2xl p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Package className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-black text-foreground">Manajemen Stok</p>
                        <p className="text-[10px] text-muted-foreground font-bold">Total: 2,450 item</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {[
                        { name: "Premium Coffee Beans", stock: "82 kg", status: "In Stock" },
                        { name: "Whole Milk 1L", stock: "14 units", status: "Low Stock" },
                        { name: "Paper Cups 12oz", stock: "1,200 units", status: "In Stock" }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/40">
                            <div className="text-left">
                                <p className="text-[11px] font-bold text-foreground">{item.name}</p>
                                <p className="text-[9px] text-muted-foreground">{item.status}</p>
                            </div>
                            <p className="text-xs font-black text-foreground">{item.stock}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

function InvoicesMockup() {
    return (
        <div className="w-full h-full bg-amber-500 overflow-hidden flex flex-col items-center pt-10">
            <motion.div
                initial={{ rotate: -5, y: 40 }}
                whileInView={{ rotate: 0, y: 0 }}
                className="w-[80%] bg-background rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
            >
                <div className="flex justify-between items-start">
                    <div className="space-y-1 text-left">
                        <p className="text-xs font-black text-foreground uppercase tracking-tight">Kwitansi Digital</p>
                        <p className="text-[10px] text-muted-foreground font-bold italic">#2024-03-8822</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                </div>
                <div className="py-4 border-y border-dashed border-border/60 space-y-3">
                    {[
                        { label: "Kopi Gula Aren", price: "28.000" },
                        { label: "Roti Bakar Coklat", price: "22.000" },
                        { label: "Pajak (PB1)", price: "5.000" }
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between text-left">
                            <p className="text-[10px] font-bold text-foreground/80">{item.label}</p>
                            <p className="text-[10px] font-black text-foreground">Rp {item.price}</p>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-end pt-2">
                    <p className="text-[9px] text-muted-foreground font-black uppercase">Metode: QRIS</p>
                    <div className="px-3 py-1 bg-foreground rounded-full">
                        <p className="text-[10px] font-black text-background">Total: Rp 55.000</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

function UsersMockup() {
    return (
        <div className="w-full h-full bg-violet-600 overflow-hidden flex flex-col items-center pt-10 px-6">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="w-full bg-background rounded-2xl shadow-2xl p-6"
            >
                <div className="flex items-center justify-between mb-8">
                    <p className="text-[11px] font-black text-foreground uppercase tracking-wider">Tim Operasional</p>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-violet-100" />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { name: "Ahmad", role: "Manager", status: "Aktif" },
                        { name: "Siti", role: "Kasir", status: "Shift" },
                        { name: "Budi", role: "Gudang", status: "Aktif" },
                        { name: "Maya", role: "Admin", status: "Off" }
                    ].map((user, i) => (
                        <div key={i} className="flex flex-col items-center p-4 rounded-2xl border border-border/40 gap-2 text-center">
                            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center shadow-inner">
                                <Users className="h-4 w-4 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-foreground">{user.name}</p>
                                <p className="text-[8px] text-muted-foreground font-bold">{user.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

// --- MAIN COMPONENT ---

export function WhyChooseUs() {
    const cards = [
        {
            tag: "Enterprise Search",
            title: "Cari Semuanya Dalam Sekali Klik.",
            description: "Akses data transaksi, stok, pelanggan, dan laporan dari seluruh ekosistem bisnis Anda dalam satu bar pencarian cerdas.",
            mockup: <EnterpriseSearchMockup />,
            className: "md:col-span-6 min-h-[500px]"
        },
        {
            tag: "Keuangan",
            title: "Arus Kas Terkoordinasi",
            description: "Analisis keuangan otomatis yang memberikan gambaran jernih tentang profitabilitas bisnis Anda.",
            mockup: <FinanceMockup />,
            className: "md:col-span-3 min-h-[400px]"
        },
        {
            tag: "Inventori",
            title: "Manajemen Stok Proaktif",
            description: "Pantau ketersediaan barang di berbagai gudang dan cabang dengan sistem peringatan stok rendah.",
            mockup: <InventoryMockup />,
            className: "md:col-span-3 min-h-[400px]"
        },
        {
            tag: "SDM",
            title: "Kolaborasi Tim Terpadu",
            description: "Kelola hak akses dan performa karyawan secara efisien dalam satu dashboard terpusat.",
            mockup: <UsersMockup />,
            className: "md:col-span-4 min-h-[400px]"
        },
        {
            tag: "Kasir",
            title: "Admin & Resi Digital",
            description: "Proses transaksi cepat dengan integrasi pembayaran lengkap dan pengiriman struk otomatis.",
            mockup: <InvoicesMockup />,
            className: "md:col-span-2 min-h-[400px]"
        }
    ]

    return (
        <Section id="features" className="relative overflow-hidden bg-muted/5">
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="max-w-3xl mb-16 text-left relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-6"
                >
                    <Text variant="overline">Key Performance Grid</Text>
                    <Heading as="h3">
                        Satu Platform. <br />
                        <span className="text-muted-foreground tracking-tight">Semua Urusan Jadi Beres.</span>
                    </Heading>
                    <Text variant="lead">
                        Beres.io bukan hanya kasir. Kami adalah ekosistem lengkap untuk pertumbuhan bisnis Anda, dari operasional meja hingga laporan keuangan.
                    </Text>
                </motion.div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-24">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={cn(
                            "group bg-white rounded-[40px] border border-border/40 flex flex-col hover:shadow-3xl hover:shadow-primary/5 transition-all duration-500 overflow-hidden",
                            card.className
                        )}
                    >
                        <div className="text-left pt-12 px-10 mb-8 flex flex-col items-start gap-4">
                            <Text variant="overline" className="tracking-[0.2em]">{card.tag}</Text>
                            <Heading as="h4" className="text-3xl tracking-tight font-black leading-[1.1]">
                                {card.title}
                            </Heading>
                            <Text variant="muted" className="text-[15px] max-w-[400px]">
                                {card.description}
                            </Text>
                        </div>

                        {/* Mockup visualization filling the rest of the space at the bottom */}
                        <div className="relative w-full flex-1 flex items-stretch">
                            {card.mockup}
                        </div>
                    </motion.div>
                ))}
            </div>

            <SectionCTA
                title="Siap Tumbuh Lebih Terorganisir?"
                description="Coba gratis selama 14 hari tanpa biaya setup. Bergabunglah dengan ratusan pengusaha yang sudah mengotomatisasi operasional mereka hari ini."
                primaryLabel="Coba Gratis Sekarang"
                primaryHref="/daftar"
                secondaryLabel="Lihat Jadwal Demo"
                secondaryHref="/demo"
            />
        </Section>
    )
}
