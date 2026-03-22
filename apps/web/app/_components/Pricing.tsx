"use client"

import { motion } from "framer-motion"
import {
    ArrowRight,
    Check,
    X,
    Sparkles,
    TrendingUp,
    BadgePercent,
    Building2,
    ShieldCheck,
} from "lucide-react"
import { SectionClient } from "./SectionClient"
import { cn } from "@repo/ui/lib/utils"
import { Button, Heading, Text } from "@repo/ui"
import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/accordion"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/table"

type FeatureState = "yes" | "no" | "soon"

type PlanFeature = {
    label: string
    state: FeatureState
}

type Plan = {
    name: string
    description: string
    monthly: string
    yearly: string
    highlight?: string
    limits: { label: string; value: string }[]
    features: PlanFeature[]
    support: string
    ctaLabel: string
}

const pricingPhilosophy = [
    "Per organisasi, bukan per user atau per cabang",
    "Satu harga untuk semua cabang - tidak menghukum pertumbuhan",
    "Transparan: tidak ada transaction fee, tidak ada biaya tersembunyi",
    "Fitur khusus per industri tanpa bayar lebih",
]

const liveVerticals = [
    {
        name: "Laundry",
        status: "Live",
        tagline: "Kelola order, kurir, dan multi-outlet laundry dalam satu platform",
    },
]

const wave1Verticals = [
    {
        name: "F&B - Restoran & Kafe",
        tagline: "Dari meja dine-in sampai delivery GoFood/GrabFood, semua terhubung",
    },
    {
        name: "Salon & Spa",
        tagline: "Booking, stylist assignment, membership, dan laporan komisi otomatis",
    },
    {
        name: "Barbershop",
        tagline: "Antrian digital, jadwal barber, dan tracking omzet per kursi",
    },
]

const wave2Verticals = [
    {
        name: "Retail & Fashion",
        detail: "Barcode scan, varian produk, retur, stock transfer antar toko",
    },
    {
        name: "Minimarket / Groceries",
        detail: "SKU massal, expiry tracking, loyalty card, age verification",
    },
    {
        name: "Apotek & Klinik",
        detail: "Manajemen resep, stok obat, expiry alert, data dokter",
    },
    {
        name: "Wholesale / Distributor",
        detail: "Purchase order, credit terms, faktur pajak, bulk pricing",
    },
    {
        name: "Bengkel & Otomotif",
        detail: "Work order, sparepart tracking, data kendaraan pelanggan",
    },
    {
        name: "Kos-kosan & Properti",
        detail: "Billing bulanan otomatis, tracking pembayaran sewa, laporan hunian",
    },
]

