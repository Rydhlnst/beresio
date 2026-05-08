"use server";

import { getActiveBranchId } from "@/lib/branch-context.server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { 
    createDbNextjs, 
    biCostItems, 
    biMachineOperations, 
    biProfitSettings, 
    biLaborConfigs,
    type BiCostItem,
    type BiMachineOperation,
    type BiProfitSetting
} from "@beresio/db";
import { eq, and } from "drizzle-orm";

const db = createDbNextjs(process.env.DATABASE_URL!);
const authInstance = auth(db);

/**
 * Default machine operation settings to avoid null returns and ensure consistent UI state.
 */
const DEFAULT_MACHINE_OPS = {
    totalMachines: 1,
    capacityPerMachineKg: 10,
    optimalUsagePercent: "50",
    cycleTimeMinutes: 60,
    operationalHoursPerDay: 12,
} as const;

/**
 * Default profit settings to avoid null returns.
 */
const DEFAULT_PROFIT_SETTINGS = {
    targetMarginPercent: "30",
} as const;

async function requireTenantParams() {
    const reqHeaders = await headers();
    const session = await authInstance.api.getSession({ headers: reqHeaders });
    
    if (!session) throw new Error("Unauthorized");
    
    // Better-auth session with potential organization plugin fields
    const sessionWithOrg = session as typeof session & { 
        activeOrganizationId?: string;
        session?: { activeOrganizationId?: string };
    };

    const organizationId = sessionWithOrg.activeOrganizationId || 
                           sessionWithOrg.session?.activeOrganizationId || 
                           session.user.id;
                           
    const branchId = await getActiveBranchId();
    
    if (!organizationId || !branchId) {
        throw new Error("Missing organizationId or branchId in context");
    }

    return { organizationId, branchId };
}

export async function getHppCostItems() {
    try {
        const { organizationId, branchId } = await requireTenantParams();
        const items = await db.query.biCostItems.findMany({
            where: and(
                eq(biCostItems.organizationId, organizationId),
                eq(biCostItems.branchId, branchId)
            )
        });
        return { ok: true as const, data: items as BiCostItem[] };
    } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
}

export async function addCostItemAction(data: {
    category: "chemical" | "utility" | "labor" | "fixed_cost" | "maintenance";
    name: string;
    usageMetric: "per_kg" | "per_cycle" | "per_month" | "per_liter" | "per_kwh";
    usageAmount: number | string;
    pricePerUnit: number | string;
}) {
    try {
        const { organizationId, branchId } = await requireTenantParams();
        await db.insert(biCostItems).values({
            organizationId,
            branchId,
            category: data.category,
            name: data.name,
            usageMetric: data.usageMetric,
            usageAmount: data.usageAmount.toString(),
            pricePerUnit: data.pricePerUnit.toString(),
        });
        return { ok: true as const };
    } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
}

export async function deleteCostItemAction(id: string) {
    try {
        const { organizationId, branchId } = await requireTenantParams();
        await db.delete(biCostItems).where(
            and(
                eq(biCostItems.id, id),
                eq(biCostItems.organizationId, organizationId),
                eq(biCostItems.branchId, branchId)
            )
        );
        return { ok: true as const };
    } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
}

export async function getMachineOperations() {
    try {
        const { organizationId, branchId } = await requireTenantParams();
        const result = await db.query.biMachineOperations.findFirst({
            where: and(
                eq(biMachineOperations.organizationId, organizationId),
                eq(biMachineOperations.branchId, branchId)
            )
        });
        
        // Return default values if no configuration exists yet to avoid null in UI
        return { 
            ok: true as const, 
            data: (result || { ...DEFAULT_MACHINE_OPS, organizationId, branchId }) as BiMachineOperation 
        };
    } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
}

export async function updateMachineOperationsAction(data: {
    totalMachines: number;
    capacityPerMachineKg: number;
    optimalUsagePercent: number;
    cycleTimeMinutes: number;
    operationalHoursPerDay: number;
}) {
    try {
        const { organizationId, branchId } = await requireTenantParams();
        const existing = await db.query.biMachineOperations.findFirst({
            where: and(
                eq(biMachineOperations.organizationId, organizationId),
                eq(biMachineOperations.branchId, branchId)
            )
        });

        if (existing) {
            await db.update(biMachineOperations)
                .set({
                    totalMachines: data.totalMachines,
                    capacityPerMachineKg: data.capacityPerMachineKg,
                    optimalUsagePercent: data.optimalUsagePercent.toString(),
                    cycleTimeMinutes: data.cycleTimeMinutes,
                    operationalHoursPerDay: data.operationalHoursPerDay,
                })
                .where(eq(biMachineOperations.id, existing.id));
        } else {
            await db.insert(biMachineOperations).values({
                organizationId,
                branchId,
                totalMachines: data.totalMachines,
                capacityPerMachineKg: data.capacityPerMachineKg,
                optimalUsagePercent: data.optimalUsagePercent.toString(),
                cycleTimeMinutes: data.cycleTimeMinutes,
                operationalHoursPerDay: data.operationalHoursPerDay,
            });
        }
        return { ok: true as const };
    } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
}

export async function getProfitSettings() {
    try {
        const { organizationId, branchId } = await requireTenantParams();
        const result = await db.query.biProfitSettings.findFirst({
            where: and(
                eq(biProfitSettings.organizationId, organizationId),
                eq(biProfitSettings.branchId, branchId)
            )
        });

        // Return default values if no configuration exists yet to avoid null in UI
        return { 
            ok: true as const, 
            data: (result || { ...DEFAULT_PROFIT_SETTINGS, organizationId, branchId }) as BiProfitSetting 
        };
    } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
}

export async function updateProfitSettingsAction(targetMarginPercent: number) {
    try {
        const { organizationId, branchId } = await requireTenantParams();
        const existing = await db.query.biProfitSettings.findFirst({
            where: and(
                eq(biProfitSettings.organizationId, organizationId),
                eq(biProfitSettings.branchId, branchId)
            )
        });
        
        if (existing) {
            await db.update(biProfitSettings)
                .set({ targetMarginPercent: targetMarginPercent.toString() })
                .where(eq(biProfitSettings.id, existing.id));
        } else {
            await db.insert(biProfitSettings).values({
                organizationId,
                branchId,
                targetMarginPercent: targetMarginPercent.toString(),
            });
        }
        return { ok: true as const };
    } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : "Unknown error" };
    }
}
