import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, asc, desc, eq, ilike, gte, lte, inArray, isNull, or } from 'drizzle-orm'
import {
    branches,
    customers,
    customerAnalytics,
    fnbMenuScheduleRules,
    fnbTableSessions,
    fnbTables,
    orderBillParts,
    orderEvents,
    orderItems,
    orders,
} from '@beresio/db'
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

const ALLOWED_ORDER_STATUS = ['pending', 'processing', 'completed', 'cancelled']
const ALLOWED_ORDER_TYPE = ['pickup', 'delivery', 'walk_in']
const ALLOWED_PAYMENT_STATUS = ['pending', 'paid', 'refunded', 'failed']
const ALLOWED_SERVICE_MODE = ['walk_in', 'dine_in', 'pickup', 'delivery', 'take_away']
const ALLOWED_HOLD_STATE = ['none', 'held', 'resumed', 'released']

type NormalizedOrderItemInput = {
    name: string
    quantity: number
    unitPrice: number
    sku: string | null
    inventoryProductId: string | null
    productId: string | null
}

type CustomerInput = {
    name?: string | null
    phone?: string | null
    email?: string | null
    address?: string | null
}

async function resolveOrCreateCustomerId(
    tx: any,
    orgId: string,
    input: CustomerInput
): Promise<string> {
    const name = String(input?.name ?? '').trim()
    const phone = String(input?.phone ?? '').trim()
    const email = input?.email ? String(input.email).trim() : null
    const address = input?.address ? String(input.address).trim() : null

    if (!name || !phone) {
        throw new Error('INVALID_CUSTOMER_PAYLOAD')
    }

    const [byPhone] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.organizationId, orgId), eq(customers.phone, phone)))
        .limit(1)
    if (byPhone) return byPhone.id

    if (email) {
        const [byEmail] = await tx
            .select({ id: customers.id })
            .from(customers)
            .where(and(eq(customers.organizationId, orgId), eq(customers.email, email)))
            .limit(1)
        if (byEmail) return byEmail.id
    }

    const [created] = await tx
        .insert(customers)
        .values({
            organizationId: orgId,
            name,
            phone,
            email,
            address,
            status: 'active',
            loyaltyPoints: 0,
            loyaltyTier: 'regular',
            totalSpentRp: 0,
        })
        .returning()

    await tx.insert(customerAnalytics).values({
        organizationId: orgId,
        customerId: created.id,
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
    })

    return created.id
}

function currentDayAndTimeWib() {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Sun'
    const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
    const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'
    const map: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    }
    return {
        dayOfWeek: map[weekday] ?? 0,
        time: `${hour}:${minute}`,
    }
}

async function validateMenuScheduleAvailability(
    tx: any,
    orgId: string,
    branchId: string,
    items: NormalizedOrderItemInput[]
) {
    const uniqueProductIds = Array.from(
        new Set(
            items
                .map((item) => item.productId)
                .filter(Boolean)
        )
    ) as string[]

    if (uniqueProductIds.length === 0) return

    const { dayOfWeek, time } = currentDayAndTimeWib()
    const rules = await tx
        .select({
            productId: fnbMenuScheduleRules.productId,
            dayOfWeek: fnbMenuScheduleRules.dayOfWeek,
            startTime: fnbMenuScheduleRules.startTime,
            endTime: fnbMenuScheduleRules.endTime,
        })
        .from(fnbMenuScheduleRules)
        .where(and(
            eq(fnbMenuScheduleRules.organizationId, orgId),
            inArray(fnbMenuScheduleRules.productId, uniqueProductIds),
            eq(fnbMenuScheduleRules.isActive, true),
            or(
                isNull(fnbMenuScheduleRules.branchId),
                eq(fnbMenuScheduleRules.branchId, branchId)
            )
        ))

    if (rules.length === 0) return

    const byProduct = new Map<string, Array<{ dayOfWeek: number; startTime: string; endTime: string }>>()
    for (const rule of rules) {
        const list = byProduct.get(rule.productId) ?? []
        list.push({
            dayOfWeek: Number(rule.dayOfWeek),
            startTime: String(rule.startTime),
            endTime: String(rule.endTime),
        })
        byProduct.set(rule.productId, list)
    }

    for (const productId of uniqueProductIds) {
        const productRules = byProduct.get(productId) ?? []
        if (productRules.length === 0) continue
        const isAllowed = productRules.some((rule) => (
            rule.dayOfWeek === dayOfWeek &&
            rule.startTime <= time &&
            rule.endTime >= time
        ))
        if (!isAllowed) {
            throw new Error('MENU_ITEM_UNAVAILABLE')
        }
    }
}

