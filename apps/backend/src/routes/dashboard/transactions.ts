import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm'
import {
    branches,
    customers,
    inventoryStocks,
    products,
    stockMovements,
    transactionItems,
    transactions,
} from '@beresio/db'
import { getAccessibleBranchIds, getBranchAccessContext, hasBranchAccess } from '../../lib/branch-access'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const DEFAULT_LIMIT = 50
const ALLOWED_STATUS = ['pending', 'paid', 'refunded'] as const
const ALLOWED_TYPE = ['sale', 'dp', 'pelunasan', 'refund'] as const

const transactionItemSchema = z.object({
    productId: z.string().trim().min(1, 'productId is required'),
    quantity: z.coerce.number().finite().gt(0, 'quantity must be > 0'),
    unitPrice: z.coerce.number().finite().min(0, 'unitPrice must be >= 0'),
})

const createTransactionSchema = z.object({
    branchId: z.string().trim().min(1, 'branchId is required'),
    customerId: z.string().trim().min(1).nullable().optional(),
    status: z.enum(ALLOWED_STATUS).default('paid'),
    type: z.enum(ALLOWED_TYPE).default('sale'),
    paymentMethod: z.string().trim().min(1).nullable().optional(),
    notes: z.string().nullable().optional(),
    discountAmount: z.coerce.number().finite().min(0, 'discountAmount must be >= 0').default(0),
    taxAmount: z.coerce.number().finite().min(0, 'taxAmount must be >= 0').default(0),
    items: z.array(transactionItemSchema).min(1, 'items are required'),
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

async function recordStockMovement(tx: any, input: {
    orgId: string
    productId: string
    branchId: string
    delta: number
    refId: string
    reason?: string | null
    actorId?: string | null
}) {
    const { orgId, productId, branchId, delta, refId, reason, actorId } = input
    await tx
        .insert(stockMovements)
        .values({
            organizationId: orgId,
            productId,
            branchId,
            delta,
            reason: reason ?? null,
            refType: 'transaction',
            refId,
            actorId: actorId ?? null,
        })
}

export const transactionsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/transactions
transactionsRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.query('branchId')
        const customerId = c.req.query('customerId')
        const status = c.req.query('status')
        const type = c.req.query('type')
        const dateFrom = c.req.query('dateFrom')
        const dateTo = c.req.query('dateTo')
        const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_LIMIT), 200)

        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, 'No branch access')
        if (branchIds.length === 0 && isOrgWide) {
            if (branchId) return errors.forbidden(c, 'No access to branch')
            return ok(c, [])
        }

        const conditions = [eq(transactions.organizationId, orgId)]
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) {
                return errors.forbidden(c, 'No access to branch')
            }
            conditions.push(eq(transactions.branchId, branchId))
        } else {
            conditions.push(inArray(transactions.branchId, branchIds))
        }
        if (customerId) conditions.push(eq(transactions.customerId, customerId))
        if (status) conditions.push(eq(transactions.status, status))
        if (type) conditions.push(eq(transactions.type, type))
        if (dateFrom) {
            const from = new Date(`${dateFrom}T00:00:00.000Z`)
            if (Number.isNaN(from.getTime())) return errors.badRequest(c, 'Invalid dateFrom')
            conditions.push(gte(transactions.createdAt, from))
        }
        if (dateTo) {
            const to = new Date(`${dateTo}T23:59:59.999Z`)
            if (Number.isNaN(to.getTime())) return errors.badRequest(c, 'Invalid dateTo')
            conditions.push(lte(transactions.createdAt, to))
        }

        const rows = await db
            .select({
                id: transactions.id,
                amount: transactions.amount,
                discountAmount: transactions.discountAmount,
                taxAmount: transactions.taxAmount,
                status: transactions.status,
                type: transactions.type,
                paymentMethod: transactions.paymentMethod,
                createdAt: transactions.createdAt,
                branchId: branches.id,
                branchName: branches.name,
                customerId: customers.id,
                customerName: customers.name,
            })
            .from(transactions)
            .leftJoin(branches, eq(transactions.branchId, branches.id))
            .leftJoin(customers, eq(transactions.customerId, customers.id))
            .where(and(...conditions))
            .orderBy(desc(transactions.createdAt))
            .limit(limit)

        return ok(c, rows.map((row: any) => ({
            id: row.id,
            amount: Number(row.amount ?? 0),
            discountAmount: Number(row.discountAmount ?? 0),
            taxAmount: Number(row.taxAmount ?? 0),
            status: row.status,
            type: row.type,
            paymentMethod: row.paymentMethod,
            createdAt: row.createdAt,
            branch: row.branchName ? { id: row.branchId, name: row.branchName } : null,
            customer: row.customerName ? { id: row.customerId, name: row.customerName } : null,
        })))
    } catch (err: any) {
        console.error('[transactions/list]', err)
        return errors.internal(c)
    }
})