const plans: Plan[] = [
    {
        name: "Solo",
        description: "Untuk usaha satu orang yang baru mulai digital.",
        monthly: "Rp 15.000",
        yearly: "Rp 144.000",
        limits: [
            { label: "Cabang", value: "1" },
            { label: "User", value: "1" },
            { label: "Transaksi", value: "Unlimited" },
        ],
        features: [
            { label: "POS & kasir", state: "yes" },
            { label: "Manajemen produk / layanan", state: "yes" },
            { label: "Laporan harian", state: "yes" },
            { label: "QR statis - upload foto QR sendiri", state: "yes" },
            { label: "Modul dasar sesuai vertical", state: "yes" },
            { label: "Akuntansi", state: "no" },
            { label: "Inventori", state: "no" },
            { label: "Delivery management", state: "no" },
            { label: "Multi-cabang", state: "no" },
            { label: "API access", state: "no" },
        ],
        support: "Chatbot / FAQ",
        ctaLabel: "Mulai dari Solo",
    },
    {
        name: "Starter",
        description: "Untuk usaha kecil dengan beberapa karyawan.",
        monthly: "Rp 99.000",
        yearly: "Rp 950.000",
        limits: [
            { label: "Cabang", value: "1" },
            { label: "User", value: "3" },
            { label: "Transaksi", value: "Unlimited" },
        ],
        features: [
            { label: "Semua fitur Solo", state: "yes" },
            { label: "Akuntansi dasar", state: "yes" },
            { label: "Inventori dasar + low stock alert", state: "yes" },
            { label: "Laporan harian & mingguan", state: "yes" },
            { label: "Manajemen tim (3 user, role berbeda)", state: "yes" },
            { label: "QR statis + konfirmasi bukti transfer", state: "yes" },
            { label: "QR dinamis / Xendit", state: "no" },
            { label: "Delivery management", state: "no" },
            { label: "Multi-cabang", state: "no" },
            { label: "API access", state: "no" },
        ],
        support: "Email (48 jam respons)",
        ctaLabel: "Pilih Starter",
    },
    {
        name: "Professional",
        description: "Untuk bisnis berkembang dengan beberapa cabang.",
        monthly: "Rp 249.000",
        yearly: "Rp 2.390.000",
        highlight: "Paling Populer",
        limits: [
            { label: "Cabang", value: "Hingga 3" },
            { label: "User", value: "10" },
            { label: "Transaksi", value: "Unlimited" },
        ],
        features: [
            { label: "Semua fitur Starter", state: "yes" },
            { label: "Multi-cabang (hingga 3)", state: "yes" },
            { label: "Akuntansi lengkap (double-entry)", state: "yes" },
            { label: "Inventori penuh + stock transfer", state: "yes" },
            { label: "Delivery management + tracking real-time", state: "yes" },
            { label: "QR dinamis per transaksi via Xendit", state: "yes" },
            { label: "Laporan advanced per cabang", state: "yes" },
            { label: "API access (5.000 calls/bulan)", state: "yes" },
            { label: "Custom receipt template", state: "yes" },
            { label: "Data export (PDF & Excel)", state: "yes" },
            { label: "Gojek/Grab integration", state: "soon" },
            { label: "Customer self-order QR", state: "no" },
            { label: "White-label", state: "no" },
        ],
        support: "WhatsApp Priority (24 jam respons)",
        ctaLabel: "Ambil Professional",
    },
    {
        name: "Enterprise",
        description: "Untuk jaringan bisnis besar dan franchise.",
        monthly: "Rp 599.000",
        yearly: "Rp 5.750.000",
        limits: [
            { label: "Cabang", value: "Unlimited" },
            { label: "User", value: "Unlimited" },
            { label: "Transaksi", value: "Unlimited" },
        ],
        features: [
            { label: "Semua fitur Professional", state: "yes" },
            { label: "Gojek/Grab integration", state: "yes" },
            { label: "Customer self-order via QR", state: "yes" },
            { label: "API access unlimited", state: "yes" },
            { label: "Laporan custom & export lanjutan", state: "yes" },
            { label: "White-label (branding bisnis)", state: "yes" },
            { label: "Onboarding training personal", state: "yes" },
            { label: "Account manager dedicated", state: "yes" },
            { label: "SLA 99.9% uptime", state: "yes" },
            { label: "Priority feature requests", state: "yes" },
        ],
        support: "24/7 Dedicated + Account Manager",
        ctaLabel: "Hubungi Sales",
    },
]

const comparisonRows = [
    { feature: "Harga/bulan", solo: "Rp 15k", starter: "Rp 99k", pro: "Rp 249k", ent: "Rp 599k" },
    { feature: "Cabang", solo: "1", starter: "1", pro: "Hingga 3", ent: "Unlimited" },
    { feature: "User", solo: "1", starter: "3", pro: "10", ent: "Unlimited" },
    { feature: "Transaksi", solo: "Unlimited", starter: "Unlimited", pro: "Unlimited", ent: "Unlimited" },
    { feature: "POS", solo: "?", starter: "?", pro: "?", ent: "?" },
    { feature: "QR statis (upload sendiri)", solo: "?", starter: "?", pro: "?", ent: "?" },
    { feature: "Bukti transfer approval", solo: "?", starter: "?", pro: "?", ent: "?" },
    { feature: "QR dinamis (Xendit)", solo: "?", starter: "?", pro: "?", ent: "?" },
    { feature: "Akuntansi", solo: "?", starter: "Dasar", pro: "Lengkap", ent: "Lengkap" },
    { feature: "Inventori", solo: "?", starter: "Dasar", pro: "Penuh", ent: "Penuh" },
    { feature: "Delivery - kurir internal", solo: "?", starter: "?", pro: "?", ent: "?" },
    { feature: "Delivery - Gojek/Grab", solo: "?", starter: "?", pro: "? (segera)", ent: "?" },
    { feature: "Multi-cabang", solo: "?", starter: "?", pro: "? (3)", ent: "? Unlimited" },
    { feature: "Laporan", solo: "Harian", starter: "Mingguan", pro: "Advanced", ent: "Custom" },
    { feature: "API access", solo: "?", starter: "?", pro: "? 5k/bln", ent: "? Unlimited" },
    { feature: "Customer self-order QR", solo: "?", starter: "?", pro: "?", ent: "?" },
    { feature: "White-label", solo: "?", starter: "?", pro: "?", ent: "?" },
    { feature: "Support", solo: "Chatbot", starter: "Email", pro: "WhatsApp", ent: "Dedicated" },
    { feature: "SLA", solo: "Best effort", starter: "Best effort", pro: "99.5%", ent: "99.9%" },
]

