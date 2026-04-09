import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { cn } from "@repo/ui/lib/utils";
import {
    ArrowRight,
    Check,
    ChevronRight,
    CircleDollarSign,
    MessageSquareText,
    ScanLine,
    Star,
} from "lucide-react";
import type { FAQItem } from "./FAQ";
import { APP_CONTENT_WIDTH } from "./layout-width";
import { HeroDashboardMockup, type HeroDashboardMockupProps } from "./HeroDashboard";
import { LazySavingsSection } from "./LazySavingsSection";
import { LazyLandingFAQSection } from "./LazyLandingFAQSection";

const INTEGRATIONS = ["GoPay", "OVO", "DANA", "QRIS", "Midtrans", "WhatsApp Business"];

const VERTICALS = [
    {
        id: "fnb",
        label: "Restoran & F&B",
        icon: "RF",
        points: [
            "Manajemen meja & split bill",
            "Kitchen Display System",
            "Menu dinamis & promo happy hour",
            "QRIS + e-wallet payment",
        ],
        workflow: [
            { stage: "Order masuk dari POS", module: "Kasir Frontline", latency: "< 3 detik" },
            { stage: "Tiketing otomatis ke dapur", module: "Kitchen Display", latency: "Realtime" },
            { stage: "Pembayaran + closing shift", module: "Payment & Rekap", latency: "< 2 menit" },
        ],
        kpi: {
            label: "Order terselesaikan tepat waktu",
            value: "96%",
            meter: "96%",
        },
    },
    {
        id: "retail",
        label: "Retail & Toko",
        icon: "RT",
        points: [
            "Barcode scanning POS",
            "Manajemen stok multi-cabang",
            "Laporan profit per SKU",
            "Integrasi Tokopedia & Shopee",
        ],
        workflow: [
            { stage: "Scan produk di kasir", module: "Barcode POS", latency: "< 2 detik" },
            { stage: "Sinkron stok lintas cabang", module: "Inventory Sync", latency: "Setiap transaksi" },
            { stage: "Alert reorder otomatis", module: "Stock Threshold", latency: "< 5 menit" },
        ],
        kpi: {
            label: "Akurasi stok harian",
            value: "94%",
            meter: "94%",
        },
    },
    {
        id: "laundry",
        label: "Laundry",
        icon: "LD",
        points: [
            "Order & tracking status cucian",
            "Notifikasi WhatsApp otomatis",
            "Manajemen shift karyawan",
            "Laporan pendapatan harian",
        ],
        workflow: [
            { stage: "Order diterima counter", module: "Intake & Tagging", latency: "< 1 menit" },
            { stage: "Status proses diperbarui", module: "Wash-Dry-Fold Tracker", latency: "Auto update" },
            { stage: "Notifikasi siap diambil", module: "WhatsApp Reminder", latency: "< 10 detik" },
        ],
        kpi: {
            label: "Order selesai sesuai SLA",
            value: "97%",
            meter: "97%",
        },
    },
    {
        id: "service",
        label: "Layanan & Profesional",
        icon: "LP",
        points: [
            "Appointment booking online",
            "Invoice & recurring billing",
            "Integrasi Google Calendar",
            "Reminder otomatis ke klien",
        ],
        workflow: [
            { stage: "Booking masuk dari klien", module: "Online Scheduler", latency: "Realtime" },
            { stage: "Penugasan tim otomatis", module: "Staff Allocation", latency: "< 2 menit" },
            { stage: "Invoice & follow-up terkirim", module: "Billing Automation", latency: "< 15 detik" },
        ],
        kpi: {
            label: "Kehadiran appointment tepat waktu",
            value: "92%",
            meter: "92%",
        },
    },
] as const;

