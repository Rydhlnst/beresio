"use client"

import Link from "next/link"
import { ArrowRight, BadgePercent, Check } from "lucide-react"
import { SectionClient } from "./SectionClient"
import { cn } from "@repo/ui/lib/utils"
import { Button, Heading, Text } from "@repo/ui"
import { Badge } from "@repo/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/table"

type PlanFeature = {
    label: string
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
    ctaHref: string
}

type PricingProps = {
    contentClassName?: string
}

const pricingHighlights = [
    "Tanpa biaya setup awal",
    "Upgrade paket kapan saja",
    "Satu langganan untuk seluruh organisasi",
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
            { label: "POS & kasir" },
            { label: "Manajemen produk / layanan" },
            { label: "Laporan harian" },
            { label: "QR statis (upload sendiri)" },
            { label: "Modul dasar sesuai vertical" },
        ],
        support: "Chatbot / FAQ",
        ctaLabel: "Mulai dari Solo",
        ctaHref: "/wishlist",
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
            { label: "Semua fitur Solo" },
            { label: "Akuntansi dasar" },
            { label: "Inventori dasar + low stock alert" },
            { label: "Laporan harian & mingguan" },
            { label: "Manajemen tim (3 user)" },
        ],
        support: "Email (48 jam respons)",
        ctaLabel: "Pilih Starter",
        ctaHref: "/wishlist",
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
            { label: "Semua fitur Starter" },
            { label: "Multi-cabang (hingga 3)" },
            { label: "Akuntansi lengkap" },
            { label: "Inventori penuh + stock transfer" },
            { label: "QR dinamis via Xendit" },
            { label: "API access (5.000 calls/bulan)" },
        ],
        support: "WhatsApp Priority (24 jam respons)",
        ctaLabel: "Ambil Professional",
        ctaHref: "/wishlist",
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
            { label: "Semua fitur Professional" },
            { label: "Gojek/Grab integration" },
            { label: "Customer self-order via QR" },
            { label: "API access unlimited" },
            { label: "Onboarding + account manager" },
            { label: "SLA 99.9% uptime" },
        ],
        support: "24/7 Dedicated + Account Manager",
        ctaLabel: "Hubungi Sales",
        ctaHref: "/sales",
    },
]

const comparisonRows = [
    { feature: "Harga / bulan", solo: "Rp 15k", starter: "Rp 99k", pro: "Rp 249k", ent: "Rp 599k" },
    { feature: "Cabang", solo: "1", starter: "1", pro: "Hingga 3", ent: "Unlimited" },
    { feature: "User", solo: "1", starter: "3", pro: "10", ent: "Unlimited" },
    { feature: "QR dinamis", solo: "-", starter: "-", pro: "Ya", ent: "Ya" },
    { feature: "Multi-cabang", solo: "-", starter: "-", pro: "Ya", ent: "Ya" },
    { feature: "Akuntansi", solo: "-", starter: "Dasar", pro: "Lengkap", ent: "Lengkap" },
    { feature: "Inventori", solo: "-", starter: "Dasar", pro: "Penuh", ent: "Penuh" },
    { feature: "API access", solo: "-", starter: "-", pro: "5k / bulan", ent: "Unlimited" },
    { feature: "Support", solo: "Chatbot", starter: "Email", pro: "WhatsApp", ent: "Dedicated" },
]

function FeatureItem({ label }: PlanFeature) {
    return (
        <div className="flex items-start gap-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 text-brand" />
            <span className="text-muted-foreground">{label}</span>
        </div>
    )
}

