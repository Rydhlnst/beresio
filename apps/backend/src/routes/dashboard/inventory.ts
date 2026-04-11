import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm'
import {
    branches,
    inventoryAdjustments,
    inventoryProducts,
    inventoryStocks,
    inventoryTransfers,
    stockMovements,
    user,
    products,
    productVariants,
    inventoryVariantStocks,
} from '@beresio/db'
import {
    adjustStockQuantity,
    recordStockMovement,
    adjustVariantStockQuantity,
    recordVariantStockMovement,
} from '../../lib/stock'
import { getAccessibleBranchIds, getBranchAccessContext, hasBranchAccess } from '../../lib/branch-access'
import { requireBranchContext } from '../../middleware/branch-context'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const DEFAULT_LIMIT = 100
const TRANSFER_STATUS = ['approved', 'rejected', 'cancelled'] as const

const adjustmentBodySchema = z.object({
    productId: z.string().trim().min(1, 'productId is required'),
    branchId: z.string().trim().min(1, 'branchId is required'),
    quantityDelta: z.coerce
        .number()
        .finite()
        .refine((value) => value !== 0, 'quantityDelta must be a non-zero number'),
    reason: z.string().nullable().optional(),
})

const transferBodySchema = z.object({
    productId: z.string().trim().min(1, 'productId is required'),
    fromBranchId: z.string().trim().min(1, 'fromBranchId is required'),
    toBranchId: z.string().trim().min(1, 'toBranchId is required'),
    quantity: z.coerce.number().finite().gt(0, 'quantity must be > 0'),
    note: z.string().nullable().optional(),
})

const transferStatusBodySchema = z.object({
    status: z.enum(TRANSFER_STATUS),
})

const thresholdBodySchema = z.object({
    productId: z.string().trim().min(1, 'productId and branchId are required'),
    branchId: z.string().trim().min(1, 'productId and branchId are required'),
    minThreshold: z.coerce.number().finite().min(0, 'minThreshold must be >= 0'),
})

const variantAdjustBodySchema = z.object({
    variantId: z.string().trim().min(1, 'variantId and branchId are required'),
    branchId: z.string().trim().min(1, 'variantId and branchId are required'),
    quantityDelta: z.coerce
        .number()
        .finite()
        .refine((value) => value !== 0, 'quantityDelta must be a non-zero number'),
    reason: z.string().nullable().optional(),
})

const variantThresholdBodySchema = z.object({
    variantId: z.string().trim().min(1, 'variantId and branchId are required'),
    branchId: z.string().trim().min(1, 'variantId and branchId are required'),
    minThreshold: z.coerce.number().finite().min(0, 'minThreshold must be >= 0'),
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

export const inventoryRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/inventory/products
inventoryRouter.get('/products', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, 'No branch access')
        if (branchIds.length === 0 && isOrgWide) return ok(c, [])

        const search = c.req.query('search')?.trim()
        const branchId = c.req.query('branchId')
        const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_LIMIT), 200)

        const conditions = [eq(inventoryProducts.organizationId, orgId)]
        if (search) {
            conditions.push(ilike(inventoryProducts.name, `%${search}%`))
        }

        const products = await db
            .select({
                id: inventoryProducts.id,
                name: inventoryProducts.name,
                sku: inventoryProducts.sku,
                unit: inventoryProducts.unit,
                imageUrl: inventoryProducts.imageUrl,
                isActive: inventoryProducts.isActive,
                createdAt: inventoryProducts.createdAt,
            })
            .from(inventoryProducts)
            .where(and(...conditions))
            .orderBy(inventoryProducts.name)
            .limit(limit)

        if (products.length === 0) return ok(c, [])

        const productIds = products.map((product: any) => product.id)
        const stockConditions = [
            eq(inventoryStocks.organizationId, orgId),
            inArray(inventoryStocks.productId, productIds),
        ]
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) {
                return errors.forbidden(c, 'No access to branch')
            }
            stockConditions.push(eq(inventoryStocks.branchId, branchId))
        } else {
            stockConditions.push(inArray(inventoryStocks.branchId, branchIds))
        }

        const stocks = await db
            .select({
                productId: inventoryStocks.productId,
                branchId: inventoryStocks.branchId,
                branchName: branches.name,
                quantity: inventoryStocks.quantity,
                minThreshold: inventoryStocks.minThreshold,
            })
            .from(inventoryStocks)
            .leftJoin(branches, eq(inventoryStocks.branchId, branches.id))
            .where(and(...stockConditions))

        const byProduct = new Map<string, any[]>()
        for (const stock of stocks) {
            const list = byProduct.get(stock.productId) ?? []
            list.push({
                branchId: stock.branchId,
                branchName: stock.branchName,
                quantity: Number(stock.quantity ?? 0),
                minThreshold: Number(stock.minThreshold ?? 0),
            })
            byProduct.set(stock.productId, list)
        }

        const result = products.map((product: any) => ({
            ...product,
            stocks: byProduct.get(product.id) ?? [],
        }))

        return ok(c, result)
    } catch (err: any) {
        console.error('[inventory/products]', err)
        return errors.internal(c)
    }
})

