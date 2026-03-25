import { eq, and } from 'drizzle-orm'
import { inventoryStocks, stockMovements, inventoryVariantStocks, variantStockMovements } from '@beresio/db'

/**
 * Adjust stock quantity for a product at a specific branch.
 * Creates new stock record if doesn't exist.
 * 
 * @param tx - Database transaction
 * @param input - Stock adjustment parameters
 * @returns New quantity after adjustment
 * @throws Error with message 'INSUFFICIENT_STOCK' if adjustment would result in negative stock
 */
export async function adjustStockQuantity(
    tx: any,
    input: {
        orgId: string
        productId: string
        branchId: string
        delta: number
    }
): Promise<number> {
    const { orgId, productId, branchId, delta } = input

    const [existing] = await tx
        .select({
            id: inventoryStocks.id,
            quantity: inventoryStocks.quantity,
        })
        .from(inventoryStocks)
        .where(
            and(
                eq(inventoryStocks.organizationId, orgId),
                eq(inventoryStocks.productId, productId),
                eq(inventoryStocks.branchId, branchId)
            )
        )
        .limit(1)

    const currentQty = Number(existing?.quantity ?? 0)
    const nextQty = currentQty + delta

    if (nextQty < 0) {
        throw new Error('INSUFFICIENT_STOCK')
    }

    if (existing) {
        await tx
            .update(inventoryStocks)
            .set({ quantity: nextQty, updatedAt: new Date() })
            .where(eq(inventoryStocks.id, existing.id))
        return nextQty
    }

    await tx.insert(inventoryStocks).values({
        organizationId: orgId,
        productId,
        branchId,
        quantity: nextQty,
        minThreshold: 0,
    })

    return nextQty
}

/**
 * Record a stock movement for audit trail.
 * 
 * @param tx - Database transaction
 * @param input - Stock movement parameters
 */
export async function recordStockMovement(
    tx: any,
    input: {
        orgId: string
        productId: string
        branchId: string
        delta: number
        reason?: string | null
        refType?: string | null
        refId?: string | null
        actorId?: string | null
    }
): Promise<void> {
    const { orgId, productId, branchId, delta, reason, refType, refId, actorId } = input

    await tx.insert(stockMovements).values({
        organizationId: orgId,
        productId,
        branchId,
        delta,
        reason: reason ?? null,
        refType: refType ?? null,
        refId: refId ?? null,
        actorId: actorId ?? null,
    })
}

/**
 * Adjust stock quantity for a product variant at a specific branch.
 * Creates new stock record if doesn't exist.
 */
export async function adjustVariantStockQuantity(
    tx: any,
    input: {
        orgId: string
        variantId: string
        branchId: string
        delta: number
    }
): Promise<number> {
    const { orgId, variantId, branchId, delta } = input

    const [existing] = await tx
        .select({
            id: inventoryVariantStocks.id,
            quantity: inventoryVariantStocks.quantity,
        })
        .from(inventoryVariantStocks)
        .where(
            and(
                eq(inventoryVariantStocks.organizationId, orgId),
                eq(inventoryVariantStocks.variantId, variantId),
                eq(inventoryVariantStocks.branchId, branchId)
            )
        )
        .limit(1)

    const currentQty = Number(existing?.quantity ?? 0)
    const nextQty = currentQty + delta

    if (nextQty < 0) {
        throw new Error('INSUFFICIENT_STOCK')
    }

    if (existing) {
        await tx
            .update(inventoryVariantStocks)
            .set({ quantity: nextQty, updatedAt: new Date() })
            .where(eq(inventoryVariantStocks.id, existing.id))
        return nextQty
    }

    await tx.insert(inventoryVariantStocks).values({
        organizationId: orgId,
        variantId,
        branchId,
        quantity: nextQty,
        minThreshold: 0,
    })

    return nextQty
}

/**
 * Record a variant stock movement for audit trail.
 */
export async function recordVariantStockMovement(
    tx: any,
    input: {
        orgId: string
        variantId: string
        branchId: string
        delta: number
        reason?: string | null
        refType?: string | null
        refId?: string | null
        actorId?: string | null
    }
): Promise<void> {
    const { orgId, variantId, branchId, delta, reason, refType, refId, actorId } = input

    await tx.insert(variantStockMovements).values({
        organizationId: orgId,
        variantId,
        branchId,
        delta,
        reason: reason ?? null,
        refType: refType ?? null,
        refId: refId ?? null,
        actorId: actorId ?? null,
    })
}

/**
 * Resolve inventory product IDs by their SKUs.
 * 
 * @param tx - Database transaction
 * @param orgId - Organization ID
 * @param skus - Array of SKUs to resolve
 * @returns Map of SKU to inventory product ID
 */
export async function resolveInventoryBySku(
    tx: any,
    orgId: string,
    skus: string[]
): Promise<Map<string, string>> {
    if (skus.length === 0) return new Map<string, string>()

    const { inventoryProducts } = await import('@beresio/db')
    const { inArray, eq, and } = await import('drizzle-orm')

    const rows = await tx
        .select({ id: inventoryProducts.id, sku: inventoryProducts.sku })
        .from(inventoryProducts)
        .where(
            and(
                eq(inventoryProducts.organizationId, orgId),
                inArray(inventoryProducts.sku, skus)
            )
        )

    const map = new Map<string, string>()
    for (const row of rows) {
        if (!row.sku) continue
        map.set(row.sku, row.id)
    }
    return map
}
