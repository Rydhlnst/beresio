"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
    ArrowRight,
    Boxes,
    Building2,
    ChartNoAxesCombined,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    PackagePlus,
    Rocket,
    Settings2,
    Store,
    UserPlus,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Progress } from "@repo/ui/progress";
import { Separator } from "@repo/ui/separator";
import { cn } from "@repo/ui/lib/utils";
import { APP_CONTENT_WIDTH } from "./layout-width";

type WorkflowStep = {
    id: string;
    title: string;
    description: string;
    output: string;
    icon: LucideIcon;
};

const WORKFLOW_STEPS: WorkflowStep[] = [
    {
        id: "01",
        title: "Buat Akun",
        description: "Daftarkan akun pemilik dan aktifkan akses tim inti dalam satu alur penyiapan.",
        output: "Akses awal siap dipakai",
        icon: UserPlus,
    },
    {
        id: "02",
        title: "Buat Bisnis",
        description: "Isi profil usaha, struktur cabang, dan standar operasional awal untuk fondasi yang rapi.",
        output: "Struktur bisnis tervalidasi",
        icon: Building2,
    },
    {
        id: "03",
        title: "Tambah Produk",
        description: "Input katalog, harga, varian, dan stok agar transaksi dan inventori langsung sinkron.",
        output: "Katalog dan stok terhubung",
        icon: PackagePlus,
    },
    {
        id: "04",
        title: "Konfigurasi Operasional",
        description: "Atur POS, alur pesanan, kontrol cabang, dan peran tim agar semua proses berjalan seragam.",
        output: "Alur operasional terkunci",
        icon: Settings2,
    },
    {
        id: "05",
        title: "Luncurkan Bisnis",
        description: "Mulai transaksi langsung dengan dasbor finansial dan operasional real-time untuk pemilik.",
        output: "Bisnis siap berkembang",
        icon: Rocket,
    },
];

const READINESS_ITEMS = [
    {
        icon: Store,
        title: "Pengaturan Bisnis",
        description: "Profil usaha, cabang, dan struktur tim aktif.",
    },
    {
        icon: Boxes,
        title: "Produk & Inventori",
        description: "Produk, harga, dan stok sinkron lintas outlet.",
    },
    {
        icon: ChartNoAxesCombined,
        title: "Visibilitas Operasional & Finansial",
        description: "POS, laporan, dan dasbor pemilik berjalan real-time.",
    },
];

const SIMULATION_INTERVAL_MS = 2200;

