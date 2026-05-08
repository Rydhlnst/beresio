import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, ShieldCheck, Sparkles } from "lucide-react";
import { complianceConfig, buildMailtoUrl, buildWhatsAppUrl } from "@repo/ui/compliance";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { generateMetadata as seoMetadata } from "@/lib/seo";
import { BetaApplicationForm } from "./_components/beta-application-form";
import { createDbNextjs } from "@beresio/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cookies } from "next/headers";

export const metadata: Metadata = seoMetadata({
    title: "Waitlist Beta Tester",
    path: "/wishlist",
    description:
        "Daftar sebagai beta tester Beres Cloud. Tim akan review kebutuhan bisnis Anda untuk menentukan prioritas early access.",
    keywords: ["waitlist beres cloud", "beta tester umkm", "early access pos erp", "daftar beta beres cloud"],
});

const benefits = [
    {
        title: "Early Access Terarah",
        description: "Akses fitur lebih awal berdasarkan kebutuhan operasional bisnis Anda.",
        icon: Sparkles,
    },
    {
        title: "Onboarding Lebih Cepat",
        description: "Kami prioritasin bisnis yang siap testing dan feedback agar iterasi lebih cepat.",
        icon: ShieldCheck,
    },
    {
        title: "Sesi Demo (Opsional)",
        description: "Jika cocok, tim akan jadwalkan demo singkat untuk mapping flow operasional.",
        icon: Calendar,
    },
];

export default function WishlistPage() {
    const onboardingWhatsappUrl = buildWhatsAppUrl(
        complianceConfig.supportWhatsApp,
        "Halo tim Beres Cloud, saya ingin daftar akses prioritas onboarding."
    );

    return (
        <>
            <PageHero
                badgeLabel="Pre-release"
                title="Waitlist Beta Tester"
                subtitle="Beres Cloud"
                description="Daftar sebagai beta tester untuk dapat akses lebih awal. Tim akan review kebutuhan bisnis Anda dan menghubungi jika cocok."
                primaryCta={{ label: "Isi Form Beta", href: "#beta-form" }}
                secondaryCta={{ label: "Chat WhatsApp", href: onboardingWhatsappUrl }}
                align="center"
            />

            <Section>
                <div className="grid gap-6 md:grid-cols-3">
                    {benefits.map((benefit) => (
                        <Card key={benefit.title} className="border-border/60">
                            <CardHeader className="space-y-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10">
                                    <benefit.icon className="h-5 w-5 text-brand" />
                                </div>
                                <CardTitle className="text-base">{benefit.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Text variant="muted">{benefit.description}</Text>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </Section>

            <Section>
                <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
                    <div id="beta-form" className="rounded-2xl border border-border/60 bg-background p-6 scroll-mt-24 max-h-[640px] overflow-y-auto">
                        <Heading as="h2">Daftar Beta Tester</Heading>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Beres Cloud masih tahap pre-release. Isi form ini agar tim bisa menilai kecocokan dan menentukan prioritas early access.
                        </p>
                        <div className="mt-6">
                            <WishlistBetaFormWrapper />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background p-6">
                        <Heading as="h2">Butuh Respon Cepat?</Heading>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Jika Anda prefer komunikasi langsung, gunakan kanal resmi berikut.
                        </p>
                        <div className="mt-5 grid gap-3">
                            <Button asChild className="h-11 w-full rounded-xl justify-start">
                                <Link href={onboardingWhatsappUrl} target="_blank" rel="noreferrer">
                                    WhatsApp Onboarding ({complianceConfig.supportWhatsApp})
                                    <ArrowRight className="ml-auto h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-11 w-full rounded-xl justify-start">
                                <Link href={buildMailtoUrl(complianceConfig.supportEmail, "Permintaan Akses Prioritas Beres Cloud")}>
                                    Email Onboarding ({complianceConfig.supportEmail})
                                    <ArrowRight className="ml-auto h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </Section>
        </>
    );
}

async function WishlistBetaFormWrapper() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const session = await auth(db).api.getSession({ headers: await headers() });

    const defaultValues = session
        ? { fullName: session.user.name ?? "", email: session.user.email ?? "" }
        : undefined;

    const sessionEmail = session?.user?.email ? session.user.email.toLowerCase() : null;
    const cookieApplicationId = (await cookies()).get("beta_application_id")?.value ?? null;

    const existing = sessionEmail
        ? await db.query.betaApplications.findFirst({
              where: (table, { eq }) => eq(table.email, sessionEmail),
              columns: { id: true },
          })
        : cookieApplicationId
          ? await db.query.betaApplications.findFirst({
                where: (table, { eq }) => eq(table.id, cookieApplicationId),
                columns: { id: true },
            })
          : null;

    return (
        <BetaApplicationForm defaultValues={defaultValues} existingApplicationId={existing?.id ?? null} />
    );
}