async function ensureTableAvailableForOrder(
    tx: any,
    input: { orgId: string; branchId: string; tableId: string }
) {
    const { orgId, branchId, tableId } = input
    const [tableRow] = await tx
        .select({
            id: fnbTables.id,
            status: fnbTables.status,
            isActive: fnbTables.isActive,
        })
        .from(fnbTables)
        .where(and(
            eq(fnbTables.organizationId, orgId),
            eq(fnbTables.branchId, branchId),
            eq(fnbTables.id, tableId)
        ))
        .limit(1)

    if (!tableRow) throw new Error('TABLE_NOT_FOUND')
    if (!tableRow.isActive) throw new Error('TABLE_INACTIVE')
    if (!['available', 'occupied'].includes(String(tableRow.status))) throw new Error('TABLE_UNAVAILABLE')
}

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
        const serviceMode = c.req.query('serviceMode')
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
        if (serviceMode) conditions.push(eq(orders.serviceMode, serviceMode))
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
                serviceMode: orders.serviceMode,
                tableId: orders.tableId,
                guestCount: orders.guestCount,
                holdState: orders.holdState,
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
            serviceMode: row.serviceMode,
            tableId: row.tableId,
            guestCount: Number(row.guestCount ?? 1),
            holdState: row.holdState,
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
                serviceMode: orders.serviceMode,
                tableId: orders.tableId,
                guestCount: orders.guestCount,
                holdState: orders.holdState,
                heldAt: orders.heldAt,
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
                mergedIntoOrderId: orders.mergedIntoOrderId,
                splitFromOrderId: orders.splitFromOrderId,
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

            const [items, events, billParts, tableRows] = await Promise.all([
                db
                    .select({
                        id: orderItems.id,
                        productId: orderItems.productId,
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
            db
                .select({
                    id: orderBillParts.id,
                    partLabel: orderBillParts.partLabel,
                    amount: orderBillParts.amount,
                    paymentMethod: orderBillParts.paymentMethod,
                    paymentStatus: orderBillParts.paymentStatus,
                    notes: orderBillParts.notes,
                    createdAt: orderBillParts.createdAt,
                })
                .from(orderBillParts)
                .where(and(eq(orderBillParts.organizationId, orgId), eq(orderBillParts.orderId, orderId)))
                .orderBy(asc(orderBillParts.createdAt)),
            orderRow.tableId
                ? db
                    .select({
                        id: fnbTables.id,
                        code: fnbTables.code,
                        name: fnbTables.name,
                        area: fnbTables.area,
                        capacity: fnbTables.capacity,
                    })
                    .from(fnbTables)
                    .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, orderRow.tableId)))
                    .limit(1)
                : Promise.resolve([]),
        ])

        const table = tableRows[0] ?? null

        return ok(c, {
            id: orderRow.id,
            orderNumber: orderRow.orderNumber,
            status: orderRow.status,
            type: orderRow.type,
            serviceMode: orderRow.serviceMode,
            guestCount: Number(orderRow.guestCount ?? 1),
            holdState: orderRow.holdState,
            heldAt: orderRow.heldAt,
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
            mergedIntoOrderId: orderRow.mergedIntoOrderId,
            splitFromOrderId: orderRow.splitFromOrderId,
            branch: orderRow.branchName ? { id: orderRow.branchId, name: orderRow.branchName } : null,
            customer: orderRow.customerName ? { id: orderRow.customerId, name: orderRow.customerName } : null,
            table: table ? {
                id: table.id,
                code: table.code,
                name: table.name,
                area: table.area,
                capacity: Number(table.capacity ?? 0),
            } : null,
            items: items.map((item: any) => ({
                id: item.id,
                productId: item.productId ?? null,
                name: item.name,
                sku: item.sku ?? null,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                totalPrice: Number(item.totalPrice ?? 0),
                createdAt: item.createdAt,
            })),
            billParts: billParts.map((part: any) => ({
                id: part.id,
                label: part.partLabel,
                amount: Number(part.amount ?? 0),
                paymentMethod: part.paymentMethod,
                paymentStatus: part.paymentStatus,
                notes: part.notes,
                createdAt: part.createdAt,
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
        const customerInput = body?.customer ?? null
        const type = body?.type ?? 'walk_in'
        const status = body?.status ?? 'pending'
        const paymentStatus = body?.paymentStatus ?? 'pending'
        const paymentMethod = body?.paymentMethod ?? null
        const notes = body?.notes ?? null
        const serviceMode = body?.serviceMode ?? 'walk_in'
        const tableId = body?.tableId ? String(body.tableId) : null
        const guestCount = Math.max(1, Number(body?.guestCount ?? 1))
        const holdState = body?.holdState ?? 'none'
        const items = Array.isArray(body?.items) ? body.items : []

        if (!branchId) return errors.badRequest(c, 'branchId is required')
        if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, 'No access to branch')
        if (items.length === 0) return errors.badRequest(c, 'items are required')
        if (!ALLOWED_ORDER_STATUS.includes(status)) return errors.badRequest(c, 'Invalid status')
        if (!ALLOWED_ORDER_TYPE.includes(type)) return errors.badRequest(c, 'Invalid type')
        if (!ALLOWED_PAYMENT_STATUS.includes(paymentStatus)) return errors.badRequest(c, 'Invalid payment status')
        if (!ALLOWED_SERVICE_MODE.includes(serviceMode)) return errors.badRequest(c, 'Invalid serviceMode')
        if (!ALLOWED_HOLD_STATE.includes(holdState)) return errors.badRequest(c, 'Invalid holdState')
        if (serviceMode === 'dine_in' && !tableId) return errors.badRequest(c, 'tableId is required for dine_in')

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
            productId: item?.productId ? String(item.productId) : null,
        })) as NormalizedOrderItemInput[]

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
            let resolvedCustomerId = customerId
            if (!resolvedCustomerId && customerInput) {
                resolvedCustomerId = await resolveOrCreateCustomerId(tx, orgId, customerInput)
            }

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

            if (tableId) {
                await ensureTableAvailableForOrder(tx, { orgId, branchId, tableId })
            }

            await validateMenuScheduleAvailability(tx, orgId, branchId, normalizedItems)

            const orderNumber = await generateOrderNumber(tx, orgId)

            const [orderRow] = await tx
                .insert(orders)
                .values({
                    organizationId: orgId,
                    branchId,
                    customerId: resolvedCustomerId,
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
                    serviceMode,
                    tableId,
                    guestCount,
                    holdState,
                    heldAt: holdState === 'held' ? new Date() : null,
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
                        productId: item.productId,
                        sku: item.sku,
                    }))
                )
                .returning()

            if (serviceMode === 'dine_in' && tableId) {
                const sessionStatus = (
                    status === 'completed' || status === 'cancelled'
                )
                    ? 'closed'
                    : holdState === 'held'
                        ? 'held'
                        : 'open'

                const [activeSession] = await tx
                    .select({ id: fnbTableSessions.id })
                    .from(fnbTableSessions)
                    .where(and(
                        eq(fnbTableSessions.organizationId, orgId),
                        eq(fnbTableSessions.tableId, tableId),
                        inArray(fnbTableSessions.status, ['open', 'held'])
                    ))
                    .limit(1)

                if (activeSession) {
                    await tx
                        .update(fnbTableSessions)
                        .set({
                            orderId: orderRow.id,
                            guestCount,
                            holdState,
                            updatedBy: actorId,
                            status: sessionStatus,
                            closedAt: sessionStatus === 'closed' ? new Date() : null,
                        })
                        .where(eq(fnbTableSessions.id, activeSession.id))
                } else {
                    await tx
                        .insert(fnbTableSessions)
                        .values({
                            organizationId: orgId,
                            branchId,
                            tableId,
                            orderId: orderRow.id,
                            guestCount,
                            holdState,
                            status: sessionStatus,
                            openedAt: new Date(),
                            closedAt: sessionStatus === 'closed' ? new Date() : null,
                            createdBy: actorId,
                            updatedBy: actorId,
                        })
                }

                await tx
                    .update(fnbTables)
                    .set({ status: sessionStatus === 'closed' ? 'available' : 'occupied' })
                    .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)))
            }

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
                    note: body?.eventNote ?? (holdState === 'held' ? 'Order di-hold' : null),
                    actorId,
                })

            return { order: orderRow, items: itemRows }
        })

        return ok(c, {
            id: created.order.id,
            orderNumber: created.order.orderNumber,
            status: created.order.status,
            type: created.order.type,
            serviceMode: created.order.serviceMode,
            tableId: created.order.tableId,
            guestCount: Number(created.order.guestCount ?? 1),
            holdState: created.order.holdState,
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
                productId: item.productId ?? null,
                name: item.name,
                sku: item.sku ?? null,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                totalPrice: Number(item.totalPrice ?? 0),
            })),
        })
    } catch (err: any) {
        console.error('[orders/create]', err)
        if (err?.message === 'INVALID_CUSTOMER_PAYLOAD') {
            return errors.badRequest(c, 'Data customer tidak valid')
        }
        if (err?.message === 'INSUFFICIENT_STOCK') {
            return errors.badRequest(c, 'Stok tidak mencukupi')
        }
        if (err?.message === 'INVALID_INVENTORY_SKU') {
            return errors.badRequest(c, 'SKU inventory tidak valid')
        }
        if (err?.message === 'TABLE_NOT_FOUND') {
            return errors.badRequest(c, 'Meja tidak ditemukan')
        }
        if (err?.message === 'TABLE_INACTIVE') {
            return errors.badRequest(c, 'Meja sedang nonaktif')
        }
        if (err?.message === 'TABLE_UNAVAILABLE') {
            return errors.badRequest(c, 'Meja tidak tersedia')
        }
        if (err?.message === 'MENU_ITEM_UNAVAILABLE') {
            return errors.badRequest(c, 'Item menu tidak tersedia pada jadwal saat ini')
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
            .select({
                id: orders.id,
                status: orders.status,
                branchId: orders.branchId,
                tableId: orders.tableId,
                serviceMode: orders.serviceMode,
                holdState: orders.holdState,
            })
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Order not found')
        if (!hasBranchAccess(branchIds, existing.branchId)) return errors.forbidden(c, 'No access to branch')

        const nextServiceMode = body?.serviceMode ?? existing.serviceMode
        const nextTableId = body?.tableId !== undefined
            ? (body?.tableId ? String(body.tableId) : null)
            : existing.tableId

        if (body?.status && !ALLOWED_ORDER_STATUS.includes(body.status)) {
            return errors.badRequest(c, 'Invalid status')
        }
        if (body?.type && !ALLOWED_ORDER_TYPE.includes(body.type)) {
            return errors.badRequest(c, 'Invalid type')
        }
        if (body?.paymentStatus && !ALLOWED_PAYMENT_STATUS.includes(body.paymentStatus)) {
            return errors.badRequest(c, 'Invalid payment status')
        }
        if (body?.serviceMode && !ALLOWED_SERVICE_MODE.includes(body.serviceMode)) {
            return errors.badRequest(c, 'Invalid serviceMode')
        }
        if (body?.holdState && !ALLOWED_HOLD_STATE.includes(body.holdState)) {
            return errors.badRequest(c, 'Invalid holdState')
        }
        if (nextServiceMode === 'dine_in' && !nextTableId) {
            return errors.badRequest(c, 'tableId is required for dine_in')
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
            serviceMode: body?.serviceMode ?? undefined,
            tableId: body?.tableId !== undefined ? nextTableId : undefined,
            guestCount: body?.guestCount !== undefined ? Math.max(1, Number(body.guestCount)) : undefined,
            holdState: body?.holdState ?? undefined,
            heldAt: body?.holdState === 'held'
                ? new Date()
                : body?.holdState === 'released'
                    ? null
                    : undefined,
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
            if (nextTableId) {
                await ensureTableAvailableForOrder(tx, { orgId, branchId: existing.branchId, tableId: nextTableId })
            }

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

            const resolvedStatus = updates.status ?? existing.status
            const resolvedHoldState = updates.holdState ?? existing.holdState
            const resolvedServiceMode = updates.serviceMode ?? existing.serviceMode
            const resolvedTableId = updates.tableId === undefined ? existing.tableId : updates.tableId

            if (resolvedServiceMode === 'dine_in' && resolvedTableId) {
                const [sessionRow] = await tx
                    .select({ id: fnbTableSessions.id })
                    .from(fnbTableSessions)
                    .where(and(
                        eq(fnbTableSessions.organizationId, orgId),
                        eq(fnbTableSessions.orderId, orderId)
                    ))
                    .limit(1)

                const sessionStatus = (
                    resolvedStatus === 'completed' || resolvedStatus === 'cancelled'
                )
                    ? 'closed'
                    : resolvedHoldState === 'held'
                        ? 'held'
                        : 'open'

                if (sessionRow) {
                    await tx
                        .update(fnbTableSessions)
                        .set({
                            tableId: resolvedTableId,
                            holdState: resolvedHoldState,
                            guestCount: updates.guestCount ?? undefined,
                            status: sessionStatus,
                            closedAt: sessionStatus === 'closed' ? new Date() : null,
                            updatedBy: actorId,
                        })
                        .where(eq(fnbTableSessions.id, sessionRow.id))
                } else {
                    await tx
                        .insert(fnbTableSessions)
                        .values({
                            organizationId: orgId,
                            branchId: existing.branchId,
                            tableId: resolvedTableId,
                            orderId,
                            guestCount: updates.guestCount ?? 1,
                            holdState: resolvedHoldState,
                            status: sessionStatus,
                            openedAt: new Date(),
                            closedAt: sessionStatus === 'closed' ? new Date() : null,
                            createdBy: actorId,
                            updatedBy: actorId,
                        })
                }

                await tx
                    .update(fnbTables)
                    .set({
                        status: sessionStatus === 'closed' ? 'available' : 'occupied',
                    })
                    .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, resolvedTableId)))
            } else if (existing.serviceMode === 'dine_in' && existing.tableId) {
                await tx
                    .update(fnbTableSessions)
                    .set({
                        status: 'closed',
                        closedAt: new Date(),
                        updatedBy: actorId,
                    })
                    .where(and(
                        eq(fnbTableSessions.organizationId, orgId),
                        eq(fnbTableSessions.orderId, orderId)
                    ))

                await tx
                    .update(fnbTables)
                    .set({ status: 'available' })
                    .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, existing.tableId)))
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
        if (err?.message === 'TABLE_NOT_FOUND') {
            return errors.badRequest(c, 'Meja tidak ditemukan')
        }
        if (err?.message === 'TABLE_INACTIVE') {
            return errors.badRequest(c, 'Meja sedang nonaktif')
        }
        if (err?.message === 'TABLE_UNAVAILABLE') {
            return errors.badRequest(c, 'Meja tidak tersedia')
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
            productId: item?.productId ? String(item.productId) : null,
        })) as NormalizedOrderItemInput[]

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

            await validateMenuScheduleAvailability(tx, orgId, orderRow.branchId, normalizedItems)

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
                        productId: item.productId,
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
        if (err?.message === 'MENU_ITEM_UNAVAILABLE') {
            return errors.badRequest(c, 'Item menu tidak tersedia pada jadwal saat ini')
        }
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/orders/:id/hold
ordersRouter.patch('/:id/hold', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')

        const orderId = c.req.param('id')
        const body = await c.req.json().catch(() => null)
        const holdState = body?.holdState ?? 'held'
        if (!ALLOWED_HOLD_STATE.includes(holdState)) {
            return errors.badRequest(c, 'Invalid holdState')
        }

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const [orderRow] = await db
            .select({
                id: orders.id,
                branchId: orders.branchId,
                tableId: orders.tableId,
                serviceMode: orders.serviceMode,
                status: orders.status,
            })
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)
        if (!orderRow) return errors.notFound(c, 'Order not found')
        if (!hasBranchAccess(branchIds, orderRow.branchId)) return errors.forbidden(c, 'No access to branch')

        const [updated] = await db.transaction(async (tx: any) => {
            const [row] = await tx
                .update(orders)
                .set({
                    holdState,
                    heldAt: holdState === 'held' ? new Date() : null,
                })
                .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
                .returning()

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId,
                    status: row.status,
                    note: body?.note ?? `Hold state: ${holdState}`,
                    actorId,
                })

            if (orderRow.serviceMode === 'dine_in' && orderRow.tableId) {
                const [session] = await tx
                    .select({ id: fnbTableSessions.id })
                    .from(fnbTableSessions)
                    .where(and(
                        eq(fnbTableSessions.organizationId, orgId),
                        eq(fnbTableSessions.orderId, orderId)
                    ))
                    .limit(1)

                if (session) {
                    await tx
                        .update(fnbTableSessions)
                        .set({
                            holdState,
                            status: holdState === 'held' ? 'held' : 'open',
                            updatedBy: actorId,
                        })
                        .where(eq(fnbTableSessions.id, session.id))
                }
            }

            return [row]
        })

        return ok(c, updated)
    } catch (err: any) {
        console.error('[orders/hold]', err)
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/orders/:id/split
ordersRouter.post('/:id/split', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')

        const orderId = c.req.param('id')
        const body = await c.req.json().catch(() => null)
        const parts = Array.isArray(body?.parts) ? body.parts : []
        if (parts.length < 2) return errors.badRequest(c, 'parts minimal 2')

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const [orderRow] = await db
            .select({
                id: orders.id,
                branchId: orders.branchId,
                status: orders.status,
                totalAmount: orders.totalAmount,
            })
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)
        if (!orderRow) return errors.notFound(c, 'Order not found')
        if (!hasBranchAccess(branchIds, orderRow.branchId)) return errors.forbidden(c, 'No access to branch')
        if (orderRow.status === 'cancelled') return errors.badRequest(c, 'Order sudah dibatalkan')

        const normalizedParts = parts.map((part: any, idx: number) => ({
            partLabel: String(part?.label ?? `Part ${idx + 1}`).trim(),
            amount: Number(part?.amount ?? 0),
            paymentMethod: part?.paymentMethod ? String(part.paymentMethod) : null,
            paymentStatus: part?.paymentStatus ? String(part.paymentStatus) : 'pending',
            notes: part?.notes ? String(part.notes) : null,
        }))
        if (normalizedParts.some((part: any) => !part.partLabel || part.amount <= 0 || !Number.isFinite(part.amount))) {
            return errors.badRequest(c, 'Invalid split parts payload')
        }

        const totalParts = normalizedParts.reduce((sum: number, part: any) => sum + part.amount, 0)
        const totalOrder = Number(orderRow.totalAmount ?? 0)
        if (totalParts !== totalOrder) {
            return errors.badRequest(c, `Total split (${totalParts}) harus sama dengan total order (${totalOrder})`)
        }

        const result = await db.transaction(async (tx: any) => {
            await tx
                .delete(orderBillParts)
                .where(and(eq(orderBillParts.organizationId, orgId), eq(orderBillParts.orderId, orderId)))

            const inserted = await tx
                .insert(orderBillParts)
                .values(normalizedParts.map((part: any) => ({
                    organizationId: orgId,
                    orderId,
                    partLabel: part.partLabel,
                    amount: part.amount,
                    paymentMethod: part.paymentMethod,
                    paymentStatus: part.paymentStatus,
                    notes: part.notes,
                    createdBy: actorId,
                })))
                .returning()

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId,
                    status: orderRow.status,
                    note: body?.note ?? `Split bill menjadi ${normalizedParts.length} bagian`,
                    actorId,
                })

            return inserted
        })

        return ok(c, { orderId, parts: result })
    } catch (err: any) {
        console.error('[orders/split]', err)
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/orders/merge
ordersRouter.post('/merge', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchIds = await getAccessibleBranchIds(c, orgId)
        if (branchIds.length === 0) return errors.forbidden(c, 'No branch access')

        const body = await c.req.json().catch(() => null)
        const targetOrderId = body?.targetOrderId ? String(body.targetOrderId) : ''
        const sourceOrderIds = Array.isArray(body?.sourceOrderIds)
            ? body.sourceOrderIds.map((id: unknown) => String(id)).filter(Boolean)
            : []

        if (!targetOrderId) return errors.badRequest(c, 'targetOrderId is required')
        if (sourceOrderIds.length === 0) return errors.badRequest(c, 'sourceOrderIds is required')
        if (sourceOrderIds.includes(targetOrderId)) return errors.badRequest(c, 'sourceOrderIds cannot contain targetOrderId')

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const [targetOrder] = await db
            .select({
                id: orders.id,
                branchId: orders.branchId,
                status: orders.status,
                subtotalAmount: orders.subtotalAmount,
                discountAmount: orders.discountAmount,
                taxAmount: orders.taxAmount,
                totalAmount: orders.totalAmount,
            })
            .from(orders)
            .where(and(eq(orders.organizationId, orgId), eq(orders.id, targetOrderId)))
            .limit(1)
        if (!targetOrder) return errors.notFound(c, 'Target order not found')
        if (!hasBranchAccess(branchIds, targetOrder.branchId)) return errors.forbidden(c, 'No access to target branch')
        if (targetOrder.status === 'cancelled') return errors.badRequest(c, 'Target order sudah dibatalkan')

        const sourceOrders = await db
            .select({
                id: orders.id,
                branchId: orders.branchId,
                status: orders.status,
                subtotalAmount: orders.subtotalAmount,
                discountAmount: orders.discountAmount,
                taxAmount: orders.taxAmount,
                totalAmount: orders.totalAmount,
            })
            .from(orders)
            .where(and(
                eq(orders.organizationId, orgId),
                inArray(orders.id, sourceOrderIds)
            ))
        if (sourceOrders.length !== sourceOrderIds.length) return errors.badRequest(c, 'Sebagian source order tidak ditemukan')
        if (sourceOrders.some((order: any) => order.status === 'cancelled')) {
            return errors.badRequest(c, 'Source order tidak boleh cancelled')
        }
        if (sourceOrders.some((order: any) => order.branchId !== targetOrder.branchId)) {
            return errors.badRequest(c, 'Source order harus dari cabang yang sama')
        }

        const merged = await db.transaction(async (tx: any) => {
            await tx
                .update(orderItems)
                .set({ orderId: targetOrderId })
                .where(inArray(orderItems.orderId, sourceOrderIds))

            const aggregate = sourceOrders.reduce((acc: any, row: any) => ({
                subtotalAmount: acc.subtotalAmount + Number(row.subtotalAmount ?? 0),
                discountAmount: acc.discountAmount + Number(row.discountAmount ?? 0),
                taxAmount: acc.taxAmount + Number(row.taxAmount ?? 0),
                totalAmount: acc.totalAmount + Number(row.totalAmount ?? 0),
            }), {
                subtotalAmount: Number(targetOrder.subtotalAmount ?? 0),
                discountAmount: Number(targetOrder.discountAmount ?? 0),
                taxAmount: Number(targetOrder.taxAmount ?? 0),
                totalAmount: Number(targetOrder.totalAmount ?? 0),
            })

            const [updatedTarget] = await tx
                .update(orders)
                .set({
                    subtotalAmount: aggregate.subtotalAmount,
                    discountAmount: aggregate.discountAmount,
                    taxAmount: aggregate.taxAmount,
                    totalAmount: aggregate.totalAmount,
                })
                .where(and(eq(orders.organizationId, orgId), eq(orders.id, targetOrderId)))
                .returning()

            await tx
                .update(orders)
                .set({
                    status: 'cancelled',
                    mergedIntoOrderId: targetOrderId,
                    cancelledAt: new Date(),
                })
                .where(and(
                    eq(orders.organizationId, orgId),
                    inArray(orders.id, sourceOrderIds)
                ))

            await tx
                .insert(orderEvents)
                .values([
                    {
                        organizationId: orgId,
                        orderId: targetOrderId,
                        status: updatedTarget.status,
                        note: `Merged ${sourceOrderIds.length} order(s)`,
                        actorId,
                    },
                    ...sourceOrderIds.map((sourceId: string) => ({
                        organizationId: orgId,
                        orderId: sourceId,
                        status: 'cancelled',
                        note: `Merged into order ${targetOrderId}`,
                        actorId,
                    })),
                ])

            return updatedTarget
        })

        return ok(c, merged)
    } catch (err: any) {
        console.error('[orders/merge]', err)
        return errors.internal(c, err.message)
    }
})