function PricingCard({ plan, isYearly }: { plan: Plan; isYearly: boolean }) {
    return (
        <div
            className={cn(
                "relative flex h-full flex-col rounded-[20px] border border-border/70 bg-background p-6 md:p-7",
                plan.highlight && "border-brand/60"
            )}
        >
            {plan.highlight && (
                <div className="absolute -top-3 left-6">
                    <Badge className="rounded-full bg-brand px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-foreground">
                        {plan.highlight}
                    </Badge>
                </div>
            )}

            <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-5">
                <div>
                    <Heading as="h4" className="text-[1.65rem] font-black tracking-tight">
                        {plan.name}
                    </Heading>
                    <Text variant="muted" className="mt-1 text-sm">
                        {plan.description}
                    </Text>
                </div>
                <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-muted/20 text-[10px] uppercase tracking-widest"
                >
                    Per Organisasi
                </Badge>
            </div>

            <div className="mt-5">
                <div className="flex items-end gap-2">
                    <span className="text-[2rem] font-black tracking-tight text-foreground">
                        {isYearly ? plan.yearly : plan.monthly}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                        / {isYearly ? "tahun" : "bulan"}
                    </span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                    {isYearly ? "Hemat 20% untuk kontrak tahunan." : "Bayar bulanan, cancel kapan saja."}
                </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3 text-center">
                {plan.limits.map((limit) => (
                    <div key={limit.label} className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            {limit.label}
                        </span>
                        <span className="text-sm font-black text-foreground">{limit.value}</span>
                    </div>
                ))}
            </div>

            <div className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                    <FeatureItem key={feature.label} {...feature} />
                ))}
            </div>

            <div className="mt-6 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                Support: {plan.support}
            </div>

            <Button
                asChild
                className={cn(
                    "mt-4 h-11 w-full rounded-full font-bold",
                    plan.highlight ? "bg-brand text-brand-foreground hover:bg-brand/90" : "bg-muted text-foreground hover:bg-muted/80"
                )}
            >
                <Link href={plan.ctaHref}>
                    {plan.ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    )
}

function DataTable({
    headers,
    rows,
}: {
    headers: string[]
    rows: { [key: string]: string }[]
}) {
    return (
        <div className="rounded-2xl border border-border/60 bg-background/70">
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
                                <TableCell key={`${header}-${index}`} className="text-sm">
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

export function Pricing({ contentClassName }: PricingProps) {
    return (
        <SectionClient
            id="pricing"
            className="relative overflow-hidden bg-background"
            contentClassName={contentClassName}
        >
            <div className="grid gap-8 border-b border-border/60 pb-10 lg:grid-cols-[1.25fr_1fr] lg:items-end">
                <div className="max-w-4xl space-y-5 text-left">
                    <Text variant="overline">Pricing & Subscription Plans</Text>
                    <Heading as="h2" className="text-[clamp(2.1rem,4.8vw,3.6rem)] leading-[1.05] tracking-tight">
                        Paket Beres untuk setiap tahap pertumbuhan bisnis.
                    </Heading>
                    <Text variant="lead" className="max-w-2xl">
                        Mulai dari operasional harian hingga jaringan multi-cabang, pilih paket yang relevan untuk tim Anda.
                    </Text>
                </div>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-1">
                    {pricingHighlights.map((item) => (
                        <div key={item} className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            <Tabs defaultValue="monthly" className="mt-10">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <TabsList className="h-11 rounded-full border border-border/60 bg-muted/35 p-1">
                        <TabsTrigger
                            value="monthly"
                            className="rounded-full px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            Bulanan
                        </TabsTrigger>
                        <TabsTrigger
                            value="yearly"
                            className="rounded-full px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            Tahunan (Hemat 20%)
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-3 rounded-full border border-border/60 bg-background px-4 py-2 text-xs text-muted-foreground">
                        <BadgePercent className="h-4 w-4 text-emerald-500" />
                        Diskon tahunan berlaku otomatis di checkout
                    </div>
                </div>

                <TabsContent value="monthly" className="mt-8">
                    <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {plans.map((plan) => (
                            <PricingCard key={plan.name} plan={plan} isYearly={false} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="yearly" className="mt-8">
                    <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {plans.map((plan) => (
                            <PricingCard key={plan.name} plan={plan} isYearly />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="mt-14 space-y-5">
                <div className="flex items-center gap-3">
                    <Heading as="h3" className="text-2xl font-black">
                        Perbandingan Paket Ringkas
                    </Heading>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                        Inti
                    </Badge>
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

            <div className="mt-14 rounded-[20px] border border-border/60 bg-background p-6 md:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <Heading as="h3" className="text-2xl font-black">
                            Siap mulai tanpa biaya tersembunyi?
                        </Heading>
                        <Text variant="muted">
                            Coba 14 hari gratis untuk mengevaluasi kecocokan paket dengan operasional bisnis Anda.
                        </Text>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button className="rounded-full bg-brand text-brand-foreground font-bold" asChild>
                            <Link href="/wishlist">Mulai Free Trial</Link>
                        </Button>
                        <Button variant="outline" className="rounded-full font-bold" asChild>
                            <Link href="/demo">Jadwalkan Demo</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </SectionClient>
    )
}