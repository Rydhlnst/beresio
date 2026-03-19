import { Hono } from 'hono'
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
    user,
} from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const DEFAULT_LIMIT = 100

async function adjustStockQuantity(tx: any, input: {
    orgId: string
    productId: string
    branchId: string
    delta: number
}) {
    const { orgId, productId, branchId, delta } = input
    const [existing] = await tx
        .select({
            id: inventoryStocks.id,
            quantity: inventoryStocks.quantity,
        })
        .from(inventoryStocks)
        .where(and(
            eq(inventoryStocks.organizationId, orgId),
            eq(inventoryStocks.productId, productId),
            eq(inventoryStocks.branchId, branchId),
        ))
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

    await tx
        .insert(inventoryStocks)
        .values({
            organizationId: orgId,
            productId,
            branchId,
            quantity: nextQty,
        })

    return nextQty
}

export const inventoryRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/inventory/products
inventoryRouter.get('/products', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

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
        if (branchId) stockConditions.push(eq(inventoryStocks.branchId, branchId))

        const stocks = await db
            .select({
                productId: inventoryStocks.productId,
                branchId: inventoryStocks.branchId,
                branchName: branches.name,
                quantity: inventoryStocks.quantity,
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
            })
            byProduct.set(stock.productId, list)
        }

        return ok(c, products.map((product: any) => ({
            ...product,
            stocks: byProduct.get(product.id) ?? [],
        })))
    } catch (err: any) {
        console.error('[inventory/products]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/inventory/adjustments
inventoryRouter.get('/adjustments', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
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
            .where(eq(inventoryAdjustments.organizationId, orgId))
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
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/inventory/adjustments
inventoryRouter.post('/adjustments', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()
        const body = await c.req.json().catch(() => null)

        const productId = body?.productId
        const branchId = body?.branchId
        const quantityDelta = Number(body?.quantityDelta ?? 0)
        const reason = body?.reason ?? null

        if (!productId || !branchId) return errors.badRequest(c, 'productId and branchId are required')
        if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
            return errors.badRequest(c, 'quantityDelta must be a non-zero number')
        }

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
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/inventory/transfers
inventoryRouter.get('/transfers', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
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
            .where(eq(inventoryTransfers.organizationId, orgId))
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
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/inventory/transfers
inventoryRouter.post('/transfers', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const requesterId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()
        const body = await c.req.json().catch(() => null)

        const productId = body?.productId
        const fromBranchId = body?.fromBranchId
        const toBranchId = body?.toBranchId
        const quantity = Number(body?.quantity ?? 0)
        const note = body?.note ?? null

        if (!productId || !fromBranchId || !toBranchId) {
            return errors.badRequest(c, 'productId, fromBranchId, toBranchId are required')
        }
        if (fromBranchId === toBranchId) return errors.badRequest(c, 'fromBranchId and toBranchId must differ')
        if (!Number.isFinite(quantity) || quantity <= 0) return errors.badRequest(c, 'quantity must be > 0')

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
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/inventory/transfers/:id
inventoryRouter.patch('/transfers/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const transferId = c.req.param('id')
        const body = await c.req.json().catch(() => null)
        const status = body?.status

        if (!['approved', 'rejected', 'cancelled'].includes(status)) {
            return errors.badRequest(c, 'status must be approved, rejected, or cancelled')
        }

        const [transferRow] = await db
            .select()
            .from(inventoryTransfers)
            .where(and(eq(inventoryTransfers.id, transferId), eq(inventoryTransfers.organizationId, orgId)))
            .limit(1)

        if (!transferRow) return errors.notFound(c, 'Transfer not found')
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
        return errors.internal(c, err.message)
    }
})
