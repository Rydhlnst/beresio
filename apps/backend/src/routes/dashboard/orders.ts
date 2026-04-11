import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, desc, eq, ilike, gte, lte, inArray } from 'drizzle-orm'
import { z } from 'zod'
import {
    branches,
    fnbMenuVersionItems,
    fnbMenuVersions,
    normalizeOrderStatusInput,
    normalizeOrderTypeInput,
    customers,
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
import { appendDomainEvent, canTransitionOrderStatus, projectDomainEvent } from '../../lib/fnb-domain'
import { requireBranchContext } from '../../middleware/branch-context'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const ordersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const ALLOWED_ORDER_STATUS = ['pending', 'confirmed', 'processing', 'preparing', 'ready', 'served', 'completed', 'cancelled']
const ALLOWED_ORDER_TYPE = ['pickup', 'delivery', 'walk_in', 'takeaway', 'dine_in']
const ALLOWED_PAYMENT_STATUS = ['pending', 'partial', 'paid', 'refunded', 'failed']
const ALLOWED_ORDER_SOURCE = ['pos', 'self_order']
const ALLOWED_SERVICE_MODE = ['walk_in', 'dine_in', 'pickup', 'delivery', 'take_away', 'takeaway']
const ALLOWED_HOLD_STATE = ['none', 'held', 'resumed', 'released']
const ACTIVE_TABLE_SESSION_STATUS = ['active', 'held']

const orderItemInputSchema = z.object({
    productId: z.string().trim().min(1).nullable().optional(),
    name: z.string().trim().min(1, 'Item name is required'),
    quantity: z.coerce.number().positive('quantity must be > 0'),
    unitPrice: z.coerce.number().min(0, 'unitPrice must be >= 0'),
    sku: z.string().trim().min(1).nullable().optional(),
    inventoryProductId: z.string().trim().min(1).nullable().optional(),
})

const createOrderBodySchema = z.object({
    branchId: z.string().trim().min(1, 'branchId is required'),
    customerId: z.string().trim().min(1).nullable().optional(),
    type: z.preprocess(
        (value) => normalizeOrderTypeInput(value ?? 'walk_in'),
        z.string().refine((value) => ALLOWED_ORDER_TYPE.includes(value), 'Invalid type')
    ),
    status: z.preprocess(
        (value) => normalizeOrderStatusInput(value ?? 'pending'),
        z.string().refine((value) => ALLOWED_ORDER_STATUS.includes(value), 'Invalid status')
    ),
    paymentStatus: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : (value ?? 'pending')),
        z.string().refine((value) => ALLOWED_PAYMENT_STATUS.includes(value), 'Invalid payment status')
    ),
    paymentMethod: z.string().trim().min(1).nullable().optional(),
    notes: z.string().nullable().optional(),
    source: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : (value ?? 'pos')),
        z.string().refine((value) => ALLOWED_ORDER_SOURCE.includes(value), 'Invalid source')
    ),
    serviceMode: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : (value ?? 'walk_in')),
        z.string().refine((value) => ALLOWED_SERVICE_MODE.includes(value), 'Invalid serviceMode')
    ),
    tableId: z.string().trim().min(1).nullable().optional(),
    sessionId: z.string().trim().min(1).nullable().optional(),
    guestCount: z.coerce.number().int().min(1, 'guestCount must be >= 1').optional().default(1),
    holdState: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : (value ?? 'none')),
        z.string().refine((value) => ALLOWED_HOLD_STATE.includes(value), 'Invalid holdState')
    ),
    items: z.array(orderItemInputSchema).min(1, 'items are required'),
    discountAmount: z.coerce.number().optional().default(0),
    taxAmount: z.coerce.number().optional().default(0),
    eventNote: z.string().nullable().optional(),
})