// GET /api/dashboard/transactions/:id
transactionsRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')
        const transactionId = c.req.param('id')

        const [row] = await db
            .select({
                id: transactions.id,
                amount: transactions.amount,
                discountAmount: transactions.discountAmount,
                taxAmount: transactions.taxAmount,
                status: transactions.status,
                type: transactions.type,
                paymentMethod: transactions.paymentMethod,
                notes: transactions.notes,
                createdAt: transactions.createdAt,
                updatedAt: transactions.updatedAt,
                branchId: branches.id,
                branchName: branches.name,
                customerId: customers.id,
                customerName: customers.name,
            })
            .from(transactions)
            .leftJoin(branches, eq(transactions.branchId, branches.id))
            .leftJoin(customers, eq(transactions.customerId, customers.id))
            .where(and(eq(transactions.id, transactionId), eq(transactions.organizationId, orgId)))
            .limit(1)

        if (!row) return errors.notFound(c, 'Transaction not found')
        if (!hasBranchAccess(branchIds, row.branchId)) {
            return errors.forbidden(c, 'No access to branch')
        }

        const items = await db
            .select({
                id: transactionItems.id,
                productId: transactionItems.productId,
                productName: products.name,
                quantity: transactionItems.quantity,
                unitPrice: transactionItems.unitPrice,
                subtotal: transactionItems.subtotal,
            })
            .from(transactionItems)
            .leftJoin(products, eq(transactionItems.productId, products.id))
            .where(eq(transactionItems.transactionId, transactionId))

        return ok(c, {
            id: row.id,
            amount: Number(row.amount ?? 0),
            discountAmount: Number(row.discountAmount ?? 0),
            taxAmount: Number(row.taxAmount ?? 0),
            status: row.status,
            type: row.type,
            paymentMethod: row.paymentMethod,
            notes: row.notes,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            branch: row.branchName ? { id: row.branchId, name: row.branchName } : null,
            customer: row.customerName ? { id: row.customerId, name: row.customerName } : null,
            items: items.map((item: any) => ({
                id: item.id,
                product: item.productName ? { id: item.productId, name: item.productName } : null,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                subtotal: Number(item.subtotal ?? 0),
            })),
        })
    } catch (err: any) {
        console.error('[transactions/detail]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/transactions
transactionsRouter.post('/', authMiddleware, async (c) => {
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
        const parsedBody = createTransactionSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const {
            branchId,
            customerId,
            status,
            type,
            paymentMethod,
            notes,
            discountAmount,
            taxAmount,
            items,
        } = parsedBody.data

        if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, 'No access to branch')

        const [branchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .limit(1)
        if (!branchRow) return errors.badRequest(c, 'Branch not found')

        if (customerId) {
            const [customerRow] = await db
                .select({ id: customers.id })
                .from(customers)
                .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
                .limit(1)
            if (!customerRow) return errors.badRequest(c, 'Customer not found')
        }

        const normalizedItems = items

        const productIds = normalizedItems.map((item: any) => item.productId)
        const productRows = await db
            .select({
                id: products.id,
                name: products.name,
                inventoryProductId: products.inventoryProductId,
            })
            .from(products)
            .where(and(
                eq(products.organizationId, orgId),
                inArray(products.id, productIds),
            ))

        if (productRows.length !== productIds.length) {
            return errors.badRequest(c, 'Product not found')
        }

        const productMap = new Map<string, { id: string; inventoryProductId: string | null }>()
        for (const p of productRows) {
            productMap.set(p.id, { id: p.id, inventoryProductId: p.inventoryProductId ?? null })
        }

        const inventoryIds = productRows
            .map((p) => p.inventoryProductId)
            .filter((id): id is string => Boolean(id))

        const stockMap = new Map<string, number>()
        if (inventoryIds.length > 0) {
            const stockRows = await db
                .select({
                    productId: inventoryStocks.productId,
                    quantity: inventoryStocks.quantity,
                })
                .from(inventoryStocks)
                .where(and(
                    eq(inventoryStocks.organizationId, orgId),
                    eq(inventoryStocks.branchId, branchId),
                    inArray(inventoryStocks.productId, inventoryIds),
                ))

            for (const row of stockRows) {
                stockMap.set(row.productId, Number(row.quantity ?? 0))
            }
        }

        const stockDelta = type === 'refund' ? 1 : -1
        for (const item of normalizedItems) {
            const productInfo = productMap.get(item.productId)
            if (!productInfo?.inventoryProductId) continue
            const available = stockMap.get(productInfo.inventoryProductId) ?? 0
            const nextQty = available + stockDelta * item.quantity
            if (nextQty < 0) return errors.badRequest(c, 'Insufficient stock')
            stockMap.set(productInfo.inventoryProductId, nextQty)
        }

        const subtotal = normalizedItems.reduce(
            (sum: number, item: any) => sum + item.quantity * item.unitPrice,
            0
        )
        const amount = Math.max(0, subtotal - discountAmount + taxAmount)

        const created = await db.transaction(async (tx: any) => {
            const [transaction] = await tx
                .insert(transactions)
                .values({
                    organizationId: orgId,
                    branchId,
                    customerId,
                    paymentMethod,
                    discountAmount,
                    taxAmount,
                    amount,
                    status,
                    type,
                    notes,
                    createdBy: actorId,
                })
                .returning()

            const itemRows = await tx
                .insert(transactionItems)
                .values(
                    normalizedItems.map((item: any) => ({
                        transactionId: transaction.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        subtotal: item.quantity * item.unitPrice,
                    }))
                )
                .returning()

            for (const item of normalizedItems) {
                const productInfo = productMap.get(item.productId)
                if (!productInfo?.inventoryProductId) continue

                const delta = stockDelta * item.quantity

                const [existing] = await tx
                    .select({ id: inventoryStocks.id, quantity: inventoryStocks.quantity })
                    .from(inventoryStocks)
                    .where(and(
                        eq(inventoryStocks.organizationId, orgId),
                        eq(inventoryStocks.branchId, branchId),
                        eq(inventoryStocks.productId, productInfo.inventoryProductId),
                    ))
                    .limit(1)

                if (!existing) {
                    await tx
                        .insert(inventoryStocks)
                        .values({
                            organizationId: orgId,
                            productId: productInfo.inventoryProductId,
                            branchId,
                            quantity: delta,
                            minThreshold: 0,
                        })
                } else {
                    const nextQty = Number(existing.quantity ?? 0) + delta
                    if (nextQty < 0) throw new Error('INSUFFICIENT_STOCK')
                    await tx
                        .update(inventoryStocks)
                        .set({ quantity: nextQty, updatedAt: new Date() })
                        .where(eq(inventoryStocks.id, existing.id))
                }

                await recordStockMovement(tx, {
                    orgId,
                    productId: productInfo.inventoryProductId,
                    branchId,
                    delta,
                    refId: transaction.id,
                    reason: type === 'refund' ? 'Refund transaction' : 'Retail sale',
                    actorId,
                })
            }

            return { transaction, items: itemRows }
        })

        return ok(c, {
            id: created.transaction.id,
            amount: Number(created.transaction.amount ?? 0),
            discountAmount: Number(created.transaction.discountAmount ?? 0),
            taxAmount: Number(created.transaction.taxAmount ?? 0),
            status: created.transaction.status,
            type: created.transaction.type,
            paymentMethod: created.transaction.paymentMethod,
            createdAt: created.transaction.createdAt,
            items: created.items.map((item: any) => ({
                id: item.id,
                productId: item.productId,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                subtotal: Number(item.subtotal ?? 0),
            })),
        })
    } catch (err: any) {
        console.error('[transactions/create]', err)
        if (err?.message === 'INSUFFICIENT_STOCK') {
            return errors.badRequest(c, 'Insufficient stock')
        }
        return errors.internal(c)
    }
})
