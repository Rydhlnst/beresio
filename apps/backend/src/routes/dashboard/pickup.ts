import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, desc, eq, gte, inArray } from 'drizzle-orm'
import { customers, orderItems, orders, pickupOrders } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const DEFAULT_LIMIT = 100
const DEFAULT_DAYS = 3
const STATUS_OPTIONS = ['Dikonfirmasi', 'Dicuci', 'Siap Diantar', 'Dalam Pengiriman', 'Selesai']

async function ensurePickupRow(db: any, input: {
    orgId: string
    orderId: string
    address: string | null
}) {
    const { orgId, orderId, address } = input
    const [existing] = await db
        .select()
        .from(pickupOrders)
        .where(and(eq(pickupOrders.organizationId, orgId), eq(pickupOrders.orderId, orderId)))
        .limit(1)

    if (existing) return existing

    try {
        const [created] = await db
            .insert(pickupOrders)
            .values({
                organizationId: orgId,
                orderId,
                status: 'Dikonfirmasi',
                address,
            })
            .returning()

        return created
    } catch {
        const [fallback] = await db
            .select()
            .from(pickupOrders)
            .where(and(eq(pickupOrders.organizationId, orgId), eq(pickupOrders.orderId, orderId)))
            .limit(1)
        if (fallback) return fallback
        throw new Error('PICKUP_CREATE_FAILED')
    }
}

export const pickupRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/pickup
pickupRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_LIMIT), 200)
        const days = Math.max(Number(c.req.query('days') ?? DEFAULT_DAYS), 1)

        const since = new Date()
        since.setUTCDate(since.getUTCDate() - (days - 1))
        const sinceDate = new Date(Date.UTC(
            since.getUTCFullYear(),
            since.getUTCMonth(),
            since.getUTCDate(),
        ))

        const rows = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                customerId: orders.customerId,
                customerName: customers.name,
                customerAddress: customers.address,
                pickupStatus: pickupOrders.status,
                driverName: pickupOrders.driverName,
                eta: pickupOrders.eta,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .leftJoin(pickupOrders, eq(pickupOrders.orderId, orders.id))
            .where(and(
                eq(orders.organizationId, orgId),
                inArray(orders.type, ['pickup', 'delivery']),
                gte(orders.createdAt, sinceDate),
            ))
            .orderBy(desc(orders.createdAt))
            .limit(limit)

        const orderIds = rows.map((row: any) => row.id)
        const itemRows = orderIds.length === 0
            ? []
            : await db
                .select({
                    orderId: orderItems.orderId,
                    name: orderItems.name,
                })
                .from(orderItems)
                .where(inArray(orderItems.orderId, orderIds))

        const itemsByOrder = new Map<string, string[]>()
        for (const item of itemRows) {
            const list = itemsByOrder.get(item.orderId) ?? []
            list.push(item.name)
            itemsByOrder.set(item.orderId, list)
        }

        const data = await Promise.all(rows.map(async (row: any) => {
            const pickupRow = row.pickupStatus
                ? {
                    status: row.pickupStatus,
                    driverName: row.driverName,
                    eta: row.eta,
                }
                : null

            if (!pickupRow) {
                const created = await ensurePickupRow(db, {
                    orgId,
                    orderId: row.id,
                    address: row.customerAddress ?? null,
                })
                return {
                    id: row.id,
                    orderNumber: row.orderNumber,
                    customer: row.customerName ?? 'Unknown',
                    address: created.address ?? row.customerAddress ?? null,
                    status: created.status,
                    driver: created.driverName ?? null,
                    eta: created.eta ?? null,
                    items: itemsByOrder.get(row.id) ?? [],
                }
            }

            return {
                id: row.id,
                orderNumber: row.orderNumber,
                customer: row.customerName ?? 'Unknown',
                address: row.customerAddress ?? null,
                status: row.pickupStatus ?? 'Dikonfirmasi',
                driver: row.driverName ?? null,
                eta: row.eta ?? null,
                items: itemsByOrder.get(row.id) ?? [],
            }
        }))

        return ok(c, data)
    } catch (err: any) {
        console.error('[pickup/list]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/pickup/:id
pickupRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const orderId = c.req.param('id')

        const [orderRow] = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                customerId: orders.customerId,
                customerName: customers.name,
                customerAddress: customers.address,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)

        if (!orderRow) return errors.notFound(c, 'Order not found')

        const pickupRow = await ensurePickupRow(db, {
            orgId,
            orderId: orderRow.id,
            address: orderRow.customerAddress ?? null,
        })

        const items = await db
            .select({
                id: orderItems.id,
                name: orderItems.name,
                quantity: orderItems.quantity,
            })
            .from(orderItems)
            .where(eq(orderItems.orderId, orderId))

        return ok(c, {
            id: orderRow.id,
            orderNumber: orderRow.orderNumber,
            customer: orderRow.customerName ?? 'Unknown',
            address: pickupRow.address ?? orderRow.customerAddress ?? null,
            status: pickupRow.status,
            driver: pickupRow.driverName ?? null,
            eta: pickupRow.eta ?? null,
            items: items.map((item: any) => `${item.name}`),
            createdAt: orderRow.createdAt,
        })
    } catch (err: any) {
        console.error('[pickup/detail]', err)
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/pickup/:id/status
pickupRouter.patch('/:id/status', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const orderId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const status = body?.status
        if (!STATUS_OPTIONS.includes(status)) return errors.badRequest(c, 'Invalid status')

        const [orderRow] = await db
            .select({
                id: orders.id,
                customerAddress: customers.address,
            })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)

        if (!orderRow) return errors.notFound(c, 'Order not found')

        const existing = await ensurePickupRow(db, {
            orgId,
            orderId,
            address: orderRow.customerAddress ?? null,
        })

        const [updated] = await db
            .update(pickupOrders)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(eq(pickupOrders.id, existing.id))
            .returning()

        return ok(c, updated)
    } catch (err: any) {
        console.error('[pickup/status]', err)
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/pickup/:id/assign-driver
pickupRouter.patch('/:id/assign-driver', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const orderId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const driverName = body?.driverName?.trim()
        if (!driverName) return errors.badRequest(c, 'driverName is required')

        const [orderRow] = await db
            .select({
                id: orders.id,
                customerAddress: customers.address,
            })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)

        if (!orderRow) return errors.notFound(c, 'Order not found')

        const existing = await ensurePickupRow(db, {
            orgId,
            orderId,
            address: orderRow.customerAddress ?? null,
        })

        const [updated] = await db
            .update(pickupOrders)
            .set({
                driverName,
                updatedAt: new Date(),
            })
            .where(eq(pickupOrders.id, existing.id))
            .returning()

        return ok(c, updated)
    } catch (err: any) {
        console.error('[pickup/assign-driver]', err)
        return errors.internal(c, err.message)
    }
})