const FEATURE_SECTIONS = [
    {
        title: "POS yang Ringan dan Cepat",
        label: "Transaksi Harian",
        icon: ScanLine,
        points: [
            "Transaksi selesai dalam hitungan detik",
            "Mendukung QRIS, e-wallet, tunai, transfer",
            "Mode offline - tetap jalan tanpa internet",
            "Cetak struk thermal atau kirim via WhatsApp",
        ],
        tone: "from-primary/12 via-secondary/55 to-muted/80",
    },
    {
        title: "Laporan Real-Time untuk Owner",
        label: "Kontrol Keuangan",
        icon: CircleDollarSign,
        points: [
            "Dashboard pendapatan hari ini langsung di HP",
            "Laporan laba-rugi otomatis tanpa input manual",
            "Export PDF & Excel untuk laporan pajak",
            "Analitik tren mingguan & bulanan",
        ],
        tone: "from-secondary/75 via-accent/55 to-muted/85",
    },
    {
        title: "Notifikasi WhatsApp Otomatis",
        label: "Customer Communication",
        icon: MessageSquareText,
        points: [
            "Konfirmasi order langsung ke pelanggan",
            "Reminder pengambilan & pembayaran",
            "Alert stok habis ke pemilik",
            "Template pesan yang bisa dikustomisasi",
        ],
        tone: "from-primary/10 via-muted/70 to-secondary/80",
    },
] as const;

const FEATURE_MOCKUPS: HeroDashboardMockupProps[] = [
    {
        title: "Dashboard Transaksi",
        ownerSummaryLabel: "Ringkasan Transaksi",
        greetingDescription: "Pantau kecepatan checkout, kanal pembayaran, dan kualitas layanan POS dalam satu tampilan.",
        stats: [
            { label: "TRANSAKSI HARI INI", value: "148", change: "vs kemarin", trend: "up", iconKey: "orders" },
            { label: "QRIS + E-WALLET", value: "81%", change: "adopsi kanal cashless", trend: "up", iconKey: "customers" },
            { label: "WAKTU CHECKOUT", value: "3.4 mnt", change: "rata-rata", trend: "neutral", iconKey: "drivers" },
            { label: "STRUK TERKIRIM", value: "92%", change: "thermal + WhatsApp", trend: "up", iconKey: "stock" },
        ],
    },
    {
        title: "Dashboard Keuangan",
        ownerSummaryLabel: "Kontrol Keuangan",
        greetingDescription: "Lihat omzet, margin, dan cashflow harian untuk membantu keputusan finansial lebih cepat.",
        stats: [
            { label: "OMZET HARI INI", value: "Rp 12,8jt", change: "vs kemarin", trend: "up", iconKey: "revenue" },
            { label: "LABA KOTOR", value: "61%", change: "margin harian", trend: "up", iconKey: "orders" },
            { label: "BIAYA OPERASIONAL", value: "Rp 3,1jt", change: "hari ini", trend: "neutral", iconKey: "stock" },
            { label: "CASHFLOW BERSIH", value: "Rp 9,7jt", change: "netto berjalan", trend: "up", iconKey: "branches" },
        ],
    },
    {
        title: "Dashboard Komunikasi",
        ownerSummaryLabel: "Customer Communication",
        greetingDescription: "Kontrol notifikasi WhatsApp otomatis untuk konfirmasi order, reminder, dan follow-up pelanggan.",
        stats: [
            { label: "PESAN TERKIRIM", value: "286", change: "hari ini", trend: "up", iconKey: "customers" },
            { label: "PENGINGAT OTOMATIS", value: "74", change: "reminder aktif", trend: "up", iconKey: "orders" },
            { label: "DELIVERY RATE", value: "98%", change: "pesan berhasil", trend: "up", iconKey: "drivers" },
            { label: "RESPON PELANGGAN", value: "43", change: "interaksi masuk", trend: "neutral", iconKey: "stock" },
        ],
    },
];