// DELETE /api/dashboard/inventory/products/:id
inventoryRouter.delete('/products/:id', authMiddleware, requireBranchContext(), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, 'No branch access')
        const productId = c.req.param('id')

        const [existing] = await db
            .select({ id: inventoryProducts.id })
            .from(inventoryProducts)
            .where(and(
                eq(inventoryProducts.id, productId),
                eq(inventoryProducts.organizationId, orgId)
            ))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Product not found')

        // Check if product has stock in any branch
        if (branchIds.length > 0) {
            const [stockRow] = await db
                .select({ quantity: inventoryStocks.quantity })
                .from(inventoryStocks)
                .where(and(
                    eq(inventoryStocks.productId, productId),
                    eq(inventoryStocks.organizationId, orgId),
                    inArray(inventoryStocks.branchId, branchIds)
                ))
                .limit(1)

            if (stockRow && Number(stockRow.quantity) > 0) {
                return errors.badRequest(c, 'Cannot delete product with existing stock')
            }
        }

        await db
            .delete(inventoryProducts)
            .where(and(
                eq(inventoryProducts.id, productId),
                eq(inventoryProducts.organizationId, orgId)
            ))

        return ok(c, { deleted: true })
    } catch (err: any) {
        console.error('[inventory/products/delete]', err)
        return errors.internal(c)
    }
})

// GET /api/dashboard/inventory/adjustments
inventoryRouter.get('/adjustments', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, 'No branch access')
        if (branchIds.length === 0 && isOrgWide) return ok(c, [])
        const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_LIMIT), 200)

        const rows = await db
            .select({
                id: inventoryAdjustments.id,
                productId: inventoryProducts.id,
                productName: inventoryProducts.name,
                branchId: branches.id,
                branchName: branches.name,
                quantityDelta: inventoryAdjustments.quantityDelta,
                reason: inventoryAdjustments.reason,
                actorId: inventoryAdjustments.actorId,
                actorName: user.name,
                createdAt: inventoryAdjustments.createdAt,
            })
            .from(inventoryAdjustments)
            .leftJoin(inventoryProducts, eq(inventoryAdjustments.productId, inventoryProducts.id))
            .leftJoin(branches, eq(inventoryAdjustments.branchId, branches.id))
            .leftJoin(user, eq(inventoryAdjustments.actorId, user.id))
            .where(and(
                eq(inventoryAdjustments.organizationId, orgId),
                inArray(inventoryAdjustments.branchId, branchIds)
            ))
            .orderBy(desc(inventoryAdjustments.createdAt))
            .limit(limit)

        return ok(c, rows.map((row: any) => ({
            id: row.id,
            product: row.productName ? { id: row.productId, name: row.productName } : null,
            branch: row.branchName ? { id: row.branchId, name: row.branchName } : null,
            quantityDelta: Number(row.quantityDelta ?? 0),
            reason: row.reason,
            actor: row.actorName ? { id: row.actorId, name: row.actorName } : null,
            createdAt: row.createdAt,
        })))
    } catch (err: any) {
        console.error('[inventory/adjustments]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/inventory/adjustments
inventoryRouter.post('/adjustments', authMiddleware, requireBranchContext(), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')
        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()
        const body = await c.req.json().catch(() => null)
        const parsedBody = adjustmentBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const { productId, branchId, quantityDelta, reason } = parsedBody.data

        if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, 'No access to branch')

        const [productRow] = await db
            .select({ id: inventoryProducts.id })
            .from(inventoryProducts)
            .where(and(eq(inventoryProducts.id, productId), eq(inventoryProducts.organizationId, orgId)))
            .limit(1)
        if (!productRow) return errors.notFound(c, 'Product not found')

        const [branchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .limit(1)
        if (!branchRow) return errors.notFound(c, 'Branch not found')

        const created = await db.transaction(async (tx: any) => {
            await adjustStockQuantity(tx, { orgId, productId, branchId, delta: quantityDelta })
            await recordStockMovement(tx, {
                orgId,
                productId,
                branchId,
                delta: quantityDelta,
                reason,
                refType: 'adjustment',
                refId: null,
                actorId,
            })
            const [adjustment] = await tx
                .insert(inventoryAdjustments)
                .values({
                    organizationId: orgId,
                    productId,
                    branchId,
                    quantityDelta,
                    reason,
                    actorId,
                })
                .returning()
            return adjustment
        })

        return ok(c, created)
    } catch (err: any) {
        console.error('[inventory/adjustments/create]', err)
        if (err?.message === 'INSUFFICIENT_STOCK') {
            return errors.badRequest(c, 'Stok tidak mencukupi')
        }
        return errors.internal(c)
    }
})

