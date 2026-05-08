import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { complianceConfig } from "@repo/ui/compliance";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading } from "@repo/ui";
import { generateMetadata as seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Status Pembayaran Billing",
    path: "/billing/status",
    description: "Status transaksi billing demo: pending, paid, failed, dan expired untuk kesiapan review payment gateway.",
    keywords: ["status pembayaran billing", "payment status demo", "pending paid failed expired"],
});

type StatusPageProps = {
    params: Promise<{ reference: string }>;
    searchParams: Promise<{ state?: string; plan?: string }>;
};

const statusMap = {
    pending: {
        label: "Pending",
        icon: Clock3,
        className: "border-amber-300/60 bg-amber-50 text-amber-900",
        desc: "Menunggu penyelesaian dari kanal pembayaran.",
    },
    paid: {
        label: "Paid",
        icon: CheckCircle2,
        className: "border-emerald-300/60 bg-emerald-50 text-emerald-900",
        desc: "Pembayaran berhasil dan billing aktif.",
    },
    failed: {
        label: "Failed",
        icon: XCircle,
        className: "border-rose-300/60 bg-rose-50 text-rose-900",
        desc: "Pembayaran gagal, silakan ulangi metode lain.",
    },
    expired: {
        label: "Expired",
        icon: AlertTriangle,
        className: "border-slate-300/60 bg-slate-100 text-slate-900",
        desc: "Masa berlaku pembayaran habis sebelum diselesaikan.",
    },
} as const;

export default async function BillingStatusPage({ params, searchParams }: StatusPageProps) {
    const { reference } = await params;
    const query = await searchParams;
    const key = (query.state ?? "pending") as keyof typeof statusMap;
    const selected = statusMap[key] ?? statusMap.pending;
    const StatusIcon = selected.icon;

    return (
        <>
            <PageHero
                badgeLabel="Billing Status"
                title="Status Pembayaran"
                subtitle={selected.label}
                description="Halaman status ini menampilkan lifecycle transaksi untuk kebutuhan review operasional dan onboarding payment gateway."
                primaryCta={{ label: "Kembali ke Checkout", href: "/billing/checkout" }}
                secondaryCta={{ label: "Kebijakan Refund", href: "/refund-cancellation" }}
                align="center"
            />

            <Section>
                <div className="mx-auto max-w-3xl space-y-4">
                    <div className={`rounded-2xl border p-6 ${selected.className}`}>
                        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                            <StatusIcon className="h-4 w-4" />
                            {selected.label}
                        </p>
                        <Heading as="h2" className="mt-3 text-2xl">Reference: {reference}</Heading>
                        <p className="mt-2 text-sm">{selected.desc}</p>
                        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                            <p>Plan: {query.plan ?? "Starter"}</p>
                            <p>Mode: Demo (No live charge)</p>
                            <p>Merchant: {complianceConfig.legalEntityName}</p>
                            <p>Domain: {complianceConfig.canonicalDomain}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
                        <Heading as="h3" className="text-lg">Simulasi State Lain</Heading>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button asChild variant="outline" className="rounded-xl">
                                <Link href={`/billing/status/${reference}?state=pending&plan=${encodeURIComponent(query.plan ?? "Starter")}`}>Pending</Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-xl">
                                <Link href={`/billing/status/${reference}?state=paid&plan=${encodeURIComponent(query.plan ?? "Starter")}`}>Paid</Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-xl">
                                <Link href={`/billing/status/${reference}?state=failed&plan=${encodeURIComponent(query.plan ?? "Starter")}`}>Failed</Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-xl">
                                <Link href={`/billing/status/${reference}?state=expired&plan=${encodeURIComponent(query.plan ?? "Starter")}`}>Expired</Link>
                            </Button>
                        </div>
                        <p className="mt-4 text-xs">
                            Butuh bantuan? Hubungi support resmi melalui halaman <Link href="/support" className="text-primary hover:underline">support</Link>.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button asChild className="rounded-xl">
                            <Link href="/billing/checkout">
                                Kembali ke Checkout
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="rounded-xl">
                            <Link href="/terms">Lihat Terms</Link>
                        </Button>
                    </div>
                </div>
            </Section>
        </>
    );
}
