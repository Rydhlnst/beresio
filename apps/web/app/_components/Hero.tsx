"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button, Heading, Text } from "@repo/ui";
import { Section } from "./Section";

// ── Lazy load bagian berat: DashboardMockup + SocialProof + Counter
// ssr: false → tidak dirender di server, dikurangi dari JS critical path
// Skeleton sederhana ditampilkan selama komponen loading
const HeroDashboard = dynamic(
    () => import("./HeroDashboard").then((m) => m.HeroDashboard),
    {
        ssr: false,
        loading: () => (
            <div className="w-full relative py-12 animate-pulse">
                <div className="mx-auto max-w-7xl rounded-[2rem] rounded-b-none bg-muted/50 border border-border/50 h-[clamp(280px,40vw,560px)]" />
            </div>
        ),
    }
);

// ─── HERO ─────────────────────────────────────────────────────────────────────

export function Hero() {
    return (
        <Section id="hero" showDivider={false} className="relative overflow-hidden bg-background pb-[clamp(4rem,8vw,8rem)]">
            {/* ── TOP SECTION: Text & CTA (server-renderable, penting untuk LCP) ── */}
            <div className="flex flex-col items-start pb-[clamp(2rem,5vw,4rem)] relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl space-y-8"
                >
                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-extrabold uppercase tracking-widest animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
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
                            <span className="text-primary">Tanpa Batas</span> Dengan <br />
                            Satu Platform.
                        </Heading>
                        <Text variant="lead" align="left">
                            Beres.io menghadirkan solusi kasir, inventori, dan laporan keuangan dalam satu genggaman.
                            Efisien, transparan, dan siap membantu bisnis Anda naik kelas.
                        </Text>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center gap-4 pt-4">
                        <Button
                            size="lg"
                            className="rounded-2xl px-10 h-14 font-extrabold text-base bg-primary text-primary-foreground hover:scale-105 transition-all shadow-xl shadow-primary/20"
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
                </motion.div>
            </div>

            {/* ── LAZY LOADED: Dashboard Mockup + Social Proof ── */}
            <HeroDashboard />
        </Section>
    );
}