export function LandingWorkflowSection() {
    const reduceMotion = useReducedMotion();
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [direction, setDirection] = useState<1 | -1>(1);
    const totalSteps = WORKFLOW_STEPS.length;

    if (totalSteps === 0) {
        return null;
    }

    useEffect(() => {
        if (reduceMotion || totalSteps <= 1) {
            return;
        }

        const timer = window.setInterval(() => {
            setDirection(1);
            setActiveStepIndex((prev) => (prev + 1) % totalSteps);
        }, SIMULATION_INTERVAL_MS);

        return () => window.clearInterval(timer);
    }, [reduceMotion, totalSteps]);

    const activeStep = WORKFLOW_STEPS[activeStepIndex]!;
    const activeStepProgress = ((activeStepIndex + 1) / totalSteps) * 100;

    const goToStep = (nextIndex: number) => {
        if (nextIndex === activeStepIndex) {
            return;
        }

        setDirection(nextIndex > activeStepIndex ? 1 : -1);
        setActiveStepIndex(nextIndex);
    };

    const goPrev = () => {
        setDirection(-1);
        setActiveStepIndex((prev) => (prev - 1 + totalSteps) % totalSteps);
    };

    const goNext = () => {
        setDirection(1);
        setActiveStepIndex((prev) => (prev + 1) % totalSteps);
    };

    return (
        <section id="workflow" className="border-b border-border/60 bg-background py-16 sm:py-20">
            <div className={APP_CONTENT_WIDTH}>
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-3xl"
                >
                    <Badge className="rounded-full border border-border bg-muted px-4 py-1.5 text-[11px] font-semibold text-foreground">
                        Alur Beres Cloud
                    </Badge>
                    <h2 className="mt-4 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5vw,3rem)] leading-tight text-foreground">
                        Dari penyiapan sampai peluncuran, Beres menjaga semua proses tetap terhubung.
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Penyiapan tidak berhenti di pembuatan akun. Beres memandu tiap tahap sampai bisnis benar-benar siap jalan dengan sistem operasional yang terstruktur.
                    </p>
                </motion.div>

                <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
                    <Card className="flex h-full flex-col border-border/80 bg-card shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold text-card-foreground">
                                Perjalanan Penyiapan
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Lima langkah inti dari nol sampai siap transaksi.
                            </p>
                        </CardHeader>
                        <CardContent className="flex h-full flex-col gap-4">
                            <div className="rounded-xl border border-border bg-background p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Simulasi Penyiapan
                                    </p>
                                    <span className="text-xs font-semibold text-foreground">
                                        {activeStepIndex + 1}/{totalSteps}
                                    </span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                                    <motion.div
                                        className="h-full rounded-full bg-primary"
                                        animate={{
                                            width: `${activeStepProgress}%`,
                                        }}
                                        transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            <div className="relative min-h-[260px] flex-1 overflow-hidden rounded-xl border border-border bg-background p-4 sm:min-h-[300px] sm:p-5">
                                <AnimatePresence initial={false} mode="wait" custom={direction}>
                                    <motion.article
                                        key={activeStep.id}
                                        custom={direction}
                                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: direction > 0 ? 42 : -42 }}
                                        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? -42 : 42 }}
                                        transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
                                        className="flex h-full flex-col"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                                                <activeStep.icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex h-6 items-center rounded-full border border-border bg-muted px-2 text-[11px] font-semibold text-muted-foreground">
                                                        Langkah {activeStep.id}
                                                    </span>
                                                    <span className="inline-flex h-6 items-center rounded-full border border-primary/25 bg-primary/10 px-2 text-[11px] font-semibold text-primary">
                                                        Berjalan
                                                    </span>
                                                </div>
                                                <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                                                    {activeStep.title}
                                                </h3>
                                                <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                                                    {activeStep.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            <Separator className="mb-4" />
                                            <p className="inline-flex items-center gap-1 text-xs font-medium text-primary sm:text-sm">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {activeStep.output}
                                            </p>
                                        </div>
                                    </motion.article>
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                    {WORKFLOW_STEPS.map((step, index) => {
                                        const isActive = index === activeStepIndex;
                                        return (
                                            <button
                                                key={step.id}
                                                type="button"
                                                onClick={() => goToStep(index)}
                                                aria-label={`Buka langkah ${step.id}: ${step.title}`}
                                                className={cn(
                                                    "h-2.5 rounded-full transition-all",
                                                    isActive ? "w-7 bg-primary" : "w-2.5 bg-muted-foreground/35 hover:bg-muted-foreground/55"
                                                )}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={goPrev}
                                        aria-label="Langkah sebelumnya"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={goNext}
                                        aria-label="Langkah berikutnya"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex h-full flex-col border-border/80 bg-card shadow-sm">
                        <CardHeader className="space-y-3">
                            <CardTitle className="text-lg font-semibold text-card-foreground">
                                Kesiapan Sistem Operasional Bisnis
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Setiap tahap penyiapan langsung membangun sistem inti bisnis Anda.
                            </p>
                            <div className="rounded-lg border border-border bg-muted/50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                                        Cakupan Alur
                                    </span>
                                    <span className="text-sm font-semibold text-foreground">100%</span>
                                </div>
                                <Progress value={100} className="h-2 bg-muted" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {READINESS_ITEMS.map((item, index) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-foreground">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                        </div>
                                        {index < READINESS_ITEMS.length - 1 && <Separator />}
                                    </div>
                                );
                            })}

                            <div className={cn("rounded-xl border border-primary/20 bg-primary/10 p-4")}>
                                <p className="text-sm font-medium text-foreground">
                                    Penyiapan terpandu, bukan dasbor kosong.
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Tim Anda langsung kerja dengan alur yang konsisten sejak hari pertama.
                                </p>
                            </div>

                            <Button className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                                <Link href="/wishlist">
                                    Mulai Penyiapan Beres
                                    <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