const updateOrderBodySchema = z.object({
    status: z.preprocess(
        (value) => (value === undefined ? undefined : normalizeOrderStatusInput(value)),
        z.string().refine((parsed) => ALLOWED_ORDER_STATUS.includes(parsed), 'Invalid status').optional()
    ),
    type: z.preprocess(
        (value) => (value === undefined ? undefined : normalizeOrderTypeInput(value)),
        z.string().refine((parsed) => ALLOWED_ORDER_TYPE.includes(parsed), 'Invalid type').optional()
    ),
    paymentStatus: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        z.string().refine((parsed) => ALLOWED_PAYMENT_STATUS.includes(parsed), 'Invalid payment status').optional()
    ),
    paymentMethod: z.string().trim().min(1).nullable().optional(),
    notes: z.string().nullable().optional(),
    source: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        z.string().refine((parsed) => ALLOWED_ORDER_SOURCE.includes(parsed), 'Invalid source').optional()
    ),
    customerId: z.string().trim().min(1).nullable().optional(),
    serviceMode: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        z.string().refine((parsed) => ALLOWED_SERVICE_MODE.includes(parsed), 'Invalid serviceMode').optional()
    ),
    tableId: z.string().trim().min(1).nullable().optional(),
    sessionId: z.string().trim().min(1).nullable().optional(),
    guestCount: z.coerce.number().int().min(1, 'guestCount must be >= 1').optional(),
    holdState: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        z.string().refine((parsed) => ALLOWED_HOLD_STATE.includes(parsed), 'Invalid holdState').optional()
    ),
    eventNote: z.string().nullable().optional(),
})

const updateOrderItemsBodySchema = z.object({
    eventNote: z.string().nullable().optional(),
    items: z.array(orderItemInputSchema).min(1, 'items are required'),
})

const holdOrderBodySchema = z.object({
    action: z.enum(['hold', 'resume', 'release']),
    eventNote: z.string().nullable().optional(),
})

const splitOrderPartSchema = z.object({
    label: z.string().trim().min(1).optional(),
    amount: z.coerce.number().positive('amount must be > 0'),
    paymentMethod: z.string().trim().min(1).nullable().optional(),
    paymentStatus: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toLowerCase() : (value ?? 'pending')),
        z.string().refine((parsed) => ALLOWED_PAYMENT_STATUS.includes(parsed), 'Invalid payment status on split parts')
    ),
    notes: z.string().nullable().optional(),
})

const splitOrderBodySchema = z.object({
    eventNote: z.string().nullable().optional(),
    parts: z.array(splitOrderPartSchema).min(1, 'parts are required'),
})