const PRICING_PLANS = [
    {
        name: "Free",
        price: "Rp 0/bulan",
        cta: "Mulai Gratis",
        href: "/wishlist",
        popular: false,
        items: ["1 outlet", "100 produk", "500 transaksi/bulan", "Laporan dasar", "Notifikasi WhatsApp"],
    },
    {
        name: "Starter",
        price: "Rp 99.000/bulan",
        cta: "Coba 14 Hari Gratis",
        href: "/wishlist",
        popular: true,
        items: ["1 outlet", "Produk & transaksi unlimited", "Semua laporan", "QRIS + e-wallet", "Email support"],
    },
    {
        name: "Growth",
        price: "Rp 299.000/bulan",
        cta: "Hubungi Kami",
        href: "/sales",
        popular: false,
        items: ["3 outlet", "Multi-cabang + konsolidasi", "Sinkronisasi e-commerce", "API access", "Priority support"],
    },
] as const;

const TESTIMONIALS = [
    {
        initials: "RS",
        name: "Rina S.",
        meta: "Pemilik Kafe, Medan",
        quote: "Sebelum pakai Beres, saya harus rekap manual tiap malam. Sekarang laporan langsung ada di HP, tinggal lihat.",
    },
    {
        initials: "BH",
        name: "Budi H.",
        meta: "Toko Pakaian, Surabaya",
        quote: "Stok barang jadi terkontrol, tidak ada lagi kasus kehabisan di hari ramai. Sangat membantu!",
    },
    {
        initials: "SW",
        name: "Sari W.",
        meta: "Laundry Kiloan, Bandung",
        quote: "Pelanggan senang dapat notifikasi WhatsApp otomatis. Komplain soal lupa ambil sudah tidak ada lagi.",
    },
] as const;

const LANDING_FAQS: FAQItem[] = [
    {
        category: "Pertanyaan Umum",
        question: "Apakah saya perlu keahlian teknis untuk menggunakan Beres Cloud?",
        answer: "Tidak. Platform kami dirancang untuk mudah digunakan sejak hari pertama, dengan panduan setup dan video tutorial.",
    },
    {
        category: "Pertanyaan Umum",
        question: "Bagaimana jika koneksi internet saya tidak stabil?",
        answer: "POS kami mendukung mode offline. Transaksi tetap berjalan dan data akan tersinkronisasi saat koneksi kembali.",
    },
    {
        category: "Pertanyaan Umum",
        question: "Apakah data bisnis saya aman?",
        answer: "Ya. Data dienkripsi dan di-backup otomatis setiap hari. Kami menggunakan infrastruktur cloud enterprise-grade.",
    },
    {
        category: "Pertanyaan Umum",
        question: "Bisa digunakan di HP atau tablet?",
        answer: "Bisa. Platform kami responsive dan dioptimalkan untuk tablet (POS) dan smartphone (monitoring owner).",
    },
    {
        category: "Pertanyaan Umum",
        question: "Apakah ada biaya setup atau kontrak jangka panjang?",
        answer: "Tidak ada. Bayar bulanan, cancel kapan saja tanpa penalti.",
    },
] as const;

function Reveal({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("beres-reveal", className)}>
            {children}
        </div>
    );
}

