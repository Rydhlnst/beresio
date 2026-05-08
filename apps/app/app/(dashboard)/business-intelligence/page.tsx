import { getMachineOperations, getProfitSettings, getHppCostItems } from "./_actions/bi-calculations";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui/card";
import { DollarSign, Activity, AlertCircle, RefreshCcw } from "lucide-react";
import { type BiCostItem, type BiMachineOperation, type BiProfitSetting } from "@beresio/db";

export default async function BusinessIntelligencePage() {
    const [opsRes, settingsRes, costsRes] = await Promise.all([
        getMachineOperations(),
        getProfitSettings(),
        getHppCostItems()
    ]);

    // Data is guaranteed to have defaults if not set in DB, avoiding 'null' types in the component tree
    const ops: BiMachineOperation = opsRes.ok ? opsRes.data : {} as BiMachineOperation;
    const settings: BiProfitSetting = settingsRes.ok ? settingsRes.data : {} as BiProfitSetting;
    const costsList: BiCostItem[] = (costsRes.ok ? costsRes.data : []) || [];
    
    // Quick calculations for the overview
    const sumMonthlyCosts = costsList.filter((c: BiCostItem) => c.usageMetric === "per_month")
        .reduce((sum: number, c: BiCostItem) => sum + (parseFloat(c.usageAmount) * parseFloat(c.pricePerUnit)), 0);

    const sumKgCosts = costsList.filter((c: BiCostItem) => c.usageMetric === "per_kg")
        .reduce((sum: number, c: BiCostItem) => sum + (parseFloat(c.usageAmount) * parseFloat(c.pricePerUnit)), 0);
        
    const capacity = (ops.totalMachines * ops.capacityPerMachineKg * ops.operationalHoursPerDay * (60 / ops.cycleTimeMinutes)) * (parseFloat(ops.optimalUsagePercent) / 100);
    
    // Total HPP per Kg approximate
    const capacityMonthly = capacity * 30;
    const hppPerKg = capacityMonthly > 0 ? (sumMonthlyCosts / capacityMonthly) + sumKgCosts : 0;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estimated HPP per Kg</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {hppPerKg.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-muted-foreground">
                            Based on {capacityMonthly.toLocaleString('id-ID', { maximumFractionDigits: 0 })} kg/month projected volume
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Fixed Costs</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rp {sumMonthlyCosts.toLocaleString('id-ID')}</div>
                        <p className="text-xs text-muted-foreground">
                            Rent, Subscriptions, Salary
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Optimal Machine Utilization</CardTitle>
                        <RefreshCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ops?.optimalUsagePercent || "50"}%</div>
                        <p className="text-xs text-muted-foreground">
                            Current configured efficiency target
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Target Margin</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{settings?.targetMarginPercent || "30"}%</div>
                        <p className="text-xs text-muted-foreground">
                            Business pricing ambition
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>System Intelligence Overview</CardTitle>
                        <CardDescription>Metrics derived from your real and projected data.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="flex h-[200px] w-full items-center justify-center border-2 border-dashed rounded-md bg-muted/20">
                            <span className="text-muted-foreground text-sm">Real-time charts will appear here as orders sync.</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Alerts & Suggestions</CardTitle>
                        <CardDescription>
                            AI-driven business insights
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {!ops && (
                                <div className="flex items-center gap-4 rounded-md border p-4 bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">Machine Operations Missing</p>
                                        <p className="text-sm text-muted-foreground">
                                            Configure your machines and operating hours to calculate HPP.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {sumMonthlyCosts === 0 && (
                                <div className="flex items-center gap-4 rounded-md border p-4 bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">No Fixed Costs Found</p>
                                        <p className="text-sm text-muted-foreground">
                                            Are you calculating rent or salary? Add them in HPP Calculator.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {ops && sumMonthlyCosts > 0 && (
                                <div className="flex items-center gap-4 rounded-md border p-4 bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
                                    <Activity className="h-4 w-4 text-green-600" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">System Active</p>
                                        <p className="text-sm text-muted-foreground">
                                            BI engine is running with current configurations.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
