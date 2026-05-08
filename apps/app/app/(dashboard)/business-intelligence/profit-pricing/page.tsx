import { getProfitSettings, getHppCostItems, getMachineOperations } from "../_actions/bi-calculations";
import { ProfitPricingClient } from "./_components/profit-pricing-client";
import { type BiCostItem, type BiMachineOperation, type BiProfitSetting } from "@beresio/db";

export default async function ProfitPricingPage() {
    const [settingsRes, costsRes, opsRes] = await Promise.all([
        getProfitSettings(),
        getHppCostItems(),
        getMachineOperations()
    ]);

    const settings: BiProfitSetting = settingsRes.ok ? settingsRes.data : {} as BiProfitSetting;
    const costsList: BiCostItem[] = (costsRes.ok ? costsRes.data : []) || [];
    const ops: BiMachineOperation = opsRes.ok ? opsRes.data : {} as BiMachineOperation;

    // Fixed vs Variable Calculation
    const monthlyFixedCost = costsList
        .filter((c: BiCostItem) => c.usageMetric === "per_month")
        .reduce((sum: number, c: BiCostItem) => sum + (parseFloat(c.usageAmount) * parseFloat(c.pricePerUnit)), 0);

    const variableCostPerKg = costsList
        .filter((c: BiCostItem) => c.usageMetric === "per_kg")
        .reduce((sum: number, c: BiCostItem) => sum + (parseFloat(c.usageAmount) * parseFloat(c.pricePerUnit)), 0);

    // Max capacity
    const maxKgPerDay = ops ? (ops.totalMachines * ops.capacityPerMachineKg * ops.operationalHoursPerDay * (60 / ops.cycleTimeMinutes)) : 100;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-medium">Profit & Pricing Simulator</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Calculate your exact Break-Even Point (BEP) and determine the optimal selling price based on your target profit margins.
                </p>
            </div>
            
            <ProfitPricingClient 
                initialMargin={parseFloat(settings.targetMarginPercent)} 
                monthlyFixedCost={monthlyFixedCost}
                variableCostPerKg={variableCostPerKg}
                maxKgPerDay={maxKgPerDay}
            />
        </div>
    );
}
