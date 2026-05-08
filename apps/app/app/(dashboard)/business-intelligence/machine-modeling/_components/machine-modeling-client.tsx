"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Grid, Activity, Check } from "lucide-react";
import { updateMachineOperationsAction } from "../../_actions/bi-calculations";
import { toast } from "sonner";
import { type BiMachineOperation } from "@beresio/db";

export function MachineModelingClient({ initialData }: { initialData: BiMachineOperation }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        totalMachines: initialData.totalMachines,
        capacityPerMachineKg: initialData.capacityPerMachineKg,
        optimalUsagePercent: parseFloat(initialData.optimalUsagePercent),
        cycleTimeMinutes: initialData.cycleTimeMinutes,
        operationalHoursPerDay: initialData.operationalHoursPerDay,
    });

    const maxKgPerDay = formData.totalMachines * formData.capacityPerMachineKg * formData.operationalHoursPerDay * (60 / formData.cycleTimeMinutes);
    const realKgPerDay = maxKgPerDay * (formData.optimalUsagePercent / 100);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const res = await updateMachineOperationsAction(formData);
        
        if (res.ok) {
            toast.success("Machine configurations stored");
        } else {
            toast.error(res.error || "Failed to update configurations");
        }
        setIsSubmitting(false);
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>Configuration</CardTitle>
                    <CardDescription>Calibrate machine counts and process parameters.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2"><Grid className="w-4 h-4"/> Total Washers</label>
                                <Input type="number" min="1" value={formData.totalMachines} onChange={e => setFormData(p => ({ ...p, totalMachines: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Capacity / Unit (Kg)</label>
                                <Input type="number" min="1" value={formData.capacityPerMachineKg} onChange={e => setFormData(p => ({ ...p, capacityPerMachineKg: parseInt(e.target.value) || 0 }))} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Activity className="w-4 h-4"/> Target Efficiency (%)</label>
                            <Input type="number" min="1" max="100" value={formData.optimalUsagePercent} onChange={e => setFormData(p => ({ ...p, optimalUsagePercent: parseInt(e.target.value) || 0 }))} />
                            <p className="text-xs text-muted-foreground">Most laundries max out at 50% utilitzation in day hours.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">1 Cycle Time (Mins)</label>
                                <Input type="number" min="1" value={formData.cycleTimeMinutes} onChange={e => setFormData(p => ({ ...p, cycleTimeMinutes: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Operating Hours / Day</label>
                                <Input type="number" min="1" max="24" value={formData.operationalHoursPerDay} onChange={e => setFormData(p => ({ ...p, operationalHoursPerDay: parseInt(e.target.value) || 0 }))} />
                            </div>
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Saving..." : <><Check className="w-4 h-4 mr-2" /> Save Settings</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader className="bg-primary/5 pb-4">
                        <CardTitle>Production Limits</CardTitle>
                        <CardDescription>Mathematical boundaries based on your settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Absolute Max Capacity</div>
                            <div className="text-3xl font-bold">{Math.round(maxKgPerDay).toLocaleString()} Kg / Day</div>
                            <div className="text-sm mt-1">If machines never stop operating.</div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">Realistic Production (Target)</div>
                            <div className="text-3xl font-bold text-primary">{Math.round(realKgPerDay).toLocaleString()} Kg / Day</div>
                            <div className="text-sm mt-1">At {formData.optimalUsagePercent}% efficiency.</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
