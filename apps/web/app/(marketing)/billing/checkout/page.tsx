import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import { complianceConfig, buildMailtoUrl, buildWhatsAppUrl } from "@repo/ui/compliance";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading } from "@repo/ui";
import { generateMetadata as seoMetadata } from "@/lib/seo";

export const metadata: Metadata = seoMetadata({
    title: "Checkout Billing (Demo Mode)",
    path: "/billing/checkout",
    description:
        "Flow checkout billing Beres Cloud untuk evaluasi onboarding payment gateway. Ditampilkan dalam demo mode tanpa charge live.",
    keywords: ["checkout saas demo", "billing beres cloud", "payment onboarding readiness"],
});

type CheckoutPageProps = {
    searchParams: Promise<{
        plan?: string;
    }>;
};

type PlanKey = "solo" | "starter" | "professional" | "enterprise";
type PlanDefinition = { label: string; amount: string };

const plans: Record<PlanKey, PlanDefinition> = {
    solo: { label: "Solo", amount: "Rp 15.000 / bulan" },
    starter: { label: "Starter", amount: "Rp 99.000 / bulan" },
    professional: { label: "Professional", amount: "Rp 249.000 / bulan" },
    enterprise: { label: "Enterprise", amount: "Rp 599.000 / bulan" },
};

export default async function BillingCheckoutPage({ searchParams }: CheckoutPageProps) {
    const { plan } = await searchParams;
    const normalizedPlan = (plan ?? "").toLowerCase();
    const selectedPlan =
        (Object.prototype.hasOwnProperty.call(plans, normalizedPlan) ? plans[normalizedPlan as PlanKey] : undefined) ??
        plans.starter;
    const statusUrl = `/billing/status/INV-DEMO-240415?state=pending&plan=${encodeURIComponent(selectedPlan.label)}`;

    return (
        <>
            <PageHero
                badgeLabel="Checkout Billing"
                title="Checkout Demo"
                subtitle="(Tanpa Charge Live)"
                description="Halaman ini untuk menunjukkan alur billing yang lengkap saat proses review Midtrans/Xendit. Tidak ada penagihan live pada mode ini."
                primaryCta={{ label: "Lihat Status Pending", href: statusUrl }}
                secondaryCta={{ label: "Kebijakan Refund", href: "/refund-cancellation" }}
                align="center"
            />

            <Section>
                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-2xl border border-border/60 bg-background p-6">
                        <Heading as="h2">Ringkasan Order Billing</Heading>
                        <div className="mt-5 grid gap-3 text-sm">
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                                <span>Produk</span>
                                <span className="font-semibold text-foreground">{complianceConfig.brandName} Subscription</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                                <span>Paket</span>
                                <span className="font-semibold text-foreground">{selectedPlan.label}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                                <span>Nominal</span>
                                <span className="font-semibold text-foreground">{selectedPlan.amount}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                                <span>Merchant of record</span>
                                <span className="font-semibold text-foreground">{complianceConfig.legalEntityName}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                                <span>Flow mode</span>
                                <span className="font-semibold text-foreground">Sandbox / Demo UI</span>
                            </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-xs text-amber-900">
                            <p className="font-semibold">Compliance Notice</p>
                            <p className="mt-1">
                                UI ini tidak mengumpulkan data kartu secara custom. Integrasi live wajib menggunakan komponen hosted dari gateway resmi.
                            </p>
                        </div>
                        <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
                            Dengan melanjutkan pembayaran live (saat aktivasi production), merchant menyetujui
                            {" "}
                            <Link href="/terms" className="font-semibold text-primary hover:underline">Syarat & Ketentuan</Link>,
                            {" "}
                            <Link href="/privacy" className="font-semibold text-primary hover:underline">Kebijakan Privasi</Link>, dan
                            {" "}
                            <Link href="/refund-cancellation" className="font-semibold text-primary hover:underline">Kebijakan Refund/Pembatalan</Link>.
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <Button asChild className="rounded-xl">
                                <Link href={statusUrl}>
                                    Simulasikan Status Pending
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="rounded-xl">
                                <Link href="/billing/status/INV-DEMO-240415?state=paid&plan=Professional">
                                    Simulasikan Status Paid
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div id="provider-mapping" className="rounded-2xl border border-border/60 bg-background p-6">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <Heading as="h3" className="text-lg">Provider Routing</Heading>
                            </div>
                            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                                {complianceConfig.providerMapping.map((mapping) => (
                                    <li key={mapping.provider} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                                        <p className="font-semibold text-foreground">{mapping.provider}</p>
                                        <p className="mt-1">{mapping.role}</p>
                                        <p className="mt-1 text-xs">State: {mapping.connectionState}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background p-6 text-sm text-muted-foreground">
                            <p className="inline-flex items-center gap-2 text-foreground font-semibold">
                                <BadgeCheck className="h-4 w-4 text-primary" />
                                Bantuan & Escalation
                            </p>
                            <ul className="mt-3 list-disc space-y-2 pl-5">
                                <li>Support: {complianceConfig.supportEmail}</li>
                                <li>Pengaduan: {complianceConfig.complaintChannel}</li>
                                <li>Jam layanan: {complianceConfig.businessHours}</li>
                            </ul>
                            <div className="mt-4 flex flex-col gap-2">
                                <Link href={buildWhatsAppUrl(complianceConfig.supportWhatsApp)} className="text-primary hover:underline">
                                    WhatsApp Support
                                </Link>
                                <Link href={buildMailtoUrl(complianceConfig.supportEmail, "Pertanyaan Billing Beres Cloud")} className="text-primary hover:underline">
                                    Kirim Email Billing
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </>
    );
}