const mergeOrdersBodySchema = z.object({
    targetOrderId: z.string().trim().min(1, 'targetOrderId is required'),
    sourceOrderIds: z.array(z.string().trim().min(1)).min(1, 'sourceOrderIds are required'),
    eventNote: z.string().nullable().optional(),
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

async function ensureTableForOrder(tx: any, input: { orgId: string; branchId: string; tableId: string }) {
    const [tableRow] = await tx
        .select({
            id: fnbTables.id,
            isActive: fnbTables.isActive,
        })
        .from(fnbTables)
        .where(and(
            eq(fnbTables.organizationId, input.orgId),
            eq(fnbTables.branchId, input.branchId),
            eq(fnbTables.id, input.tableId)
        ))
        .limit(1)
    if (!tableRow) throw new Error('TABLE_NOT_FOUND')
    if (!tableRow.isActive) throw new Error('TABLE_INACTIVE')
}

function isTerminalOrderStatus(status: string | null | undefined) {
    return status === 'served' || status === 'completed' || status === 'cancelled'
}

function tableSessionStatusByHoldState(holdState: string | null | undefined) {
    return holdState === 'held' ? 'held' : 'active'
}

async function closeActiveTableSessionsForOrder(
    tx: any,
    input: { orgId: string; orderId: string; actorId: string | null }
) {
    const sessions = await tx
        .select({
            id: fnbTableSessions.id,
            tableId: fnbTableSessions.tableId,
        })
        .from(fnbTableSessions)
        .where(and(
            eq(fnbTableSessions.organizationId, input.orgId),
            eq(fnbTableSessions.orderId, input.orderId),
            inArray(fnbTableSessions.status, ACTIVE_TABLE_SESSION_STATUS)
        ))

    if (sessions.length === 0) return

    await tx
        .update(fnbTableSessions)
        .set({
            status: 'closed',
            holdState: 'released',
            closedAt: new Date(),
            updatedBy: input.actorId,
        })
        .where(and(
            eq(fnbTableSessions.organizationId, input.orgId),
            eq(fnbTableSessions.orderId, input.orderId),
            inArray(fnbTableSessions.status, ACTIVE_TABLE_SESSION_STATUS)
        ))

    for (const session of sessions) {
        await tx
            .update(fnbTables)
            .set({ status: 'available' })
            .where(and(
                eq(fnbTables.organizationId, input.orgId),
                eq(fnbTables.id, session.tableId)
            ))
    }
}

async function syncOpenTableSessionForOrder(
    tx: any,
    input: {
        orgId: string
        branchId: string
        orderId: string
        tableId: string
        guestCount: number
        holdState: string
        actorId: string | null
    }
) {
    const [existingSession] = await tx
        .select({
            id: fnbTableSessions.id,
            tableId: fnbTableSessions.tableId,
        })
        .from(fnbTableSessions)
        .where(and(
            eq(fnbTableSessions.organizationId, input.orgId),
            eq(fnbTableSessions.orderId, input.orderId),
            inArray(fnbTableSessions.status, ACTIVE_TABLE_SESSION_STATUS)
        ))
        .limit(1)

    const nextSessionStatus = tableSessionStatusByHoldState(input.holdState)

    if (!existingSession) {
        await tx
            .insert(fnbTableSessions)
            .values({
                organizationId: input.orgId,
                branchId: input.branchId,
                tableId: input.tableId,
                orderId: input.orderId,
                status: nextSessionStatus,
                holdState: input.holdState,
                guestCount: input.guestCount,
                openedAt: new Date(),
                createdBy: input.actorId,
                updatedBy: input.actorId,
            })
    } else if (existingSession.tableId !== input.tableId) {
        await tx
            .update(fnbTableSessions)
            .set({
                status: 'closed',
                holdState: 'released',
                closedAt: new Date(),
                updatedBy: input.actorId,
            })
            .where(eq(fnbTableSessions.id, existingSession.id))

        await tx
            .update(fnbTables)
            .set({ status: 'available' })
            .where(and(
                eq(fnbTables.organizationId, input.orgId),
                eq(fnbTables.id, existingSession.tableId)
            ))

        await tx
            .insert(fnbTableSessions)
            .values({
                organizationId: input.orgId,
                branchId: input.branchId,
                tableId: input.tableId,
                orderId: input.orderId,
                status: nextSessionStatus,
                holdState: input.holdState,
                guestCount: input.guestCount,
                openedAt: new Date(),
                createdBy: input.actorId,
                updatedBy: input.actorId,
            })
    } else {
        await tx
            .update(fnbTableSessions)
            .set({
                status: nextSessionStatus,
                holdState: input.holdState,
                guestCount: input.guestCount,
                updatedBy: input.actorId,
                closedAt: null,
            })
            .where(eq(fnbTableSessions.id, existingSession.id))
    }

    await tx
        .update(fnbTables)
        .set({ status: 'occupied' })
        .where(and(
            eq(fnbTables.organizationId, input.orgId),
            eq(fnbTables.id, input.tableId)
        ))
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

        const status = normalizeOrderStatusInput(c.req.query('status'))
        const branchId = c.req.query('branchId')
        const type = normalizeOrderTypeInput(c.req.query('type'))
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
                source: orders.source,
                sessionId: orders.sessionId,
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
            source: row.source,
            sessionId: row.sessionId,
            createdAt: row.createdAt,
            branch: row.branchName ? { id: row.branchId, name: row.branchName } : null,
            customer: row.customerName ? { id: row.customerId, name: row.customerName } : null,
        })))
    } catch (err: any) {
        console.error('[orders]', err)
        return errors.internal(c)
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
                source: orders.source,
                sessionId: orders.sessionId,
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
                        inventoryProductId: orderItems.inventoryProductId,
                        name: orderItems.name,
                        sku: orderItems.sku,
                        quantity: orderItems.quantity,
                        unitPrice: orderItems.unitPrice,
                        totalPrice: orderItems.totalPrice,
                        modifiers: orderItems.modifiers,
                        notes: orderItems.notes,
                        station: orderItems.station,
                        status: orderItems.status,
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
                .orderBy(desc(orderBillParts.createdAt)),
            orderRow.tableId
                ? db
                    .select({
                        id: fnbTables.id,
                        code: fnbTables.code,
                        name: fnbTables.name,
                        area: fnbTables.area,
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
            tableId: orderRow.tableId,
            guestCount: Number(orderRow.guestCount ?? 1),
            holdState: orderRow.holdState,
            heldAt: orderRow.heldAt,
            subtotalAmount: Number(orderRow.subtotalAmount ?? 0),
            discountAmount: Number(orderRow.discountAmount ?? 0),
            taxAmount: Number(orderRow.taxAmount ?? 0),
            totalAmount: Number(orderRow.totalAmount ?? 0),
            paymentStatus: orderRow.paymentStatus,
            paymentMethod: orderRow.paymentMethod,
            source: orderRow.source,
            sessionId: orderRow.sessionId,
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
            } : null,
            items: items.map((item: any) => ({
                id: item.id,
                productId: item.productId ?? null,
                inventoryProductId: item.inventoryProductId ?? null,
                name: item.name,
                sku: item.sku ?? null,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                totalPrice: Number(item.totalPrice ?? 0),
                modifiers: item.modifiers ?? [],
                notes: item.notes ?? null,
                station: item.station ?? null,
                status: item.status,
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
        return errors.internal(c)
    }
})

// POST /api/dashboard/orders
ordersRouter.post('/', authMiddleware, requireBranchContext(), async (c) => {
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
        const parsedBody = createOrderBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const {
            branchId,
            customerId = null,
            type,
            status,
            paymentStatus,
            paymentMethod = null,
            notes = null,
            source,
            serviceMode,
            tableId = null,
            sessionId = null,
            guestCount,
            holdState,
            items,
            discountAmount,
            taxAmount,
            eventNote,
        } = parsedBody.data

        if (!hasBranchAccess(branchIds, branchId)) return errors.forbidden(c, 'No access to branch')
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

        const normalizedItems = items

        const subtotalAmount = normalizedItems.reduce(
            (sum: number, item: any) => sum + item.quantity * item.unitPrice,
            0
        )
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

            if (tableId) {
                await ensureTableForOrder(tx, { orgId, branchId, tableId })
            }

            const [activeMenuVersion] = await tx
                .select({
                    id: fnbMenuVersions.id,
                })
                .from(fnbMenuVersions)
                .where(and(
                    eq(fnbMenuVersions.organizationId, orgId),
                    eq(fnbMenuVersions.branchId, branchId),
                    eq(fnbMenuVersions.status, "active")
                ))
                .orderBy(desc(fnbMenuVersions.activatedAt), desc(fnbMenuVersions.createdAt))
                .limit(1)

            const menuVersionId = activeMenuVersion?.id ?? null
            const menuItemMap = new Map<string, any>()
            if (menuVersionId) {
                const menuItems = await tx
                    .select({
                        id: fnbMenuVersionItems.id,
                        productId: fnbMenuVersionItems.productId,
                        itemName: fnbMenuVersionItems.itemName,
                        unitPrice: fnbMenuVersionItems.unitPrice,
                        modifierSchema: fnbMenuVersionItems.modifierSchema,
                        station: fnbMenuVersionItems.station,
                        prepTimeMinutes: fnbMenuVersionItems.prepTimeMinutes,
                    })
                    .from(fnbMenuVersionItems)
                    .where(and(
                        eq(fnbMenuVersionItems.menuVersionId, menuVersionId),
                        eq(fnbMenuVersionItems.isActive, true)
                    ))

                for (const item of menuItems) {
                    if (!item.productId) continue
                    menuItemMap.set(item.productId, item)
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
                    source,
                    serviceMode,
                    tableId,
                    sessionId,
                    guestCount,
                    holdState,
                    heldAt: holdState === 'held' ? new Date() : null,
                    completedAt: status === 'completed' ? new Date() : null,
                    cancelledAt: status === 'cancelled' ? new Date() : null,
                    createdBy: actorId,
                })
                .returning()

            const itemRows = await tx
                .insert(orderItems)
                .values(
                    normalizedItems.map((item: any) => {
                        const menuSnapshot = item.productId ? menuItemMap.get(item.productId) : null
                        const resolvedName = menuSnapshot?.itemName ?? item.name
                        const resolvedUnitPrice = Number(menuSnapshot?.unitPrice ?? item.unitPrice)
                        return {
                            orderId: orderRow.id,
                            productId: item.productId,
                            name: resolvedName,
                            quantity: item.quantity,
                            unitPrice: resolvedUnitPrice,
                            totalPrice: item.quantity * resolvedUnitPrice,
                            inventoryProductId: item.inventoryProductId,
                            sku: item.sku,
                            menuVersionId,
                            menuVersionItemId: menuSnapshot?.id ?? null,
                            snapshotModifierSchema: menuSnapshot?.modifierSchema ?? [],
                            snapshotStation: menuSnapshot?.station ?? null,
                            snapshotPrepTimeMinutes: Number(menuSnapshot?.prepTimeMinutes ?? 0),
                            station: menuSnapshot?.station ?? null,
                        }
                    })
                )
                .returning()

            if (serviceMode === 'dine_in' && tableId && !isTerminalOrderStatus(status)) {
                await syncOpenTableSessionForOrder(tx, {
                    orgId,
                    branchId,
                    orderId: orderRow.id,
                    tableId,
                    guestCount,
                    holdState,
                    actorId,
                })
            }

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId: orderRow.id,
                    status,
                    note: eventNote ?? null,
                    actorId,
                })

            const domainEvent = await appendDomainEvent(tx, {
                organizationId: orgId,
                branchId,
                aggregateType: "order",
                aggregateId: orderRow.id,
                eventType: "ORDER_CREATED",
                actorId,
                payload: {
                    orderId: orderRow.id,
                    orderNumber: orderRow.orderNumber,
                    serviceMode: orderRow.serviceMode,
                    tableId: orderRow.tableId,
                    sessionId: orderRow.sessionId,
                    source: orderRow.source,
                },
            })
            await projectDomainEvent(tx, domainEvent)

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
            source: created.order.source,
            sessionId: created.order.sessionId,
            notes: created.order.notes,
            createdAt: created.order.createdAt,
            items: created.items.map((item: any) => ({
                id: item.id,
                productId: item.productId ?? null,
                inventoryProductId: item.inventoryProductId ?? null,
                name: item.name,
                sku: item.sku ?? null,
                quantity: Number(item.quantity ?? 0),
                unitPrice: Number(item.unitPrice ?? 0),
                totalPrice: Number(item.totalPrice ?? 0),
                modifiers: item.modifiers ?? [],
                notes: item.notes ?? null,
                station: item.station ?? null,
                status: item.status,
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
        if (err?.message === 'TABLE_NOT_FOUND') {
            return errors.badRequest(c, 'Meja tidak ditemukan di cabang ini')
        }
        if (err?.message === 'TABLE_INACTIVE') {
            return errors.badRequest(c, 'Meja tidak aktif')
        }
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/orders/:id
ordersRouter.patch('/:id', authMiddleware, requireBranchContext(), async (c) => {
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
        const parsedBody = updateOrderBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const {
            status: normalizedStatus,
            type: normalizedType,
            paymentStatus,
            paymentMethod,
            notes,
            source,
            customerId,
            serviceMode,
            tableId,
            sessionId,
            guestCount,
            holdState,
            eventNote,
        } = parsedBody.data

        const [existing] = await db
            .select({
                id: orders.id,
                branchId: orders.branchId,
                status: orders.status,
                type: orders.type,
                paymentStatus: orders.paymentStatus,
                source: orders.source,
                serviceMode: orders.serviceMode,
                tableId: orders.tableId,
                sessionId: orders.sessionId,
                guestCount: orders.guestCount,
                holdState: orders.holdState,
            })
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Order not found')
        if (!hasBranchAccess(branchIds, existing.branchId)) return errors.forbidden(c, 'No access to branch')

        if (customerId) {
            const [customerRow] = await db
                .select({ id: customers.id })
                .from(customers)
                .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
                .limit(1)
            if (!customerRow) return errors.badRequest(c, 'Customer not found')
        }

        const nextServiceMode = serviceMode ?? existing.serviceMode
        const nextTableId = tableId !== undefined
            ? tableId
            : existing.tableId
        const nextHoldState = holdState ?? existing.holdState
        const nextStatus = normalizedStatus ?? existing.status
        const nextGuestCount = guestCount !== undefined
            ? Math.max(1, guestCount)
            : Number(existing.guestCount ?? 1)

        if (nextServiceMode === 'dine_in' && !nextTableId) {
            return errors.badRequest(c, 'tableId is required for dine_in')
        }
        if (normalizedStatus && !canTransitionOrderStatus(existing.status, normalizedStatus)) {
            return errors.badRequest(c, `Transisi status tidak valid: ${existing.status} -> ${normalizedStatus}`)
        }
        if (isTerminalOrderStatus(nextStatus) && nextHoldState === 'held') {
            return errors.badRequest(c, 'Order terminal tidak boleh dalam status held')
        }

        const updates: any = {
            paymentStatus: paymentStatus ?? undefined,
            paymentMethod: paymentMethod ?? undefined,
            notes: notes ?? undefined,
            type: normalizedType ?? undefined,
            source: source ?? undefined,
            customerId: customerId === undefined
                ? undefined
                : customerId,
            serviceMode: serviceMode ?? undefined,
            tableId: tableId === undefined ? undefined : nextTableId,
            sessionId: sessionId === undefined
                ? undefined
                : sessionId,
            guestCount: guestCount === undefined ? undefined : nextGuestCount,
            holdState: holdState ?? undefined,
        }

        if (normalizedStatus) {
            updates.status = normalizedStatus
            updates.completedAt = normalizedStatus === 'completed' ? new Date() : null
            updates.cancelledAt = normalizedStatus === 'cancelled' ? new Date() : null
        }
        if (holdState) {
            updates.heldAt = holdState === 'held' ? new Date() : null
        }

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const result = await db.transaction(async (tx: any) => {
            if (nextServiceMode === 'dine_in' && nextTableId && !isTerminalOrderStatus(nextStatus)) {
                await ensureTableForOrder(tx, {
                    orgId,
                    branchId: existing.branchId,
                    tableId: nextTableId,
                })
            }

            if (normalizedStatus && normalizedStatus !== existing.status) {
                const shouldRestock = normalizedStatus === 'cancelled' && existing.status !== 'cancelled'
                const shouldDeduct = existing.status === 'cancelled' && normalizedStatus !== 'cancelled'

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

            if (
                normalizedStatus
                && normalizedStatus !== existing.status
                && ['confirmed', 'preparing', 'ready', 'completed'].includes(normalizedStatus)
            ) {
                const statusEventMap: Record<string, "ORDER_CONFIRMED" | "ORDER_PREPARING" | "ORDER_READY" | "ORDER_COMPLETED"> = {
                    confirmed: "ORDER_CONFIRMED",
                    preparing: "ORDER_PREPARING",
                    ready: "ORDER_READY",
                    completed: "ORDER_COMPLETED",
                }
                const domainEvent = await appendDomainEvent(tx, {
                    organizationId: orgId,
                    branchId: updated.branchId,
                    aggregateType: 'order',
                    aggregateId: orderId,
                    eventType: statusEventMap[normalizedStatus],
                    actorId,
                    payload: {
                        orderId,
                        previousStatus: existing.status,
                        nextStatus: normalizedStatus,
                        tableId: updated.tableId,
                        sessionId: updated.sessionId,
                    },
                })
                await projectDomainEvent(tx, domainEvent)
            }

            const shouldKeepOpenTableSession = (
                updated.serviceMode === 'dine_in'
                && !!updated.tableId
                && !isTerminalOrderStatus(updated.status)
            )

            if (shouldKeepOpenTableSession) {
                await syncOpenTableSessionForOrder(tx, {
                    orgId,
                    branchId: updated.branchId,
                    orderId,
                    tableId: updated.tableId,
                    guestCount: Number(updated.guestCount ?? 1),
                    holdState: updated.holdState ?? 'none',
                    actorId,
                })
            } else {
                await closeActiveTableSessionsForOrder(tx, { orgId, orderId, actorId })
            }

            if (
                normalizedStatus !== undefined
                || serviceMode !== undefined
                || tableId !== undefined
                || guestCount !== undefined
                || holdState !== undefined
            ) {
                await tx
                    .insert(orderEvents)
                    .values({
                        organizationId: orgId,
                        orderId,
                        status: updated.status,
                        note: eventNote ?? 'Order diperbarui',
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
            return errors.badRequest(c, 'Meja tidak ditemukan di cabang ini')
        }
        if (err?.message === 'TABLE_INACTIVE') {
            return errors.badRequest(c, 'Meja tidak aktif')
        }
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/orders/:id/hold
ordersRouter.patch('/:id/hold', authMiddleware, requireBranchContext(), async (c) => {
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
        const parsedBody = holdOrderBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const { action, eventNote } = parsedBody.data

        const [existing] = await db
            .select({
                id: orders.id,
                branchId: orders.branchId,
                status: orders.status,
                serviceMode: orders.serviceMode,
                tableId: orders.tableId,
            })
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)
        if (!existing) return errors.notFound(c, 'Order not found')
        if (!hasBranchAccess(branchIds, existing.branchId)) return errors.forbidden(c, 'No access to branch')
        if (isTerminalOrderStatus(existing.status)) {
            return errors.badRequest(c, 'Order terminal tidak bisa di-hold/resume')
        }

        const nextHoldState = action === 'hold'
            ? 'held'
            : (action === 'resume' ? 'resumed' : 'released')
        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const [updated] = await db.transaction(async (tx: any) => {
            const [row] = await tx
                .update(orders)
                .set({
                    holdState: nextHoldState,
                    heldAt: action === 'hold' ? new Date() : null,
                })
                .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
                .returning()

            if (row.serviceMode === 'dine_in' && row.tableId) {
                await syncOpenTableSessionForOrder(tx, {
                    orgId,
                    branchId: row.branchId,
                    orderId: row.id,
                    tableId: row.tableId,
                    guestCount: Number(row.guestCount ?? 1),
                    holdState: row.holdState ?? 'none',
                    actorId,
                })
            }

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId: row.id,
                    status: row.status,
                    note: eventNote ?? `Order ${action}`,
                    actorId,
                })

            return [row]
        })

        return ok(c, updated)
    } catch (err: any) {
        console.error('[orders/hold]', err)
        if (err?.message === 'TABLE_NOT_FOUND') {
            return errors.badRequest(c, 'Meja tidak ditemukan di cabang ini')
        }
        if (err?.message === 'TABLE_INACTIVE') {
            return errors.badRequest(c, 'Meja tidak aktif')
        }
        return errors.internal(c)
    }
})

// POST /api/dashboard/orders/:id/split
ordersRouter.post('/:id/split', authMiddleware, requireBranchContext(), async (c) => {
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
        const parsedBody = splitOrderBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const { parts: rawParts, eventNote } = parsedBody.data

        const [orderRow] = await db
            .select({
                id: orders.id,
                branchId: orders.branchId,
                totalAmount: orders.totalAmount,
                paymentStatus: orders.paymentStatus,
                status: orders.status,
            })
            .from(orders)
            .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            .limit(1)
        if (!orderRow) return errors.notFound(c, 'Order not found')
        if (!hasBranchAccess(branchIds, orderRow.branchId)) return errors.forbidden(c, 'No access to branch')

        const parts = rawParts.map((part: any, index: number) => ({
            partLabel: String(part?.label ?? `Part ${index + 1}`).trim(),
            amount: part.amount,
            paymentMethod: part.paymentMethod ?? null,
            paymentStatus: part.paymentStatus,
            notes: part.notes ?? null,
        }))

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const result = await db.transaction(async (tx: any) => {
            const existingParts = await tx
                .select({
                    amount: orderBillParts.amount,
                    paymentStatus: orderBillParts.paymentStatus,
                })
                .from(orderBillParts)
                .where(and(
                    eq(orderBillParts.organizationId, orgId),
                    eq(orderBillParts.orderId, orderId)
                ))

            const existingTotal = existingParts.reduce((sum: number, part: any) => sum + Number(part.amount ?? 0), 0)
            const requestedTotal = parts.reduce((sum: number, part: any) => sum + part.amount, 0)
            const nextTotal = existingTotal + requestedTotal
            const orderTotal = Number(orderRow.totalAmount ?? 0)

            if (nextTotal > orderTotal) {
                throw new Error('SPLIT_AMOUNT_EXCEEDS_ORDER')
            }

            const inserted = await tx
                .insert(orderBillParts)
                .values(parts.map((part: any) => ({
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

            const paidAmount = [
                ...existingParts,
                ...inserted,
            ].reduce((sum: number, part: any) => {
                if (part.paymentStatus !== 'paid') return sum
                return sum + Number(part.amount ?? 0)
            }, 0)

            const nextPaymentStatus = paidAmount >= orderTotal ? 'paid' : orderRow.paymentStatus
            if (nextPaymentStatus !== orderRow.paymentStatus) {
                await tx
                    .update(orders)
                    .set({ paymentStatus: nextPaymentStatus })
                    .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
            }

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId,
                    status: orderRow.status,
                    note: eventNote ?? 'Split bill diperbarui',
                    actorId,
                })

            return {
                orderId,
                orderTotal,
                allocatedAmount: nextTotal,
                remainingAmount: Math.max(0, orderTotal - nextTotal),
                parts: inserted,
            }
        })

        return ok(c, result)
    } catch (err: any) {
        console.error('[orders/split]', err)
        if (err?.message === 'SPLIT_AMOUNT_EXCEEDS_ORDER') {
            return errors.badRequest(c, 'Total split melebihi total order')
        }
        return errors.internal(c)
    }
})

// POST /api/dashboard/orders/merge
ordersRouter.post('/merge', authMiddleware, requireBranchContext(), async (c) => {
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
        const parsedBody = mergeOrdersBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const { targetOrderId, sourceOrderIds, eventNote } = parsedBody.data

        if (sourceOrderIds.includes(targetOrderId)) {
            return errors.badRequest(c, 'targetOrderId cannot be merged into itself')
        }

        const allOrderIds = Array.from(new Set([targetOrderId, ...sourceOrderIds]))
        const rows = await db
            .select({
                id: orders.id,
                orderNumber: orders.orderNumber,
                branchId: orders.branchId,
                subtotalAmount: orders.subtotalAmount,
                totalAmount: orders.totalAmount,
                status: orders.status,
                mergedIntoOrderId: orders.mergedIntoOrderId,
            })
            .from(orders)
            .where(and(
                eq(orders.organizationId, orgId),
                inArray(orders.id, allOrderIds)
            ))

        if (rows.length !== allOrderIds.length) {
            return errors.badRequest(c, 'Ada order yang tidak ditemukan')
        }
        if (rows.some((row: any) => !hasBranchAccess(branchIds, row.branchId))) {
            return errors.forbidden(c, 'No access to branch')
        }

        const target = rows.find((row: any) => row.id === targetOrderId)
        if (!target) return errors.badRequest(c, 'Target order tidak ditemukan')
        if (target.mergedIntoOrderId) {
            return errors.badRequest(c, 'Target order sudah digabungkan ke order lain')
        }

        const sources = rows.filter((row: any) => sourceOrderIds.includes(row.id))
        if (sources.some((row: any) => row.mergedIntoOrderId)) {
            return errors.badRequest(c, 'Ada source order yang sudah digabungkan ke order lain')
        }
        if (sources.some((row: any) => row.branchId !== target.branchId)) {
            return errors.badRequest(c, 'Order merge harus dalam cabang yang sama')
        }

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const result = await db.transaction(async (tx: any) => {
            const mergedSubtotal = sources.reduce(
                (sum: number, row: any) => sum + Number(row.subtotalAmount ?? 0),
                0
            )
            const mergedTotal = sources.reduce(
                (sum: number, row: any) => sum + Number(row.totalAmount ?? 0),
                0
            )

            const [updatedTarget] = await tx
                .update(orders)
                .set({
                    subtotalAmount: Number(target.subtotalAmount ?? 0) + mergedSubtotal,
                    totalAmount: Number(target.totalAmount ?? 0) + mergedTotal,
                })
                .where(and(eq(orders.id, targetOrderId), eq(orders.organizationId, orgId)))
                .returning()

            for (const source of sources) {
                await tx
                    .update(orders)
                    .set({
                        mergedIntoOrderId: targetOrderId,
                        status: 'completed',
                        completedAt: new Date(),
                        holdState: 'released',
                        heldAt: null,
                    })
                    .where(and(eq(orders.id, source.id), eq(orders.organizationId, orgId)))

                await closeActiveTableSessionsForOrder(tx, {
                    orgId,
                    orderId: source.id,
                    actorId,
                })

                await tx
                    .insert(orderBillParts)
                    .values({
                        organizationId: orgId,
                        orderId: targetOrderId,
                        partLabel: `Merge ${source.orderNumber}`,
                        amount: Number(source.totalAmount ?? 0),
                        paymentStatus: 'pending',
                        notes: `Merged from order ${source.orderNumber}`,
                        createdBy: actorId,
                    })

                await tx
                    .insert(orderEvents)
                    .values({
                        organizationId: orgId,
                        orderId: source.id,
                        status: 'completed',
                        note: eventNote ?? `Merged into ${target.orderNumber}`,
                        actorId,
                    })
            }

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId: targetOrderId,
                    status: updatedTarget.status,
                    note: eventNote ?? `Merge ${sources.length} order`,
                    actorId,
                })

            return {
                targetOrderId,
                mergedOrderIds: sources.map((row: any) => row.id),
                targetTotalAmount: Number(updatedTarget.totalAmount ?? 0),
            }
        })

        return ok(c, result)
    } catch (err: any) {
        console.error('[orders/merge]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/orders/:id/items
ordersRouter.patch('/:id/items', authMiddleware, requireBranchContext(), async (c) => {
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
        const parsedBody = updateOrderItemsBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const { items: normalizedItems, eventNote } = parsedBody.data

        const [orderRow] = await db
            .select({
                id: orders.id,
                discountAmount: orders.discountAmount,
                taxAmount: orders.taxAmount,
                branchId: orders.branchId,
                status: orders.status,
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
                        productId: item.productId,
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

            const shouldApplyStockDiff = ['confirmed', 'preparing', 'ready', 'served', 'completed'].includes(orderRow.status)
            if (shouldApplyStockDiff) {
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
            }

            await tx
                .insert(orderEvents)
                .values({
                    organizationId: orgId,
                    orderId,
                    status: updated.status,
                    note: eventNote ?? 'Item diperbarui',
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
        return errors.internal(c)
    }
})

