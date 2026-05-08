import { getHppCostItems } from "../_actions/bi-calculations";
import { HppCalculatorClient } from "./_components/hpp-calculator-client";
import { type BiCostItem } from "@beresio/db";

export default async function HppCalculatorPage() {
    const res = await getHppCostItems();
    const items: BiCostItem[] = res.ok ? (res.data || []) : [];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-medium">HPP Component Setup</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Control every variable mapping from chemical costs to fixed overhead to gain transparency.
                </p>
            </div>
            <HppCalculatorClient initialItems={items || []} />
        </div>
    );
}