export function BeresCloudLanding() {
    return (
        <div className="bg-background font-[var(--font-beres-dm-sans)] text-foreground">
            <main>
                <section className="relative overflow-hidden border-b border-border/60">
                    <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] [background-size:44px_44px] opacity-30" />
                    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,hsl(var(--secondary))_0%,transparent_46%)]" />
                    <div className={cn(APP_CONTENT_WIDTH, "pb-16 pt-14 sm:pt-20 lg:pb-24")}>
                        <Reveal className="max-w-3xl">
                            <Badge className="rounded-full border border-border/80 bg-secondary px-4 py-1.5 text-[11px] font-semibold text-foreground">
                                ✦ Platform Manajemen Bisnis #1 untuk UKM Indonesia
                            </Badge>
                            <h1 className="mt-6 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2.7rem,8vw,4.5rem)] leading-[0.95] tracking-tight text-foreground">
                                Satu Platform.
                                <br />
                                Semua Bisnis Anda.
                            </h1>
                            <p className="mt-5 max-w-[540px] text-lg leading-relaxed text-muted-foreground">
                                Dari warung kopi hingga laundry rumahan - Beres Cloud hadir untuk menyederhanakan operasional bisnis Anda. POS, laporan, notifikasi, semua dalam satu tempat.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Button size="lg" className="h-12 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90" asChild>
                                    <Link href="/wishlist">Coba Gratis 14 Hari</Link>
                                </Button>
                                <Button size="lg" variant="ghost" className="h-12 rounded-full px-6 text-foreground" asChild>
                                    <Link href="/demo">
                                        Lihat Demo
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                            <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span>Dipercaya 2.000+ pemilik bisnis di Indonesia</span>
                            </div>
                        </Reveal>

                        <Reveal className="mt-10 lg:mt-12">
                            <HeroDashboardMockup />
                        </Reveal>
                    </div>
                </section>

                <section className="border-b border-border/60 py-12">
                    <div className={APP_CONTENT_WIDTH}>
                        <Reveal>
                            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Terintegrasi dengan</p>
                            <div className="hidden grid-cols-6 gap-3 md:grid">
                                {INTEGRATIONS.map((item) => (
                                    <div key={item} className="rounded-full border border-border/70 bg-secondary px-4 py-2 text-center text-sm font-medium text-muted-foreground">
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <div className="overflow-hidden md:hidden">
                                <div className="beres-marquee-track flex w-max gap-3">
                                    {[...INTEGRATIONS, ...INTEGRATIONS].map((item, idx) => (
                                        <div key={`${item}-${idx}`} className="rounded-full border border-border/70 bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                <section className="border-b border-border/60 py-16 sm:py-20">
                    <div className={APP_CONTENT_WIDTH}>
                        <Reveal>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Mengapa Beres Cloud?</p>
                            <h2 className="mt-3 max-w-3xl text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5.4vw,3.1rem)] leading-tight">
                                Berhenti kelola bisnis pakai spreadsheet dan catatan manual
                            </h2>
                        </Reveal>
                        <Reveal className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
                            <div className="space-y-3">
                                {[
                                    "Data tersebar di mana-mana",
                                    "Tidak tahu untung atau rugi hari ini",
                                    "Stok habis baru ketahuan saat pelanggan pesan",
                                ].map((item) => (
                                    <Card key={item} className="border-destructive/25 bg-destructive/10">
                                        <CardContent className="p-4 text-sm font-medium text-foreground/90">{item}</CardContent>
                                    </Card>
                                ))}
                            </div>
                            <div className="flex items-center justify-center py-3 text-primary">
                                <ChevronRight className="h-8 w-8 lg:h-10 lg:w-10" />
                            </div>
                            <div className="space-y-3">
                                {[
                                    "Semua data terpusat, real-time",
                                    "Laporan laba-rugi otomatis setiap hari",
                                    "Alert stok menipis sebelum habis",
                                ].map((item) => (
                                    <Card key={item} className="border-emerald-500/30 bg-emerald-500/10">
                                        <CardContent className="flex items-center gap-2 p-4 text-sm font-medium text-foreground/90">
                                            <Check className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
                                            {item}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </section>
                <section id="solusi" className="border-b border-border/60 py-16 sm:py-20">
                    <div className={APP_CONTENT_WIDTH}>
                        <Reveal>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Solusi per Industri</p>
                            <h2 className="mt-3 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5vw,3rem)] leading-tight">
                                Dirancang khusus untuk bisnis Anda
                            </h2>
                        </Reveal>

                        <Reveal className="mt-10">
                            <Tabs defaultValue={VERTICALS[0].id} className="w-full">
                                <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                                    {VERTICALS.map((vertical) => (
                                        <TabsTrigger
                                            key={vertical.id}
                                            value={vertical.id}
                                            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                                        >
                                            {vertical.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                {VERTICALS.map((vertical) => (
                                    <TabsContent key={vertical.id} value={vertical.id} className="mt-5 focus-visible:outline-none">
                                        <div className="overflow-hidden rounded-[28px] border border-border/80 bg-[linear-gradient(132deg,hsl(var(--background))_0%,hsl(var(--secondary)/0.55)_100%)] p-6 sm:p-8">
                                            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
                                                <div>
                                                    <div className="flex items-center gap-3 text-xl">
                                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                            {vertical.icon}
                                                        </span>
                                                        <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                                                            {vertical.label}
                                                        </h3>
                                                    </div>
                                                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                                                        {vertical.points.map((point) => (
                                                            <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                                                                <span>{point}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className="mt-6 flex flex-wrap items-center gap-4">
                                                        <Link href="/solusi" className="inline-flex items-center text-sm font-semibold text-primary transition-colors hover:text-primary/80">
                                                            Pelajari lebih
                                                            <ArrowRight className="ml-1 h-4 w-4" />
                                                        </Link>
                                                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                                                            {vertical.kpi.label}
                                                            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] text-foreground">
                                                                {vertical.kpi.value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <aside className="relative overflow-hidden rounded-2xl border border-primary/20 bg-background/95 p-5 shadow-[0_16px_44px_-28px_hsl(var(--primary)/0.55)]">
                                                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.18)_0%,transparent_72%)]" />
                                                    <div className="relative">
                                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
                                                            Workflow Module
                                                        </p>
                                                        <p className="mt-2 text-sm text-muted-foreground">
                                                            Alur otomatis {vertical.label.toLowerCase()} dari transaksi sampai laporan.
                                                        </p>

                                                        <div className="mt-5 space-y-3">
                                                            {vertical.workflow.map((flow, index) => (
                                                                <div
                                                                    key={flow.stage}
                                                                    className="industry-flow-row relative rounded-xl border border-border/70 bg-secondary/45 p-3.5"
                                                                    style={{ "--flow-delay": `${index * 110}ms` } as CSSProperties}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <span className="industry-flow-dot mt-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-foreground">{flow.stage}</p>
                                                                            <p className="mt-1 text-xs text-muted-foreground">{flow.module}</p>
                                                                        </div>
                                                                        <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                                                            {flow.latency}
                                                                        </span>
                                                                    </div>
                                                                    {index < vertical.workflow.length - 1 && (
                                                                        <div className="pointer-events-none absolute left-[1.15rem] top-[calc(100%-0.2rem)] h-4 w-px bg-primary/25" />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="mt-5 rounded-xl border border-border/70 bg-background/95 p-3.5">
                                                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                                                {vertical.kpi.label}
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-3">
                                                                <p className="text-2xl font-semibold tracking-tight text-foreground">
                                                                    {vertical.kpi.value}
                                                                </p>
                                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                                                    <div
                                                                        className="industry-flow-meter h-full rounded-full bg-primary"
                                                                        style={{ width: vertical.kpi.meter }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </aside>
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </Reveal>
                    </div>
                </section>

                <section id="fitur" className="border-b border-border/60 py-16 sm:py-20">
                    <div className={cn(APP_CONTENT_WIDTH, "space-y-14")}>
                        {FEATURE_SECTIONS.map((section, index) => {
                            const Icon = section.icon;
                            const mockup = FEATURE_MOCKUPS[index] ?? FEATURE_MOCKUPS[0];
                            return (
                                <Reveal
                                    key={section.title}
                                    className={cn(
                                        "grid items-center gap-8 lg:grid-cols-2",
                                        index % 2 === 1 && "lg:[&>*:first-child]:order-2"
                                    )}
                                >
                                    <div className={cn("rounded-3xl border border-border/70 p-6 sm:p-8", `bg-gradient-to-br ${section.tone}`)}>
                                        <HeroDashboardMockup
                                            mode="compact"
                                            className="w-full"
                                            {...mockup}
                                        />
                                    </div>
                                    <div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                                            <Icon className="h-3.5 w-3.5 text-primary" />
                                            {section.label}
                                        </div>
                                        <h3 className="mt-4 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(1.6rem,4vw,2.4rem)] leading-tight">
                                            {section.title}
                                        </h3>
                                        <ul className="mt-5 space-y-3">
                                            {section.points.map((point) => (
                                                <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>
                </section>

                <LazySavingsSection />

                <section id="harga" className="border-b border-border/60 py-16 sm:py-20">
                    <div className={APP_CONTENT_WIDTH}>
                        <Reveal className="max-w-2xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Harga</p>
                            <h2 className="mt-3 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5vw,3rem)] leading-tight">
                                Mulai gratis. Bayar sesuai pertumbuhan.
                            </h2>
                        </Reveal>
                        <Reveal className="mt-10 grid gap-5 lg:grid-cols-3">
                            {PRICING_PLANS.map((plan) => (
                                <Card
                                    key={plan.name}
                                    className={cn(
                                        "relative border-border/80 bg-background",
                                        plan.popular && "border-primary/70 shadow-xl shadow-primary/10"
                                    )}
                                >
                                    {plan.popular && (
                                        <Badge className="absolute right-4 top-4 rounded-full bg-primary text-primary-foreground">
                                            Paling Populer
                                        </Badge>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-2xl font-bold text-foreground">{plan.name}</CardTitle>
                                        <p className="text-lg font-semibold text-primary">{plan.price}</p>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2.5">
                                            {plan.items.map((item) => (
                                                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            className={cn(
                                                "mt-6 w-full rounded-full",
                                                plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-foreground hover:bg-secondary/70"
                                            )}
                                            asChild
                                        >
                                            <Link href={plan.href}>{plan.cta}</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </Reveal>
                        <p className="mt-6 text-sm text-muted-foreground">
                            Semua harga belum termasuk PPN. Bayar bulanan, cancel kapan saja.
                        </p>
                    </div>
                </section>
                <section className="border-b border-border/60 py-16 sm:py-20">
                    <div className={APP_CONTENT_WIDTH}>
                        <Reveal className="max-w-3xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Kata Mereka</p>
                            <h2 className="mt-3 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5vw,3rem)] leading-tight">
                                Dipercaya pemilik bisnis dari Sabang sampai Merauke
                            </h2>
                        </Reveal>
                        <Reveal className="mt-10 grid gap-5 lg:grid-cols-3">
                            {TESTIMONIALS.map((item) => (
                                <Card key={item.name} className="border-border/80 bg-background">
                                    <CardContent className="space-y-4 p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                                {item.initials}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.meta}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-current" />
                                            ))}
                                        </div>
                                        <p className="text-sm leading-relaxed text-muted-foreground">{item.quote}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </Reveal>
                    </div>
                </section>

                <LazyLandingFAQSection faqs={LANDING_FAQS} />

                <section className="py-14 sm:py-16">
                    <div className={APP_CONTENT_WIDTH}>
                        <Reveal className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12">
                            <div className="pointer-events-none absolute inset-0 z-0 opacity-25 [background-image:radial-gradient(hsl(var(--primary-foreground)/0.2)_1px,transparent_1px)] [background-size:16px_16px]" />
                            <div className="relative z-10">
                                <h2 className="max-w-2xl text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5vw,3rem)] leading-tight">
                                    Siap transformasi bisnis Anda?
                                </h2>
                                <p className="mt-4 max-w-2xl text-primary-foreground/85">
                                    Bergabung dengan 2.000+ pemilik bisnis yang sudah lebih tenang kelola usahanya.
                                </p>
                                <div className="mt-8">
                                    <Button className="h-12 rounded-full bg-background px-6 text-primary hover:bg-background/90" asChild>
                                        <Link href="/wishlist">Mulai Gratis Sekarang</Link>
                                    </Button>
                                </div>
                                <p className="mt-4 text-sm text-primary-foreground/85">
                                    Tidak perlu kartu kredit - Setup dalam 15 menit
                                </p>
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>
        </div>
    );
}
