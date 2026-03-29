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
import { SectionClient } from "./SectionClient"

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
        <SectionClient id="calculator" className="relative overflow-hidden bg-background">
            {/* Background decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Header - align start */}
            <div className="max-w-3xl mb-[clamp(2rem,5vw,4rem)] text-left relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary mb-4">
                        Kalkulator ROI Beres.io
                    </span>
                    <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-black tracking-tight leading-[1.1] text-foreground mb-4">
                        Hitung Potensi Efisiensi
                    </h2>
                    <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl">
                        Pilih fitur yang Anda butuhkan dan tentukan skala tim Anda untuk melihat seberapa banyak waktu dan biaya yang dapat dihemat setiap tahun.
                    </p>
                </motion.div>
            </div>

            {/* Calculator Card */}
            <div className="bg-muted/5 border border-border/40 backdrop-blur-sm rounded-3xl p-6 md:p-10 lg:p-12 shadow-xl shadow-primary/5 space-y-10 transition-all duration-300 relative z-10">
                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                    {FEATURES.map((feature) => {
                        const isSelected = selectedFeatures.includes(feature.id)
                        return (
                            <button
                                key={feature.id}
                                onClick={() => toggleFeature(feature.id)}
                                className="flex items-center gap-3 text-left group transition-all"
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-md border transition-all flex items-center justify-center flex-shrink-0",
                                    isSelected
                                        ? "bg-primary border-primary shadow-md shadow-primary/20"
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
                                <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                        "text-sm font-semibold tracking-tight transition-colors truncate",
                                        isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        {feature.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground/60">
                                        {formatCurrency(feature.savingPerUser)}/tim
                                    </span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Results Section */}
                <div className="bg-muted/20 border border-border/40 rounded-3xl p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {/* Team Size */}
                    <div className="space-y-3 sm:border-r sm:border-border/20 sm:pr-8">
                        <label htmlFor="team-size" className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                            Team Size
                        </label>
                        <div className="flex items-center gap-3 bg-background border border-border/60 rounded-2xl p-3 shadow-sm w-full max-w-[200px] group transition-all hover:border-primary/40">
                            <input
                                id="team-size"
                                aria-label="Team size"
                                type="number"
                                value={teamSize}
                                onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-transparent border-none focus:ring-0 text-2xl font-black p-0 tracking-tighter text-foreground"
                            />
                            <div className="flex flex-col border-l border-border/60 pl-3">
                                <button
                                    onClick={() => setTeamSize(prev => prev + 1)}
                                    aria-label="Increase team size"
                                    className="p-1 hover:text-primary transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setTeamSize(prev => Math.max(1, prev - 1))}
                                    aria-label="Decrease team size"
                                    className="p-1 hover:text-primary transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Savings */}
                    <div className="space-y-3 sm:border-r sm:border-border/20 sm:pr-8">
                        <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                            Monthly Savings
                        </label>
                        <div className="text-[clamp(1.25rem,3vw,2rem)] font-black tracking-tighter text-foreground tabular-nums">
                            {formatCurrency(monthlySavings)}
                        </div>
                    </div>

                    {/* Annual Savings */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                            Annual Savings
                        </label>
                        <div className="text-[clamp(1.5rem,4vw,2.5rem)] font-black tracking-tighter text-primary tabular-nums">
                            {formatCurrency(monthlySavings * 12)}
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA - align start */}
            <div className="mt-12 flex flex-col items-start gap-4 relative z-10">
                <Button 
                    size="lg" 
                    className="rounded-full px-10 h-14 font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300" 
                    asChild
                >
                    <a href="/wishlist">
                        Amankan Posisi Wishlist Anda
                        <ArrowRight className="ml-3 h-5 w-5" />
                    </a>
                </Button>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Estimasi berdasarkan data efisiensi operasional 1000+ mitra bisnis.
                </p>
            </div>
        </SectionClient>
    )
}
