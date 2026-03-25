import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, desc, eq, ilike, gte, lte, inArray } from 'drizzle-orm'
import { branches, customers, orderEvents, orderItems, orders } from '@beresio/db'
import { generateOrderNumber } from '../../lib/order-number'
import {
    adjustStockQuantity,
    recordStockMovement,
    resolveInventoryBySku,
} from '../../lib/stock'
import { getAccessibleBranchIds, getBranchAccessContext, hasBranchAccess } from '../../lib/branch-access'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const ordersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/orders
// Optional query: status, branchId, type, q, limit
ordersRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const status = c.req.query('status')
        const branchId = c.req.query('branchId')
        const type = c.req.query('type')
        const q = c.req.query('q')
        const dateFrom = c.req.query('dateFrom')
        const dateTo = c.req.query('dateTo')
        const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)

        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (branchIds.length === 0 && !isOrgWide) return errors.forbidden(c, 'No branch access')
        if (branchIds.length === 0 && isOrgWide) {
            if (branchId) return errors.forbidden(c, 'No access to branch')
            return ok(c, [])
        }

        const conditions = [eq(orders.organizationId, orgId)]
        if (status) conditions.push(eq(orders.status, status))
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) {
                return errors.forbidden(c, 'No access to branch')
            }
            conditions.push(eq(orders.branchId, branchId))
        } else {
            conditions.push(inArray(orders.branchId, branchIds))
        }
        if (type) conditions.push(eq(orders.type, type))
        if (q) {
            conditions.push(
                ilike(orders.orderNumber, `%${q}%`)
            )
        }
        if (dateFrom) {
            const from = new Date(`${dateFrom}T00:00:00.000Z`)
            if (Number.isNaN(from.getTime())) return errors.badRequest(c, 'Invalid dateFrom')
            conditions.push(gte(orders.createdAt, from))
        }
        if (dateTo) {
            const to = new Date(`${dateTo}T23:59:59.999Z`)
            if (Number.isNaN(to.getTime())) return errors.badRequest(c, 'Invalid dateTo')
            conditions.push(lte(orders.createdAt, to))
        }

        const rows = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                status: orders.status,
                type: orders.type,
                totalAmount: orders.totalAmount,
                paymentStatus: orders.paymentStatus,
                paymentMethod: orders.paymentMethod,
                createdAt: orders.createdAt,
                branchId: orders.branchId,
                branchName: branches.name,
                customerId: orders.customerId,
                customerName: customers.name,
            })
            .from(orders)
            .leftJoin(branches, eq(orders.branchId, branches.id))
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(and(...conditions))
            .orderBy(desc(orders.createdAt))
            .limit(limit)

        return ok(c, rows.map((row: any) => ({
            id: row.id,
            orderNumber: row.orderNumber,
            status: row.status,
            type: row.type,
            totalAmount: Number(row.totalAmount ?? 0),
            paymentStatus: row.paymentStatus,
            paymentMethod: row.paymentMethod,
            createdAt: row.createdAt,
            branch: row.branchName ? { id: row.branchId, name: row.branchName } : null,
            customer: row.customerName ? { id: row.customerId, name: row.customerName } : null,
        })))
    } catch (err: any) {
        console.error('[orders]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/orders/:id
ordersRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')

        const orderId = c.req.param('id')

        const [orderRow] = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                status: orders.status,
                type: orders.type,
                subtotalAmount: orders.subtotalAmount,
                discountAmount: orders.discountAmount,
                taxAmount: orders.taxAmount,
                totalAmount: orders.totalAmount,
                paymentStatus: orders.paymentStatus,
                paymentMethod: orders.paymentMethod,
                notes: orders.notes,
                createdAt: orders.createdAt,
                updatedAt: orders.updatedAt,
                completedAt: orders.completedAt,
                cancelledAt: orders.cancelledAt,
                branchId: orders.branchId,
                branchName: branches.name,
                customerId: orders.customerId,
                customerName: customers.name,
            })
            .from(orders)
            .leftJoin(branches, eq(orders.branchId, branches.id))
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)

        if (!orderRow) return errors.notFound(c, 'Order not found')
        if (!hasBranchAccess(branchIds, orderRow.branchId)) {
            return errors.forbidden(c, 'No access to branch')
        }

            const [items, events] = await Promise.all([
                db
                    .select({
                        id: orderItems.id,
                        name: orderItems.name,
                        sku: orderItems.sku,
                        quantity: orderItems.quantity,
                        unitPrice: orderItems.unitPrice,
                        totalPrice: orderItems.totalPrice,
                        createdAt: orderItems.createdAt,
                    })
                .from(orderItems)
                .where(eq(orderItems.orderId, orderId)),
            db
                .select({
                    id: orderEvents.id,
                    status: orderEvents.status,
                    note: orderEvents.note,
                    actorId: orderEvents.actorId,
                    createdAt: orderEvents.createdAt,
                })
                .from(orderEvents)
                .where(and(eq(orderEvents.orderId, orderId), eq(orderEvents.organizationId, orgId)))
                .orderBy(desc(orderEvents.createdAt)),
        ])

        return ok(c, {
            id: orderRow.id,
            orderNumber: orderRow.orderNumber,
            status: orderRow.status,
            type: orderRow.type,
            subtotalAmount: Number(orderRow.subtotalAmount ?? 0),
            discountAmount: Number(orderRow.discountAmount ?? 0),
            taxAmount: Number(orderRow.taxAmount ?? 0),
            totalAmount: Number(orderRow.totalAmount ?? 0),
            paymentStatus: orderRow.paymentStatus,
            paymentMethod: orderRow.paymentMethod,
            notes: orderRow.notes,
            createdAt: orderRow.createdAt,
            updatedAt: orderRow.updatedAt,
            completedAt: orderRow.completedAt,
            cancelledAt: orderRow.cancelledAt,
            branch: orderRow.branchName ? { id: orderRow.branchId, name: orderRow.branchName } : null,
            customer: orderRow.customerName ? { id: orderRow.customerId, name: orderRow.customerName } : null,
            items: items.map((item: any) => ({
                id: item.id,
                name: item.name,
                sku: item.sku ?? null,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                totalPrice: Number(item.totalPrice ?? 0),
                createdAt: item.createdAt,
            })),
            events: events.map((event: any) => ({
                id: event.id,
                status: event.status,
                note: event.note,
                actorId: event.actorId,
                createdAt: event.createdAt,
            })),
        })
    } catch (err: any) {
        console.error('[orders/:id]', err)
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/orders
ordersRouter.post('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')

        const body = await c.req.json().catch(() => null)
        const branchId = body?.branchId
        const customerId = body?.customerId ?? null
        const type = body?.type ?? 'walk_in'
        const status = body?.status ?? 'pending'
        const paymentStatus = body?.paymentStatus ?? 'pending'
        const paymentMethod = body?.paymentMethod ?? null
        const notes = body?.notes ?? null
        const items = Array.isArray(body?.items) ? body.items : []

        if (!branchId) return errors.badRequest(c, 'branchId is required')
        if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, 'No access to branch')
        if (items.length === 0) return errors.badRequest(c, 'items are required')

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

        const normalizedItems = items.map((item: any) => ({
            name: String(item?.name ?? '').trim(),
            quantity: Number(item?.quantity ?? 0),
            unitPrice: Number(item?.unitPrice ?? 0),
            sku: item?.sku ? String(item.sku).trim() : null,
            inventoryProductId: item?.inventoryProductId ? String(item.inventoryProductId) : null,
        }))

        if (normalizedItems.some((item: any) => !item.name || item.quantity <= 0 || item.unitPrice < 0)) {
            return errors.badRequest(c, 'Invalid item payload')
        }

        const subtotalAmount = normalizedItems.reduce(
            (sum: number, item: any) => sum + item.quantity * item.unitPrice,
            0
        )
        const discountAmount = Number(body?.discountAmount ?? 0)
        const taxAmount = Number(body?.taxAmount ?? 0)
        const totalAmount = Math.max(0, subtotalAmount - discountAmount + taxAmount)

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const created = await db.transaction(async (tx: any) => {
            const skuList = normalizedItems
                .map((item: any) => item.sku)
                .filter(Boolean) as string[]
            const skuMap = await resolveInventoryBySku(tx, orgId, Array.from(new Set(skuList)))

            for (const item of normalizedItems) {
                if (item.sku) {
                    const mapped = skuMap.get(item.sku)
                    if (!mapped) {
                        throw new Error('INVALID_INVENTORY_SKU')
                    }
                    item.inventoryProductId = mapped
                }
            }

            const orderNumber = await generateOrderNumber(tx, orgId)

            const [orderRow] = await tx
                .insert(orders)
                .values({
                    organizationId: orgId,
                    branchId,
                    customerId,
                    orderNumber,
                    status,
                    type,
                    subtotalAmount,
                    discountAmount,
                    taxAmount,
                    totalAmount,
                    paymentStatus,
                    paymentMethod,
                    notes,
                    completedAt: status === 'completed' ? new Date() : null,
                    cancelledAt: status === 'cancelled' ? new Date() : null,
                })
                .returning()

            const itemRows = await tx
                .insert(orderItems)
                .values(
                    normalizedItems.map((item: any) => ({
                        orderId: orderRow.id,
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice,
                        inventoryProductId: item.inventoryProductId,
                        sku: item.sku,
                    }))
                )
                .returning()

            if (status !== 'cancelled') {
                for (const item of normalizedItems) {
                    if (!item.inventoryProductId) continue
                    await adjustStockQuantity(tx, {
                        orgId,
                        productId: item.inventoryProductId,
                        branchId,
                        delta: -item.quantity,
                    })
                    await recordStockMovement(tx, {
                        orgId,
                        productId: item.inventoryProductId,
                        branchId,
                        delta: -item.quantity,
                        reason: 'order_item_created',
                        refType: 'order',
                        refId: orderRow.id,
                        actorId,
                    })
                }
            }

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId: orderRow.id,
                    status,
                    note: body?.eventNote ?? null,
                    actorId,
                })

            return { order: orderRow, items: itemRows }
        })

        return ok(c, {
            id: created.order.id,
            orderNumber: created.order.orderNumber,
            status: created.order.status,
            type: created.order.type,
            subtotalAmount: Number(created.order.subtotalAmount ?? 0),
            discountAmount: Number(created.order.discountAmount ?? 0),
            taxAmount: Number(created.order.taxAmount ?? 0),
            totalAmount: Number(created.order.totalAmount ?? 0),
            paymentStatus: created.order.paymentStatus,
            paymentMethod: created.order.paymentMethod,
            notes: created.order.notes,
            createdAt: created.order.createdAt,
            items: created.items.map((item: any) => ({
                id: item.id,
                name: item.name,
                sku: item.sku ?? null,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                totalPrice: Number(item.totalPrice ?? 0),
            })),
        })
    } catch (err: any) {
        console.error('[orders/create]', err)
        if (err?.message === 'INSUFFICIENT_STOCK') {
            return errors.badRequest(c, 'Stok tidak mencukupi')
        }
        if (err?.message === 'INVALID_INVENTORY_SKU') {
            return errors.badRequest(c, 'SKU inventory tidak valid')
        }
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/orders/:id
ordersRouter.patch('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')

        const orderId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const [existing] = await db
            .select({ id: orders.id, status: orders.status })
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Order not found')

        const allowedStatus = ['pending', 'processing', 'completed', 'cancelled']
        const allowedType = ['pickup', 'delivery', 'walk_in']
        const allowedPaymentStatus = ['pending', 'paid', 'refunded', 'failed']

        if (body?.status && !allowedStatus.includes(body.status)) {
            return errors.badRequest(c, 'Invalid status')
        }
        if (body?.type && !allowedType.includes(body.type)) {
            return errors.badRequest(c, 'Invalid type')
        }
        if (body?.paymentStatus && !allowedPaymentStatus.includes(body.paymentStatus)) {
            return errors.badRequest(c, 'Invalid payment status')
        }

        if (body?.customerId) {
            const [customerRow] = await db
                .select({ id: customers.id })
                .from(customers)
                .where(and(eq(customers.id, body.customerId), eq(customers.organizationId, orgId)))
                .limit(1)
            if (!customerRow) return errors.badRequest(c, 'Customer not found')
        }

        const updates: any = {
            paymentStatus: body?.paymentStatus ?? undefined,
            paymentMethod: body?.paymentMethod ?? undefined,
            notes: body?.notes ?? undefined,
            type: body?.type ?? undefined,
            customerId: body?.customerId ?? undefined,
        }

        if (body?.status) {
            updates.status = body.status
            updates.completedAt = body.status === 'completed' ? new Date() : null
            updates.cancelledAt = body.status === 'cancelled' ? new Date() : null
        }

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const result = await db.transaction(async (tx: any) => {
            if (body?.status && body.status !== existing.status) {
                const shouldRestock = body.status === 'cancelled' && existing.status !== 'cancelled'
                const shouldDeduct = existing.status === 'cancelled' && body.status !== 'cancelled'

                if (shouldRestock || shouldDeduct) {
                    const [orderRow] = await tx
                        .select({
                            branchId: orders.branchId,
                        })
                        .from(orders)
                        .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
                        .limit(1)

                    const items = await tx
                        .select({
                            inventoryProductId: orderItems.inventoryProductId,
                            quantity: orderItems.quantity,
                        })
                        .from(orderItems)
                        .where(eq(orderItems.orderId, orderId))

                    for (const item of items) {
                        if (!item.inventoryProductId) continue
                        const delta = shouldRestock ? Number(item.quantity ?? 0) : -Number(item.quantity ?? 0)
                        await adjustStockQuantity(tx, {
                            orgId,
                            productId: item.inventoryProductId,
                            branchId: orderRow.branchId,
                            delta,
                        })
                        await recordStockMovement(tx, {
                            orgId,
                            productId: item.inventoryProductId,
                            branchId: orderRow.branchId,
                            delta,
                            reason: shouldRestock ? 'order_cancelled_return' : 'order_reactivated',
                            refType: 'order',
                            refId: orderId,
                            actorId,
                        })
                    }
                }
            }

            const [updated] = await tx
                .update(orders)
                .set(updates)
                .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
                .returning()

            if (body?.status && body.status !== existing.status) {
                await tx
                    .insert(orderEvents)
                    .values({
                        organizationId: orgId,
                        orderId,
                        status: body.status,
                        note: body?.eventNote ?? null,
                        actorId,
                    })
            }

            return updated
        })

        return ok(c, result)
    } catch (err: any) {
        console.error('[orders/update]', err)
        if (err?.message === 'INSUFFICIENT_STOCK') {
            return errors.badRequest(c, 'Stok tidak mencukupi')
        }
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/orders/:id/items
ordersRouter.patch('/:id/items', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')

        const orderId = c.req.param('id')
        const body = await c.req.json().catch(() => null)
        const items = Array.isArray(body?.items) ? body.items : []

        if (items.length === 0) return errors.badRequest(c, 'items are required')

        const normalizedItems = items.map((item: any) => ({
            name: String(item?.name ?? '').trim(),
            quantity: Number(item?.quantity ?? 0),
            unitPrice: Number(item?.unitPrice ?? 0),
            sku: item?.sku ? String(item.sku).trim() : null,
            inventoryProductId: item?.inventoryProductId ? String(item.inventoryProductId) : null,
        }))

        if (normalizedItems.some((item: any) => !item.name || item.quantity <= 0 || item.unitPrice < 0)) {
            return errors.badRequest(c, 'Invalid item payload')
        }

        const [orderRow] = await db
            .select({
                id: orders.id,
                discountAmount: orders.discountAmount,
                taxAmount: orders.taxAmount,
                branchId: orders.branchId,
            })
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)

        if (!orderRow) return errors.notFound(c, 'Order not found')
        if (!hasBranchAccess(branchIds, orderRow.branchId)) {
            return errors.forbidden(c, 'No access to branch')
        }

        const subtotalAmount = normalizedItems.reduce(
            (sum: number, item: any) => sum + item.quantity * item.unitPrice,
            0
        )
        const totalAmount = Math.max(
            0,
            subtotalAmount - Number(orderRow.discountAmount ?? 0) + Number(orderRow.taxAmount ?? 0)
        )

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const result = await db.transaction(async (tx: any) => {
            const skuList = normalizedItems
                .map((item: any) => item.sku)
                .filter(Boolean) as string[]
            const skuMap = await resolveInventoryBySku(tx, orgId, Array.from(new Set(skuList)))

            for (const item of normalizedItems) {
                if (item.sku) {
                    const mapped = skuMap.get(item.sku)
                    if (!mapped) {
                        throw new Error('INVALID_INVENTORY_SKU')
                    }
                    item.inventoryProductId = mapped
                }
            }

            const existingItems = await tx
                .select({
                    inventoryProductId: orderItems.inventoryProductId,
                    quantity: orderItems.quantity,
                })
                .from(orderItems)
                .where(eq(orderItems.orderId, orderId))

            await tx
                .delete(orderItems)
                .where(eq(orderItems.orderId, orderId))

            const insertedItems = await tx
                .insert(orderItems)
                .values(
                    normalizedItems.map((item: any) => ({
                        orderId,
                        name: item.name,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice,
                        inventoryProductId: item.inventoryProductId,
                        sku: item.sku,
                    }))
                )
                .returning()

            const diffByProduct = new Map<string, number>()
            for (const row of existingItems) {
                const productId = row.inventoryProductId
                if (!productId) continue
                diffByProduct.set(productId, (diffByProduct.get(productId) ?? 0) - Number(row.quantity ?? 0))
            }
            for (const item of normalizedItems) {
                if (!item.inventoryProductId) continue
                diffByProduct.set(
                    item.inventoryProductId,
                    (diffByProduct.get(item.inventoryProductId) ?? 0) + Number(item.quantity ?? 0)
                )
            }

            const [updated] = await tx
                .update(orders)
                .set({
                    subtotalAmount,
                    totalAmount,
                })
                .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
                .returning()

            for (const [productId, diff] of diffByProduct.entries()) {
                if (diff === 0) continue
                const delta = -diff
                await adjustStockQuantity(tx, {
                    orgId,
                    productId,
                    branchId: orderRow.branchId,
                    delta,
                })
                await recordStockMovement(tx, {
                    orgId,
                    productId,
                    branchId: orderRow.branchId,
                    delta,
                    reason: 'order_items_updated',
                    refType: 'order',
                    refId: orderId,
                    actorId,
                })
            }

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId,
                    status: updated.status,
                    note: body?.eventNote ?? 'Item diperbarui',
                    actorId,
                })

            return { updated, items: insertedItems }
        })

            return ok(c, {
                order: result.updated,
                items: result.items,
            })
    } catch (err: any) {
        console.error('[orders/items]', err)
        if (err?.message === 'INSUFFICIENT_STOCK') {
            return errors.badRequest(c, 'Stok tidak mencukupi')
        }
        if (err?.message === 'INVALID_INVENTORY_SKU') {
            return errors.badRequest(c, 'SKU inventory tidak valid')
        }
        return errors.internal(c, err.message)
    }
})
