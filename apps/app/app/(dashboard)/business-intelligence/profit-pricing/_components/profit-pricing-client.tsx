"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { AlertCircle, Target, CheckCircle2, Save } from "lucide-react";
import { updateProfitSettingsAction } from "../../_actions/bi-calculations";
import { toast } from "sonner";

export function ProfitPricingClient({ 
    initialMargin, 
    monthlyFixedCost, 
    variableCostPerKg, 
    maxKgPerDay 
}: { 
    initialMargin: number, 
    monthlyFixedCost: number, 
    variableCostPerKg: number,
    maxKgPerDay: number
}) {
    const [margin, setMargin] = useState(initialMargin);
    const [isSaving, setIsSaving] = useState(false);
    
    // Simulations
    const requiredMarginFrac = margin / 100;
    
    // BEP equation: BEP_kg = total_fixed_cost / (price_per_kg - variable_cost_per_kg)
    // Price = (Variable Cost + (Fixed Cost / expected_kg)) / (1 - target_margin)
    const simulatePriceAt = (expectedDailyKg: number) => {
        if (expectedDailyKg <= 0) return 0;
        const expectedMonthlyKg = expectedDailyKg * 30;
        const baseHppPerKg = variableCostPerKg + (monthlyFixedCost / expectedMonthlyKg);
        return baseHppPerKg / (1 - requiredMarginFrac);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = await updateProfitSettingsAction(margin);
        if (res.ok) {
            toast.success("Margin settings updated");
        } else {
            toast.error(res.error || "Failed to save");
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Profit Target (%)</CardTitle>
                        <CardDescription>Determine the percentage of pure profit you want to make per transaction.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-end gap-4">
                            <div className="space-y-2 flex-grow">
                                <label className="text-sm font-medium">Desired Margin</label>
                                <Input type="number" min="0" max="99" value={margin} onChange={e => setMargin(parseInt(e.target.value) || 0)} />
                            </div>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="bg-primary/5 pb-4">
                        <CardTitle>Break-even Quick View</CardTitle>
                        <CardDescription>Metrics to never go negative.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Fixed Overhead (Monthly)</div>
                            <div className="text-2xl font-bold">Rp {monthlyFixedCost.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Variable Material Cost / Kg</div>
                            <div className="text-2xl font-bold">Rp {variableCostPerKg.toLocaleString()}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Price Recommendation Engine</CardTitle>
                    <CardDescription>
                        Based on your {(margin || 0)}% margin target, here is what you should charge customers at different capacity usages.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            { label: "Slow Business", kg: Math.min(30, maxKgPerDay * 0.3) },
                            { label: "Average Traffic", kg: Math.min(50, maxKgPerDay * 0.5) },
                            { label: "High Volume", kg: Math.min(100, maxKgPerDay * 0.8) }
                        ].map((scenario, i) => {
                            const recPrice = simulatePriceAt(scenario.kg);
                            
                            return (
                                <div key={i} className="rounded-xl border p-6 flex flex-col items-center text-center space-y-4 shadow-sm relative overflow-hidden">
                                    {i === 1 && <div className="absolute top-0 w-full bg-primary text-primary-foreground text-xs py-1 font-medium">MOST COMMON</div>}
                                    <div className="mt-2">
                                        <div className="text-sm font-medium text-muted-foreground">{scenario.label}</div>
                                        <div className="text-lg font-semibold">{Math.round(scenario.kg)} Kg / Day</div>
                                    </div>
                                    
                                    <div className="w-full bg-muted/30 p-4 rounded-lg">
                                        <div className="text-sm text-muted-foreground mb-1">Set Minimum Price:</div>
                                        <div className="text-3xl font-bold text-primary">Rp {Math.round(recPrice).toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground mt-1">per Kg</div>
                                    </div>
                                    
                                    <div className="text-sm text-muted-foreground pt-2 flex items-center justify-center gap-2">
                                        {(recPrice * scenario.kg * 30) - monthlyFixedCost - (variableCostPerKg * scenario.kg * 30) > 0 ? (
                                            <><CheckCircle2 className="w-4 h-4 text-green-500" /> Profitable</>
                                        ) : (
                                            <><AlertCircle className="w-4 h-4 text-red-500" /> Negative</>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
