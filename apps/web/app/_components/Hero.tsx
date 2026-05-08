import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, Heading, Text } from "@repo/ui";
import { Section } from "./Section";
import { HeroDashboardLazy } from "./HeroDashboardLazy";

// â”€â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function Hero() {
    return (
        <Section id="hero" showDivider={false} className="relative overflow-hidden bg-background pb-[clamp(4rem,8vw,8rem)]">
            {/* â”€â”€ TOP SECTION: Text & CTA (server-renderable, penting untuk LCP) â”€â”€ */}
            <div className="flex flex-col items-start pb-[clamp(2rem,5vw,4rem)] relative">
                <div className="max-w-4xl space-y-8">
                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/20 bg-brand/5 text-brand text-[11px] font-extrabold uppercase tracking-widest animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                        </span>
                        Sempurnakan Bisnis Anda - Segera Hadir
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-6">
                        <Heading
                            as="h1"
                            className="text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[0.9] tracking-tighter text-foreground text-left"
                        >
                            Kelola Bisnis <br />
                            <span className="text-brand">Tanpa Batas</span> Dengan <br />
                            Satu Platform.
                        </Heading>
                        <Text variant="lead" align="left">
                            Beres Cloud menghadirkan solusi kasir, inventori, dan laporan keuangan dalam satu genggaman.
                            Efisien, transparan, dan siap membantu bisnis Anda naik kelas.
                        </Text>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center gap-4 pt-4">
                        <Button
                            size="lg"
                            className="rounded-2xl px-10 h-14 font-extrabold text-base bg-brand text-brand-foreground hover:scale-105 transition-all shadow-xl shadow-brand/20"
                            asChild
                        >
                            <Link href="/wishlist">
                                Gabung Antrean Prioritas
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-2xl px-8 h-14 font-bold text-base bg-background/50 backdrop-blur-sm border-border hover:bg-muted/50 transition-all"
                        >
                            <Link href="/demo">Lihat Demo</Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* â”€â”€ LAZY LOADED: Dashboard Mockup + Social Proof â”€â”€ */}
            <HeroDashboardLazy />
        </Section>
    );
}

