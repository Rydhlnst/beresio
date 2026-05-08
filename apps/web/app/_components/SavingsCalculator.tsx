"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Check, ArrowRight } from "lucide-react";
import { animate } from "framer-motion";
import { Button, Text } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { SectionClient } from "./SectionClient";

type FeatureOption = {
    id: string;
    name: string;
    monthlyRatePerStaff: number;
};

const FEATURE_OPTIONS: FeatureOption[] = [
    { id: "pos", name: "POS & Checkout", monthlyRatePerStaff: 50000 },
    { id: "inventory", name: "Inventori Otomatis", monthlyRatePerStaff: 85000 },
    { id: "reporting", name: "Laporan Real-time", monthlyRatePerStaff: 65000 },
    { id: "delivery", name: "Pengiriman Terintegrasi", monthlyRatePerStaff: 70000 },
    { id: "crm", name: "CRM & Retensi Pelanggan", monthlyRatePerStaff: 55000 },
    { id: "ops", name: "Workflow Operasional", monthlyRatePerStaff: 60000 },
];

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

type AnimatedNumberProps = {
    value: number;
    className?: string;
    formatter?: (value: number) => string;
};

function AnimatedNumber({ value, className, formatter }: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValueRef = useRef(value);

    useEffect(() => {
        if (previousValueRef.current === value) {
            setDisplayValue(value);
            return;
        }

        const controls = animate(previousValueRef.current, value, {
            duration: 0.35,
            ease: "easeOut",
            onUpdate: (latest) => {
                setDisplayValue(Math.round(latest));
            },
        });

        previousValueRef.current = value;

        return () => controls.stop();
    }, [value]);

    return (
        <span className={className}>
            {formatter ? formatter(displayValue) : displayValue.toLocaleString("id-ID")}
        </span>
    );
}

export function SavingsCalculator() {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
        "pos",
        "inventory",
        "reporting",
    ]);
    const [teamSize, setTeamSize] = useState(8);

    const monthlySavings = useMemo(() => {
        const totalRate = FEATURE_OPTIONS.filter((feature) =>
            selectedFeatures.includes(feature.id)
        ).reduce((acc, feature) => acc + feature.monthlyRatePerStaff, 0);
        return totalRate * teamSize;
    }, [selectedFeatures, teamSize]);

    const annualSavings = monthlySavings * 12;

    const toggleFeature = (id: string) => {
        setSelectedFeatures((previous) =>
            previous.includes(id)
                ? previous.filter((item) => item !== id)
                : [...previous, id]
        );
    };

    return (
        <SectionClient id="savings-calculator" className="border-b border-border/60 bg-background">
            <div className="w-full">
                <div className="max-w-3xl">
                    <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Savings Calculator
                    </Text>
                    <h2 className="mt-3 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5vw,3rem)] leading-tight tracking-tight text-foreground">
                        Simulasikan potensi efisiensi operasional bisnis Anda
                    </h2>
                    <Text variant="lead" className="mt-4 text-muted-foreground">
                        Pilih modul yang akan dipakai dan sesuaikan ukuran tim. Estimasi ini membantu Anda melihat dampak langsung Beres Cloud terhadap biaya operasional.
                    </Text>
                </div>

                <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="border border-border/70 bg-background p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Pilih modul
                        </p>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {FEATURE_OPTIONS.map((feature) => {
                                const active = selectedFeatures.includes(feature.id);
                                return (
                                    <button
                                        key={feature.id}
                                        type="button"
                                        onClick={() => toggleFeature(feature.id)}
                                        className={cn(
                                            "flex items-start gap-3 border px-3 py-3 text-left transition-colors",
                                            active
                                                ? "border-primary/50 bg-primary/10"
                                                : "border-border/70 bg-background hover:bg-secondary/60"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                                                active
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background"
                                            )}
                                        >
                                            {active && <Check className="h-3 w-3" />}
                                        </span>
                                        <span className="space-y-1">
                                            <span className="block text-sm font-medium text-foreground">
                                                {feature.name}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {formatCurrency(feature.monthlyRatePerStaff)} / staff / bulan
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="border border-border/70 bg-secondary/40 p-5 sm:p-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Hasil simulasi
                        </p>

                        <div className="mt-4 border border-border/70 bg-background p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-foreground">Ukuran Tim</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        aria-label="Kurangi ukuran tim"
                                        onClick={() => setTeamSize((prev) => Math.max(1, prev - 1))}
                                        className="flex h-8 w-8 items-center justify-center border border-border/70 bg-background hover:bg-secondary"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <AnimatedNumber
                                        value={teamSize}
                                        className="min-w-[56px] text-center text-[1.75rem] font-semibold text-foreground"
                                    />
                                    <button
                                        type="button"
                                        aria-label="Tambah ukuran tim"
                                        onClick={() => setTeamSize((prev) => prev + 1)}
                                        className="flex h-8 w-8 items-center justify-center border border-border/70 bg-background hover:bg-secondary"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3 border border-border/70 bg-background p-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                    Estimasi hemat per bulan
                                </p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                                    <AnimatedNumber value={monthlySavings} formatter={formatCurrency} />
                                </p>
                            </div>
                            <div className="border-t border-border/70 pt-3">
                                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                    Estimasi hemat per tahun
                                </p>
                                <p className="mt-1 text-3xl font-semibold tracking-tight text-primary">
                                    <AnimatedNumber value={annualSavings} formatter={formatCurrency} />
                                </p>
                            </div>
                        </div>

                        <div className="mt-5">
                            <Button className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                                <Link href="/demo">
                                    Diskusikan Simulasi Ini
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Estimasi berdasarkan pola efisiensi operasional merchant Beres Cloud.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </SectionClient>
    );
}