// GET /api/dashboard/inventory/transfers
inventoryRouter.get('/transfers', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, 'No branch access')
        if (branchIds.length === 0 && isOrgWide) return ok(c, [])
        const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_LIMIT), 200)

        const rows = await db
            .select({
                id: inventoryTransfers.id,
                productId: inventoryTransfers.productId,
                productName: inventoryProducts.name,
                fromBranchId: inventoryTransfers.fromBranchId,
                fromBranchName: sql<string>`
                    (select b.name from branches b where b.id = ${inventoryTransfers.fromBranchId})
                `.as('from_branch_name'),
                toBranchId: inventoryTransfers.toBranchId,
                toBranchName: sql<string>`
                    (select b.name from branches b where b.id = ${inventoryTransfers.toBranchId})
                `.as('to_branch_name'),
                quantity: inventoryTransfers.quantity,
                status: inventoryTransfers.status,
                note: inventoryTransfers.note,
                requestedBy: inventoryTransfers.requestedBy,
                decidedBy: inventoryTransfers.decidedBy,
                createdAt: inventoryTransfers.createdAt,
                updatedAt: inventoryTransfers.updatedAt,
            })
            .from(inventoryTransfers)
            .leftJoin(inventoryProducts, eq(inventoryTransfers.productId, inventoryProducts.id))
            .where(and(
                eq(inventoryTransfers.organizationId, orgId),
                inArray(inventoryTransfers.fromBranchId, branchIds)
            ))
            .orderBy(desc(inventoryTransfers.createdAt))
            .limit(limit)

        return ok(c, rows.map((row: any) => ({
            id: row.id,
            product: row.productName ? { id: row.productId, name: row.productName } : null,
            fromBranch: row.fromBranchName ? { id: row.fromBranchId, name: row.fromBranchName } : null,
            toBranch: row.toBranchName ? { id: row.toBranchId, name: row.toBranchName } : null,
            quantity: Number(row.quantity ?? 0),
            status: row.status,
            note: row.note,
            requestedBy: row.requestedBy,
            decidedBy: row.decidedBy,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        })))
    } catch (err: any) {
        console.error('[inventory/transfers]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/inventory/transfers
inventoryRouter.post(
    '/transfers',
    authMiddleware,
    requireBranchContext({ payloadKeys: ['fromBranchId', 'branchId'] }),
    async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')
        const requesterId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()
        const body = await c.req.json().catch(() => null)
        const parsedBody = transferBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const { productId, fromBranchId, toBranchId, quantity, note } = parsedBody.data

        if (!hasBranchAccess(branchIds, fromBranchId) || !hasBranchAccess(branchIds, toBranchId)) {
            return errors.forbidden(c, 'No access to branch')
        }
        if (fromBranchId === toBranchId) return errors.badRequest(c, 'fromBranchId and toBranchId must differ')

        const [productRow] = await db
            .select({ id: inventoryProducts.id })
            .from(inventoryProducts)
            .where(and(eq(inventoryProducts.id, productId), eq(inventoryProducts.organizationId, orgId)))
            .limit(1)
        if (!productRow) return errors.notFound(c, 'Product not found')

        const [fromBranchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.id, fromBranchId), eq(branches.organizationId, orgId)))
            .limit(1)
        if (!fromBranchRow) return errors.notFound(c, 'From branch not found')

        const [toBranchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.id, toBranchId), eq(branches.organizationId, orgId)))
            .limit(1)
        if (!toBranchRow) return errors.notFound(c, 'To branch not found')

        const [stockRow] = await db
            .select({ quantity: inventoryStocks.quantity })
            .from(inventoryStocks)
            .where(and(
                eq(inventoryStocks.organizationId, orgId),
                eq(inventoryStocks.productId, productId),
                eq(inventoryStocks.branchId, fromBranchId),
            ))
            .limit(1)

        const availableQty = Number(stockRow?.quantity ?? 0)
        if (availableQty < quantity) return errors.badRequest(c, 'Stok cabang asal tidak cukup')

        const [created] = await db
            .insert(inventoryTransfers)
            .values({
                organizationId: orgId,
                productId,
                fromBranchId,
                toBranchId,
                quantity,
                status: 'pending',
                note,
                requestedBy: requesterId,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[inventory/transfers/create]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/inventory/transfers/:id
inventoryRouter.patch('/transfers/:id', authMiddleware, requireBranchContext(), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')
        const transferId = c.req.param('id')
        const body = await c.req.json().catch(() => null)
        const parsedBody = transferStatusBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const { status } = parsedBody.data

        const [transferRow] = await db
            .select()
            .from(inventoryTransfers)
            .where(and(eq(inventoryTransfers.id, transferId), eq(inventoryTransfers.organizationId, orgId)))
            .limit(1)

        if (!transferRow) return errors.notFound(c, 'Transfer not found')
        if (!hasBranchAccess(branchIds, transferRow.fromBranchId) || !hasBranchAccess(branchIds, transferRow.toBranchId)) {
            return errors.forbidden(c, 'No access to branch')
        }
        if (transferRow.status !== 'pending') return errors.badRequest(c, 'Transfer already processed')

        const deciderId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const updated = await db.transaction(async (tx: any) => {
            if (status === 'approved') {
                await adjustStockQuantity(tx, {
                    orgId,
                    productId: transferRow.productId,
                    branchId: transferRow.fromBranchId,
                    delta: -Number(transferRow.quantity ?? 0),
                })
                await adjustStockQuantity(tx, {
                    orgId,
                    productId: transferRow.productId,
                    branchId: transferRow.toBranchId,
                    delta: Number(transferRow.quantity ?? 0),
                })
                await recordStockMovement(tx, {
                    orgId,
                    productId: transferRow.productId,
                    branchId: transferRow.fromBranchId,
                    delta: -Number(transferRow.quantity ?? 0),
                    reason: transferRow.note ?? null,
                    refType: 'transfer_out',
                    refId: transferRow.id,
                    actorId: deciderId,
                })
                await recordStockMovement(tx, {
                    orgId,
                    productId: transferRow.productId,
                    branchId: transferRow.toBranchId,
                    delta: Number(transferRow.quantity ?? 0),
                    reason: transferRow.note ?? null,
                    refType: 'transfer_in',
                    refId: transferRow.id,
                    actorId: deciderId,
                })
            }

            const [row] = await tx
                .update(inventoryTransfers)
                .set({
                    status,
                    decidedBy: deciderId,
                    decidedAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(inventoryTransfers.id, transferId))
                .returning()
            return row
        })

        return ok(c, updated)
    } catch (err: any) {
        console.error('[inventory/transfers/update]', err)
        if (err?.message === 'INSUFFICIENT_STOCK') {
            return errors.badRequest(c, 'Stok cabang asal tidak cukup')
        }
        return errors.internal(c)
    }
})

// GET /api/dashboard/inventory/movements
inventoryRouter.get('/movements', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, 'No branch access')
        if (branchIds.length === 0 && isOrgWide) return ok(c, [])
        const branchId = c.req.query('branchId')
        const productId = c.req.query('productId')
        const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_LIMIT), 200)

        const conditions = [eq(stockMovements.organizationId, orgId)]
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) {
                return errors.forbidden(c, 'No access to branch')
            }
            conditions.push(eq(stockMovements.branchId, branchId))
        } else {
            conditions.push(inArray(stockMovements.branchId, branchIds))
        }
        if (productId) conditions.push(eq(stockMovements.productId, productId))

        const rows = await db
            .select({
                id: stockMovements.id,
                productId: stockMovements.productId,
                productName: inventoryProducts.name,
                branchId: stockMovements.branchId,
                branchName: branches.name,
                delta: stockMovements.delta,
                reason: stockMovements.reason,
                refType: stockMovements.refType,
                refId: stockMovements.refId,
                actorId: stockMovements.actorId,
                actorName: user.name,
                createdAt: stockMovements.createdAt,
            })
            .from(stockMovements)
            .leftJoin(inventoryProducts, eq(stockMovements.productId, inventoryProducts.id))
            .leftJoin(branches, eq(stockMovements.branchId, branches.id))
            .leftJoin(user, eq(stockMovements.actorId, user.id))
            .where(and(...conditions))
            .orderBy(desc(stockMovements.createdAt))
            .limit(limit)

        return ok(c, rows.map((row: any) => ({
            id: row.id,
            product: row.productName ? { id: row.productId, name: row.productName } : null,
            branch: row.branchName ? { id: row.branchId, name: row.branchName } : null,
            delta: Number(row.delta ?? 0),
            reason: row.reason,
            refType: row.refType,
            refId: row.refId,
            actor: row.actorName ? { id: row.actorId, name: row.actorName } : null,
            createdAt: row.createdAt,
        })))
    } catch (err: any) {
        console.error('[inventory/movements]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/inventory/stocks/threshold
inventoryRouter.patch('/stocks/threshold', authMiddleware, requireBranchContext(), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')
        const body = await c.req.json().catch(() => null)
        const parsedBody = thresholdBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const { productId, branchId, minThreshold } = parsedBody.data

        if (!hasBranchAccess(branchIds, branchId)) {
            return errors.forbidden(c, 'No access to branch')
        }

        const [stockRow] = await db
            .select({ id: inventoryStocks.id })
            .from(inventoryStocks)
            .where(and(
                eq(inventoryStocks.organizationId, orgId),
                eq(inventoryStocks.productId, productId),
                eq(inventoryStocks.branchId, branchId),
            ))
            .limit(1)

        if (!stockRow) {
            return errors.notFound(c, 'Stock row not found')
        }

        const [updated] = await db
            .update(inventoryStocks)
            .set({ minThreshold, updatedAt: new Date() })
            .where(eq(inventoryStocks.id, stockRow.id))
            .returning()

        return ok(c, {
            id: updated.id,
            productId,
            branchId,
            minThreshold: Number(updated.minThreshold ?? 0),
        })
    } catch (err: any) {
        console.error('[inventory/threshold]', err)
        return errors.internal(c)
    }
})