const verticalFeatureGroups = [
    {
        id: "laundry",
        title: "Laundry",
        badge: "Live",
        rows: [
            { feature: "POS transaksi laundry", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Status order (cuci ? setrika ? siap ? diantar)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Notifikasi order siap ke pelanggan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Manajemen kurir internal", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Tracking pengiriman real-time", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Gojek/Grab pickup & delivery", solo: "?", starter: "?", pro: "? (segera)", ent: "?" },
            { feature: "Laporan omzet per jenis layanan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Manajemen multi-outlet", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
    {
        id: "fnb",
        title: "F&B - Restoran & Kafe",
        badge: "Wave 1 Q3 2026",
        rows: [
            { feature: "POS dine-in, takeaway, delivery", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Manajemen meja (table layout)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Kitchen Display System (KDS)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Notifikasi dapur", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Manajemen kurir internal", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Gojek/Grab integration", solo: "?", starter: "?", pro: "? (segera)", ent: "?" },
            { feature: "Self-order QR pelanggan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Laporan penjualan per menu", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
    {
        id: "salon",
        title: "Salon & Spa",
        badge: "Wave 1 Q3 2026",
        rows: [
            { feature: "POS transaksi jasa", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Penugasan ke stylist", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Tips tracking", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Booking appointment", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Paket layanan & bundling", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Membership pelanggan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Komisi stylist otomatis", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Loyalty program lanjutan", solo: "?", starter: "?", pro: "?", ent: "? (segera)" },
        ],
    },
    {
        id: "barbershop",
        title: "Barbershop",
        badge: "Wave 1 Q3 2026",
        rows: [
            { feature: "POS transaksi", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Antrian digital (queue system)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Jadwal & assignment per barber", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Tips tracking", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Booking appointment online", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Komisi barber otomatis", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Laporan omzet per barber / kursi", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Loyalty & membership", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
    {
        id: "retail",
        title: "Retail & Fashion",
        badge: "Wave 2 Q4 2026",
        rows: [
            { feature: "POS + barcode scan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Varian produk (ukuran, warna)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Inventori & stok alert", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Retur & penukaran barang", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Stock transfer antar toko", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Laporan per SKU & kategori", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Purchase order (PO)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Customer self-order QR", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
    {
        id: "minimarket",
        title: "Minimarket / Groceries",
        badge: "Wave 2 Q4 2026",
        rows: [
            { feature: "POS + barcode scan massal", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Inventori + expiry date tracking", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Loyalty card pelanggan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Stock opname & adjustment", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Purchase order ke supplier", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Laporan fast-moving / slow-moving", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Multi-kasir 1 outlet", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
    {
        id: "apotek",
        title: "Apotek & Klinik",
        badge: "Wave 2 Q4 2026",
        rows: [
            { feature: "POS penjualan obat", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Inventori stok obat + expiry alert", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Manajemen resep dokter", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Data obat generik & branded", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Riwayat pembelian pelanggan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Laporan controlled substances", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Purchase order ke distributor", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
    {
        id: "wholesale",
        title: "Wholesale / Distributor",
        badge: "Wave 2 Q4 2026",
        rows: [
            { feature: "POS & order B2B", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Credit terms per pelanggan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Bulk pricing & volume discount", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Purchase order formal", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Faktur pajak (e-Faktur)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Jadwal pengiriman terencana", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Laporan piutang & aging", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
    {
        id: "bengkel",
        title: "Bengkel & Otomotif",
        badge: "Wave 2 Q1 2027",
        rows: [
            { feature: "POS + work order", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Data kendaraan pelanggan (plat, tipe)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Sparepart inventory & tracking", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Estimasi biaya servis", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Riwayat servis per kendaraan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Notifikasi servis berkala ke pelanggan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Laporan omzet per mekanik", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
    {
        id: "kos",
        title: "Kos-kosan & Properti",
        badge: "Wave 2 Q1 2027",
        rows: [
            { feature: "Manajemen unit & kamar", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Data penyewa (KTP, kontrak)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Billing sewa bulanan otomatis", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Tracking status pembayaran", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Notifikasi jatuh tempo ke penyewa", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "QR bayar sewa (statis & dinamis)", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Laporan hunian & pendapatan", solo: "?", starter: "?", pro: "?", ent: "?" },
            { feature: "Manajemen multi-properti", solo: "?", starter: "?", pro: "?", ent: "?" },
        ],
    },
]

const billingRows = [
    { plan: "Solo", monthly: "Rp 15k", yearly: "Rp 144k", saving: "Rp 36k" },
    { plan: "Starter", monthly: "Rp 99k", yearly: "Rp 950k", saving: "Rp 238k" },
    { plan: "Professional", monthly: "Rp 249k", yearly: "Rp 2.390k", saving: "Rp 598k" },
    { plan: "Enterprise", monthly: "Rp 599k", yearly: "Rp 5.750k", saving: "Rp 1.438k" },
]

const addOnRows = [
    { addon: "Extra cabang", price: "Rp 75k/bln per cabang", availability: "Professional" },
    { addon: "Extra 5 user", price: "Rp 50k/bln", availability: "Semua plan" },
    { addon: "Premium support (WhatsApp)", price: "Rp 100k/bln", availability: "Solo & Starter" },
    { addon: "API access", price: "Rp 100k/bln (5k calls)", availability: "Starter" },
]

const competitiveRows = [
    { competitor: "Pawoon Premium", price: "Rp 99k/outlet + transaction fee", equivalent: "Starter Rp 99k", advantage: "No transaction fee" },
    { competitor: "Qasir Pro", price: "Rp 99k/outlet", equivalent: "Starter Rp 99k", advantage: "Fitur lebih lengkap" },
    { competitor: "Moka Pro", price: "Rp 299k/lokasi", equivalent: "Professional Rp 249k (3 cabang)", advantage: "75% lebih murah untuk 3 lokasi" },
    { competitor: "Olsera Standard", price: "Rp 249k/lokasi", equivalent: "Professional Rp 249k (3 cabang)", advantage: "Delivery included, multi-branch native" },
    { competitor: "ESB POS", price: "Enterprise only, custom pricing", equivalent: "Enterprise Rp 599k", advantage: "Lebih terjangkau, multi-vertical" },
    { competitor: "Mekari Jurnal Starter", price: "Rp 199k (akuntansi saja)", equivalent: "Starter Rp 99k", advantage: "POS + Akuntansi + Inventori all-in-one" },
    { competitor: "Jubelio", price: "Rp 150/order (min. ~Rp 1,5jt/bln)", equivalent: "Professional Rp 249k", advantage: "Flat monthly, lebih predictable untuk volume tinggi" },
]

function FeatureItem({ label, state }: PlanFeature) {
    const icon =
        state === "yes" ? <Check className="h-4 w-4 text-emerald-500" /> :
            state === "soon" ? <Sparkles className="h-4 w-4 text-amber-500" /> :
                <X className="h-4 w-4 text-muted-foreground/60" />

    return (
        <div className="flex items-start gap-3 text-sm">
            <div className="pt-0.5">{icon}</div>
            <span className={cn("text-muted-foreground", state === "yes" && "text-foreground")}>
                {label}{state === "soon" ? " (segera)" : ""}
            </span>
        </div>
    )
}

function PricingCard({ plan, isYearly }: { plan: Plan; isYearly: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn(
                "relative flex h-full flex-col rounded-[32px] border border-border/60 bg-card p-6 md:p-7 shadow-lg",
                plan.highlight && "ring-1 ring-primary/30 shadow-2xl shadow-primary/10"
            )}
        >
            {plan.highlight && (
                <div className="absolute -top-3 left-6">
                    <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                        {plan.highlight}
                    </Badge>
                </div>
            )}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Heading as="h4" className="text-2xl font-black tracking-tight">{plan.name}</Heading>
                    <Text variant="muted" className="text-sm">{plan.description}</Text>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                    Per Organisasi
                </Badge>
            </div>

            <div className="mt-6">
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black tracking-tight text-foreground">
                        {isYearly ? plan.yearly : plan.monthly}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                        / {isYearly ? "tahun" : "bulan"}
                    </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    {isYearly ? "Hemat 20% untuk kontrak tahunan." : "Bayar bulanan, cancel kapan saja."}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-muted/40 p-3 text-center">
                {plan.limits.map((limit) => (
                    <div key={limit.label} className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {limit.label}
                        </span>
                        <span className="text-sm font-black text-foreground">
                            {limit.value}
                        </span>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                    <FeatureItem key={feature.label} {...feature} />
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                <span>Support: {plan.support}</span>
            </div>

            <Button
                className={cn(
                    "mt-6 w-full rounded-2xl font-bold",
                    plan.highlight ? "bg-primary text-primary-foreground" : "bg-foreground text-background"
                )}
            >
                {plan.ctaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </motion.div>
    )
}

function DataTable({
    headers,
    rows,
    compact,
}: {
    headers: string[]
    rows: { [key: string]: string }[]
    compact?: boolean
}) {
    return (
        <div className={cn("rounded-3xl border border-border/60 bg-background/60", compact && "rounded-2xl")}>
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map((header) => (
                            <TableHead key={header} className="text-xs font-semibold uppercase tracking-widest">
                                {header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((row, index) => (
                        <TableRow key={index}>
                            {headers.map((header) => (
                                <TableCell key={`${header}-${index}`} className={cn("text-sm", compact && "py-3")}>
                                    {row[header]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

export function Pricing() {
    return (
        <SectionClient id="pricing" className="relative overflow-hidden bg-background">
            <div className="max-w-4xl text-left space-y-6">
                <Text variant="overline">Pricing & Subscription Plans</Text>
                <Heading as="h2" className="text-[clamp(2rem,4vw,3.5rem)] leading-[1.1] tracking-tight">
                    Satu harga untuk semua cabang. <br />
                    <span className="text-muted-foreground">Tanpa biaya tersembunyi.</span>
                </Heading>
                <Text variant="lead" className="max-w-3xl">
                    Harga berlaku untuk semua vertical. Fitur spesifik tiap vertical dijelaskan di bagian bawah.
                </Text>
            </div>

            <Tabs defaultValue="monthly" className="mt-10">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <TabsList className="bg-muted/60">
                        <TabsTrigger value="monthly">Bulanan</TabsTrigger>
                        <TabsTrigger value="yearly">Tahunan (Hemat 20%)</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-3 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-xs text-muted-foreground">
                        <BadgePercent className="h-4 w-4 text-emerald-500" />
                        Diskon tahunan berlaku otomatis di checkout
                    </div>
                </div>

                <TabsContent value="monthly" className="mt-8">
                    <div className="grid items-stretch gap-6 lg:grid-cols-4">
                        {plans.map((plan) => (
                            <PricingCard key={plan.name} plan={plan} isYearly={false} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="yearly" className="mt-8">
                    <div className="grid items-stretch gap-6 lg:grid-cols-4">
                        {plans.map((plan) => (
                            <PricingCard key={plan.name} plan={plan} isYearly />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <Card className="rounded-[28px] border-border/60 bg-background/80">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Pricing Philosophy</CardTitle>
                        <CardDescription>Kenapa Beres selalu transparan dan adil.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pricingPhilosophy.map((item) => (
                            <div key={item} className="flex items-start gap-3 text-sm">
                                <Check className="h-4 w-4 text-primary mt-0.5" />
                                <span className="text-muted-foreground">{item}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-[28px] border-border/60 bg-background/80">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Free Trial & Promo Launch</CardTitle>
                        <CardDescription>Mulai tanpa risiko, dapatkan manfaat ekstra.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
                            14 hari gratis, tanpa kartu kredit, akses penuh fitur Professional.
                        </div>
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
                            50 pelanggan pertama: diskon 50% untuk 3 bulan pertama + badge early adopter.
                        </div>
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
                            Referral: referrer 1 bulan gratis, referee diskon 20% bulan pertama.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-3">
                <Card className="rounded-[28px] border-border/60 bg-background/80">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Vertical Tersedia</CardTitle>
                        <CardDescription>Modul yang sudah bisa dipakai sekarang.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {liveVerticals.map((item) => (
                            <div key={item.name} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold">{item.name}</div>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                        {item.status}
                                    </Badge>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">{item.tagline}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="rounded-[28px] border-border/60 bg-background/80 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Wave 1 - Coming Soon (Q3 2026)</CardTitle>
                        <CardDescription>Modul dengan core flow mirip Laundry - development effort minimal.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        {wave1Verticals.map((item) => (
                            <div key={item.name} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="font-semibold">{item.name}</div>
                                <p className="mt-2 text-sm text-muted-foreground">{item.tagline}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6">
                <Card className="rounded-[28px] border-border/60 bg-background/80">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Wave 2 - Coming Soon (Q4 2026 � Q1 2027)</CardTitle>
                        <CardDescription>Modul dengan fitur tambahan signifikan - butuh development khusus.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        {wave2Verticals.map((item) => (
                            <div key={item.name} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="font-semibold">{item.name}</div>
                                <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 space-y-6">
                <div className="flex items-center gap-3">
                    <Heading as="h3" className="text-2xl font-black">Perbandingan Tier</Heading>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest">Overview</Badge>
                </div>
                <DataTable
                    headers={["Fitur", "Solo", "Starter", "Professional", "Enterprise"]}
                    rows={comparisonRows.map((row) => ({
                        Fitur: row.feature,
                        Solo: row.solo,
                        Starter: row.starter,
                        Professional: row.pro,
                        Enterprise: row.ent,
                    }))}
                />
            </div>

            <div className="mt-16 space-y-6">
                <Heading as="h3" className="text-2xl font-black">Fitur Spesifik per Vertical</Heading>
                <Accordion type="single" collapsible className="rounded-[28px] border border-border/60 bg-background/70 px-6">
                    {verticalFeatureGroups.map((group) => (
                        <AccordionItem key={group.id} value={group.id}>
                            <AccordionTrigger className="text-left text-base font-semibold">
                                <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                                    <span>{group.title}</span>
                                    <Badge variant="outline" className="mt-2 md:mt-0 text-[10px] uppercase tracking-widest">
                                        {group.badge}
                                    </Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <DataTable
                                    headers={["Fitur", "Solo", "Starter", "Professional", "Enterprise"]}
                                    rows={group.rows.map((row) => ({
                                        Fitur: row.feature,
                                        Solo: row.solo,
                                        Starter: row.starter,
                                        Professional: row.pro,
                                        Enterprise: row.ent,
                                    }))}
                                    compact
                                />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-2">
                <Card className="rounded-[28px] border-border/60 bg-background/80">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Payment Methods</CardTitle>
                        <CardDescription>Mulai tanpa integrasi rumit, upgrade kapan saja.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5 text-sm text-muted-foreground">
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="flex items-center gap-2 text-foreground font-semibold">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                QR Statis (Solo & ke atas)
                            </div>
                            <ul className="mt-3 space-y-2">
                                <li>Owner upload foto QR bank / GoPay / QRIS di Settings</li>
                                <li>Ditampilkan saat customer checkout</li>
                                <li>Customer transfer ? upload bukti ? kasir approve</li>
                                <li>Zero dependency ke payment gateway, langsung aktif hari pertama</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="flex items-center gap-2 text-foreground font-semibold">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                QR Dinamis via Xendit (Professional & ke atas)
                            </div>
                            <ul className="mt-3 space-y-2">
                                <li>QR di-generate per transaksi, nominal otomatis terisi</li>
                                <li>Tidak perlu customer input nominal sendiri</li>
                                <li>Beres terintegrasi xenPlatform - merchant tidak perlu setup Xendit sendiri</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[28px] border-border/60 bg-background/80">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Tagihan</CardTitle>
                        <CardDescription>Bulanan fleksibel, tahunan lebih hemat.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            Tahunan hemat 20% dan cocok untuk bisnis stabil.
                        </div>
                        <DataTable
                            headers={["Plan", "Bulanan", "Tahunan", "Hemat"]}
                            rows={billingRows.map((row) => ({
                                Plan: row.plan,
                                Bulanan: row.monthly,
                                Tahunan: row.yearly,
                                Hemat: row.saving,
                            }))}
                            compact
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-2">
                <Card className="rounded-[28px] border-border/60 bg-background/80">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Add-ons</CardTitle>
                        <CardDescription>Skalakan tim dan cabang sesuai kebutuhan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            headers={["Add-on", "Harga", "Tersedia untuk"]}
                            rows={addOnRows.map((row) => ({
                                "Add-on": row.addon,
                                Harga: row.price,
                                "Tersedia untuk": row.availability,
                            }))}
                            compact
                        />
                    </CardContent>
                </Card>

                <Card className="rounded-[28px] border-border/60 bg-background/80">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Kebijakan Upgrade / Downgrade</CardTitle>
                        <CardDescription>Kontrol penuh di tangan Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                            Upgrade aktif langsung, tagihan pro-rated.
                        </div>
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                            Downgrade berlaku siklus berikutnya, data tetap aman.
                        </div>
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                            Cancel kapan saja, data bisa di-export, disimpan 30 hari.
                        </div>
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                            Pindah vertical tanpa ganti plan, data lama tetap tersimpan.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 space-y-6">
                <Heading as="h3" className="text-2xl font-black">Analisis Kompetitif</Heading>
                <DataTable
                    headers={["Kompetitor", "Harga", "Beres Equivalent", "Keunggulan Beres"]}
                    rows={competitiveRows.map((row) => ({
                        Kompetitor: row.competitor,
                        Harga: row.price,
                        "Beres Equivalent": row.equivalent,
                        "Keunggulan Beres": row.advantage,
                    }))}
                />
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <Card className="rounded-[28px] border-border/60 bg-background/80 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Rationale Harga</CardTitle>
                        <CardDescription>Kenapa model Beres lebih adil untuk UMKM.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-start gap-3">
                            <Building2 className="h-4 w-4 text-primary mt-0.5" />
                            Per-organisasi memastikan bisnis yang berkembang tidak dihukum oleh harga per cabang.
                        </div>
                        <div className="flex items-start gap-3">
                            <Building2 className="h-4 w-4 text-primary mt-0.5" />
                            Solo Rp 15k sustainable karena infrastruktur serverless menekan cost per-tenant.
                        </div>
                        <div className="flex items-start gap-3">
                            <Building2 className="h-4 w-4 text-primary mt-0.5" />
                            Model flat monthly lebih predictable untuk bisnis volume tinggi dibanding fee per transaksi.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-16 rounded-[32px] border border-border/60 bg-background/80 p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <Heading as="h3" className="text-2xl font-black">
                            Siap mulai tanpa biaya tersembunyi?
                        </Heading>
                        <Text variant="muted">
                            14 hari gratis untuk semua fitur Professional. Data sample sesuai vertical pilihan.
                        </Text>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button className="rounded-2xl bg-primary text-primary-foreground font-bold">
                            Mulai Free Trial
                        </Button>
                        <Button variant="outline" className="rounded-2xl font-bold">
                            Jadwalkan Demo
                        </Button>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
                    <div>Last Updated: Maret 2026</div>
                    <div>Pricing Version: 3.0</div>
                    <div>Next Review: Q3 2026</div>
                </div>
            </div>
        </SectionClient>
    )
}


