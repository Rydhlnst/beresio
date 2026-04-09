import {
    TrendingUp,
    Package,
    Users,
    FileText,
    ArrowRight,
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Heading, Text } from "@repo/ui"
import { Section } from "./Section"
import { SectionCTA } from "./SectionCTA"

// --- ICONS & ASSETS ---

function BeresLogo({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 58 80" className={cn("text-brand", className)} fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 12C0 5.37258 5.37258 0 12 0H26V38H0V12Z" fill="currentColor" />
            <path d="M0 42H26V80H12C5.37258 80 0 74.6274 0 68V42Z" fill="currentColor" />
            <path d="M26 42H42C50.8366 42 58 49.1634 58 58V64C58 72.8366 50.8366 80 42 80H26V42Z" fill="currentColor" />
            <path d="M26 0H42C50.8366 0 58 7.16344 58 16V22C58 30.8366 50.8366 38 42 38H26V0Z" fill="currentColor" />
        </svg>
    )
}


// --- MINI MOCKUP COMPONENTS ---

function EnterpriseSearchMockup() {
    return (
        <div className="h-full w-full bg-brand/90 px-4 pt-12 sm:px-6">
            <div className="relative flex w-full flex-col gap-6 overflow-hidden rounded-t-2xl bg-background p-6 pb-20 shadow-2xl">
                {/* Search Badge */}
                <div className="absolute top-4 right-4 bg-muted/30 text-[9px] font-bold px-3 py-1 rounded-full text-foreground/60 backdrop-blur-sm">
                    top customer requests this quarter
                </div>

                {/* Sub Header */}
                <div className="flex items-center gap-3 text-muted-foreground/40 mt-6 text-left">
                    <div className="h-4 w-4 rounded-sm bg-brand/10 flex items-center justify-center p-0.5 shadow-sm">
                        <TrendingUp className="h-full w-full text-brand" strokeWidth={3} />
                    </div>
                    <span className="text-[11px] font-bold text-foreground/40">24 Insight Ditemukan</span>
                    <div className="flex gap-1 items-center">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/20" />
                        <div className="h-4 w-4 rounded-full bg-blue-500/20" />
                        <div className="h-4 w-4 rounded-full bg-amber-500/20" />
                    </div>
                    <ArrowRight className="h-3 w-3 text-brand/40" />
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
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center pb-6 w-full px-6">
                    <div className="flex items-center gap-2 p-1.5 bg-background/60 backdrop-blur-xl rounded-3xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                        {/* Center Logo - Beres */}
                        <div className="h-16 w-16 bg-background rounded-[24px] border border-border/60 flex items-center justify-center p-3 shadow-[0_12px_24px_-8px_rgba(238,72,34,0.35)] relative z-10">
                            <BeresLogo className="h-full w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FinanceMockup() {
    return (
        <div className="h-full w-full overflow-hidden bg-emerald-500 px-4 pt-10 sm:px-6">
            <div className="w-full space-y-6 rounded-2xl bg-background p-6 shadow-2xl">
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
            </div>
        </div>
    )
}

function InventoryMockup() {
    return (
        <div className="w-full h-full bg-blue-500 overflow-hidden flex flex-col items-center pt-10 px-6">
            <div className="w-full bg-background rounded-2xl shadow-2xl p-6">
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
            </div>
        </div>
    )
}

function InvoicesMockup() {
    return (
        <div className="h-full w-full overflow-hidden bg-amber-500 px-4 pt-10 sm:px-6">
            <div className="flex w-full flex-col gap-4 rounded-2xl bg-background p-6 shadow-2xl">
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
            </div>
        </div>
    )
}

function UsersMockup() {
    return (
        <div className="w-full h-full bg-violet-600 overflow-hidden flex flex-col items-center pt-10 px-6">
            <div className="w-full bg-background rounded-2xl shadow-2xl p-6">
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
            </div>
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
            // Full row on md+, one col on mobile
            className: "col-span-1 md:col-span-6 min-h-[clamp(320px,40vw,520px)]"
        },
        {
            tag: "Keuangan",
            title: "Arus Kas Terkoordinasi",
            description: "Analisis keuangan otomatis yang memberikan gambaran jernih tentang profitabilitas bisnis Anda.",
            mockup: <FinanceMockup />,
            className: "col-span-1 md:col-span-3 min-h-[clamp(260px,32vw,420px)]"
        },
        {
            tag: "Inventori",
            title: "Manajemen Stok Proaktif",
            description: "Pantau ketersediaan barang di berbagai gudang dan cabang dengan sistem peringatan stok rendah.",
            mockup: <InventoryMockup />,
            className: "col-span-1 md:col-span-3 min-h-[clamp(260px,32vw,420px)]"
        },
        {
            tag: "SDM",
            title: "Kolaborasi Tim Terpadu",
            description: "Kelola hak akses dan performa karyawan secara efisien dalam satu dashboard terpusat.",
            mockup: <UsersMockup />,
            className: "col-span-1 md:col-span-4 min-h-[clamp(260px,32vw,420px)]"
        },
        {
            tag: "Kasir",
            title: "Admin & Resi Digital",
            description: "Proses transaksi cepat dengan integrasi pembayaran lengkap dan pengiriman struk otomatis.",
            mockup: <InvoicesMockup />,
            className: "col-span-1 md:col-span-2 min-h-[clamp(260px,32vw,420px)]"
        }
    ]

    return (
        <Section id="features" className="relative overflow-hidden bg-background">
            {/* Background elements */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="max-w-3xl mb-[clamp(2rem,5vw,4rem)] text-left relative z-10">
                <div className="flex flex-col gap-6">
                    <Text variant="overline">Key Performance Grid</Text>
                    <Heading as="h3" className="text-[clamp(1.75rem,4vw,3rem)] tracking-tight leading-[1.15]">
                        Satu Platform. <br />
                        <span className="text-muted-foreground tracking-tight">Semua Urusan Jadi Beres.</span>
                    </Heading>
                    <Text variant="lead">
                        Beres.io bukan hanya kasir. Kami adalah ekosistem lengkap untuk pertumbuhan bisnis Anda, dari operasional meja hingga laporan keuangan.
                    </Text>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-[clamp(4rem,6vw,6rem)]">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className={cn(
                            "group bg-card rounded-[40px] border border-border/60 flex flex-col hover:shadow-3xl hover:shadow-brand/10 transition-all duration-500 overflow-hidden",
                            card.className
                        )}
                    >
                        <div className="text-left pt-[clamp(1.5rem,4vw,3rem)] px-[clamp(1.25rem,4vw,2.5rem)] mb-8 flex flex-col items-start gap-4">
                            <Text variant="overline" className="tracking-[0.2em]">{card.tag}</Text>
                            <Heading as="h4" className="text-[clamp(1.25rem,2.5vw,1.875rem)] tracking-tight font-black leading-[1.1]">
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
                    </div>
                ))}
            </div>

            <SectionCTA
                title="Siap Tumbuh Lebih Terorganisir?"
                description="Daftar wishlist sekarang dan amankan slot VIP Anda. Bergabunglah dengan ratusan pengusaha yang siap mengotomatisasi operasional mereka."
                primaryLabel="Ingatkan Saya Saat Launching"
                primaryHref="/wishlist"
                secondaryLabel="Lihat Jadwal Demo"
                secondaryHref="/demo"
            />
        </Section>
    )
}