// GET /api/dashboard/inventory/variant-stocks
inventoryRouter.get('/variant-stocks', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, 'No branch access')
        if (branchIds.length === 0 && isOrgWide) return ok(c, [])
        const branchId = c.req.query('branchId')
        const productId = c.req.query('productId')
        const variantId = c.req.query('variantId')
        const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_LIMIT), 200)

        const conditions = [eq(inventoryVariantStocks.organizationId, orgId)]
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) {
                return errors.forbidden(c, 'No access to branch')
            }
            conditions.push(eq(inventoryVariantStocks.branchId, branchId))
        } else {
            conditions.push(inArray(inventoryVariantStocks.branchId, branchIds))
        }
        if (variantId) conditions.push(eq(inventoryVariantStocks.variantId, variantId))
        if (productId) conditions.push(eq(productVariants.productId, productId))

        const rows = await db
            .select({
                variantId: inventoryVariantStocks.variantId,
                productId: productVariants.productId,
                productName: products.name,
                sku: productVariants.sku,
                barcode: productVariants.barcode,
                option1: productVariants.option1,
                option2: productVariants.option2,
                option3: productVariants.option3,
                branchId: inventoryVariantStocks.branchId,
                branchName: branches.name,
                quantity: inventoryVariantStocks.quantity,
                minThreshold: inventoryVariantStocks.minThreshold,
                updatedAt: inventoryVariantStocks.updatedAt,
            })
            .from(inventoryVariantStocks)
            .leftJoin(productVariants, eq(inventoryVariantStocks.variantId, productVariants.id))
            .leftJoin(products, eq(productVariants.productId, products.id))
            .leftJoin(branches, eq(inventoryVariantStocks.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(desc(inventoryVariantStocks.updatedAt))
            .limit(limit)

        return ok(c, rows.map((row: any) => ({
            variant: {
                id: row.variantId,
                sku: row.sku,
                barcode: row.barcode,
                option1: row.option1,
                option2: row.option2,
                option3: row.option3,
            },
            product: row.productId ? { id: row.productId, name: row.productName } : null,
            branch: row.branchId ? { id: row.branchId, name: row.branchName } : null,
            quantity: Number(row.quantity ?? 0),
            minThreshold: Number(row.minThreshold ?? 0),
            updatedAt: row.updatedAt,
        })))
    } catch (err: any) {
        console.error('[inventory/variant-stocks]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/inventory/variant-stocks/adjust
inventoryRouter.post('/variant-stocks/adjust', authMiddleware, requireBranchContext(), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')
        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()
        const body = await c.req.json().catch(() => null)
        const parsedBody = variantAdjustBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const { variantId, branchId, quantityDelta, reason } = parsedBody.data

        if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, 'No access to branch')

        const [variantRow] = await db
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(and(eq(productVariants.id, variantId), eq(productVariants.organizationId, orgId)))
            .limit(1)
        if (!variantRow) return errors.notFound(c, 'Variant not found')

        const [branchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .limit(1)
        if (!branchRow) return errors.notFound(c, 'Branch not found')

        const created = await db.transaction(async (tx: any) => {
            await adjustVariantStockQuantity(tx, { orgId, variantId, branchId, delta: quantityDelta })
            await recordVariantStockMovement(tx, {
                orgId,
                variantId,
                branchId,
                delta: quantityDelta,
                reason,
                refType: 'adjustment',
                refId: null,
                actorId,
            })
            return { variantId, branchId, quantityDelta, reason }
        })

        return ok(c, created)
    } catch (err: any) {
        console.error('[inventory/variant-stocks/adjust]', err)
        if (err?.message === 'INSUFFICIENT_STOCK') {
            return errors.badRequest(c, 'Stok tidak mencukupi')
        }
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/inventory/variant-stocks/threshold
inventoryRouter.patch('/variant-stocks/threshold', authMiddleware, requireBranchContext(), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')
        const body = await c.req.json().catch(() => null)
        const parsedBody = variantThresholdBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const { variantId, branchId, minThreshold } = parsedBody.data

        if (!hasBranchAccess(branchIds, branchId)) {
            return errors.forbidden(c, 'No access to branch')
        }

        const [stockRow] = await db
            .select({ id: inventoryVariantStocks.id })
            .from(inventoryVariantStocks)
            .where(and(
                eq(inventoryVariantStocks.organizationId, orgId),
                eq(inventoryVariantStocks.variantId, variantId),
                eq(inventoryVariantStocks.branchId, branchId),
            ))
            .limit(1)

        let updated
        if (!stockRow) {
            const [created] = await db
                .insert(inventoryVariantStocks)
                .values({
                    organizationId: orgId,
                    variantId,
                    branchId,
                    quantity: 0,
                    minThreshold,
                })
                .returning()
            updated = created
        } else {
            const [row] = await db
                .update(inventoryVariantStocks)
                .set({ minThreshold, updatedAt: new Date() })
                .where(eq(inventoryVariantStocks.id, stockRow.id))
                .returning()
            updated = row
        }

        return ok(c, {
            id: updated.id,
            variantId,
            branchId,
            minThreshold: Number(updated.minThreshold ?? 0),
        })
    } catch (err: any) {
        console.error('[inventory/variant-stocks/threshold]', err)
        return errors.internal(c)
    }
})
