"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    Minus,
    ArrowRight,
    Check
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/button"
import { Heading, Text } from "@repo/ui"
import { Section } from "./Section"

const FEATURES = [
    { id: "pos", name: "Point of Sale (POS)", savingPerUser: 50000 },
    { id: "inventory", name: "Inventory Management", savingPerUser: 120000 },
    { id: "reports", name: "Financial Reports", savingPerUser: 80000 },
    { id: "staff", name: "Attendance & Scheduling", savingPerUser: 70000 },
    { id: "crm", name: "Customer Management (CRM)", savingPerUser: 90000 },
    { id: "procurement", name: "Digital Procurement", savingPerUser: 100000 },
    { id: "hr", name: "HR & Payroll Automations", savingPerUser: 110000 },
    { id: "online", name: "Online Store Integration", savingPerUser: 85000 },
    { id: "accounting", name: "Auto-Accounting", savingPerUser: 150000 },
]

export function SavingsCalculator() {
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(["pos", "inventory", "reports"])
    const [teamSize, setTeamSize] = useState(10)
    const [monthlySavings, setMonthlySavings] = useState(0)

    useEffect(() => {
        const rate = FEATURES
            .filter(f => selectedFeatures.includes(f.id))
            .reduce((acc, curr) => acc + curr.savingPerUser, 0)

        setMonthlySavings(rate * teamSize)
    }, [selectedFeatures, teamSize])

    const toggleFeature = (id: string) => {
        setSelectedFeatures(prev =>
            prev.includes(id)
                ? prev.filter(f => f !== id)
                : [...prev, id]
        )
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(val)
    }

    return (
        <Section id="calculator" className="relative overflow-hidden bg-background py-24">
            {/* Background decorative elements matching WhyChooseUs */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header matching WhyChooseUs standards */}
            <div className="max-w-3xl mb-16 text-start relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <Text variant="overline" className="mb-6">
                        Kalkulator ROI Beres.io
                    </Text>
                    <Heading as="h3" className="mb-6 text-foreground">
                        Hitung Potensi Efisiensi<br />
                        <span className="text-primary-foreground/90 text-sm font-medium">Berapapun penghematanmu, pastikan operasionalmu sudah Beres.</span>
                    </Heading>
                    <Text variant="lead">
                        Pilih fitur yang Anda butuhkan dan tentukan skala tim Anda untuk melihat seberapa banyak waktu dan biaya yang dapat dihemat setiap tahun.
                    </Text>
                </motion.div>
            </div>

            <div className="bg-muted/5 border border-border/40 backdrop-blur-sm rounded-[32px] p-8 md:p-12 shadow-2xl shadow-primary/5 space-y-12 transition-all duration-300">
                {/* Top: Checkbox Grid (Notion Layout) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-6">
                    {FEATURES.map((feature) => {
                        const isSelected = selectedFeatures.includes(feature.id)
                        return (
                            <button
                                key={feature.id}
                                onClick={() => toggleFeature(feature.id)}
                                className="flex items-center gap-4 text-left group transition-all"
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-md border transition-all flex items-center justify-center",
                                    isSelected
                                        ? "bg-primary border-primary shadow-lg shadow-primary/20"
                                        : "bg-background border-border group-hover:border-primary/50"
                                )}>
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                            >
                                                <Check className="w-3.5 h-3.5 text-primary-foreground stroke-[3]" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="flex flex-col">
                                    <span className={cn(
                                        "text-sm font-bold tracking-tight transition-colors",
                                        isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {feature.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground/60 italic font-medium">
                                        {formatCurrency(feature.savingPerUser)}/tim
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Bottom Result Banner (Notion Style with project colors) */}
                <div className="bg-muted/20 border border-border/40 rounded-[32px] p-6 md:p-8 lg:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 items-start lg:items-center">
                    {/* Team Size */}
                    <div className="space-y-4 sm:col-span-2 lg:col-span-1 border-b sm:border-b-0 sm:border-r border-border/20 md:border-border/40 pb-6 sm:pb-0 sm:pr-8 lg:border-r-0 lg:pr-0">
                        <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Team Size</label>
                        <div className="flex items-center gap-4 bg-background border border-border/60 rounded-2xl p-4 shadow-sm w-full max-w-[220px] group transition-all hover:border-primary/40">
                            <input
                                type="number"
                                value={teamSize}
                                onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-transparent border-none focus:ring-0 text-3xl font-black p-0 tracking-tighter text-foreground"
                            />
                            <div className="flex flex-col border-l border-border/60 pl-3">
                                <button
                                    onClick={() => setTeamSize(prev => prev + 1)}
                                    className="p-1 hover:text-primary transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setTeamSize(prev => Math.max(1, prev - 1))}
                                    className="p-1 hover:text-primary transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Savings */}
                    <div className="space-y-4 border-b border-border/20 md:border-border/40 pb-6 sm:pb-0 sm:border-b-0">
                        <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Monthly Savings</label>
                        <div className="text-2xl sm:text-3xl md:text-2xl lg:text-3xl xl:text-4xl font-black tracking-tighter text-foreground tabular-nums break-words">
                            {formatCurrency(monthlySavings)}
                        </div>
                    </div>

                    {/* Annual Savings */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Annual Savings</label>
                        <div className="text-3xl sm:text-4xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tighter text-primary drop-shadow-sm tabular-nums break-words">
                            {formatCurrency(monthlySavings * 12)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16 flex flex-col items-center gap-6">
                <Button size="lg" className="rounded-2xl px-14 h-16 font-extrabold text-lg bg-primary text-primary-foreground hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300" asChild>
                    <a href="/daftar">
                        Coba Beres.io Sekarang
                        <ArrowRight className="ml-3 h-5 w-5" />
                    </a>
                </Button>
                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Estimasi berdasarkan data efisiensi operasional 1000+ mitra bisnis.
                </p>
            </div>
        </Section>
    )
}
