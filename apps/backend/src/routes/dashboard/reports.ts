import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq, gte, lte, sql, inArray } from 'drizzle-orm'
import { branches, orders, payments } from '@beresio/db'
import { getAccessibleBranchIds, getBranchAccessContext, hasBranchAccess } from '../../lib/branch-access'
import { getOrganizationBranchAggregate, resolveScopedBranchIds } from '../../lib/organization-aggregates'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

function parseDate(dateStr?: string, isEnd = false) {
    if (!dateStr) return null
    const normalized = isEnd
        ? `${dateStr}T23:59:59.999Z`
        : `${dateStr}T00:00:00.000Z`
    const parsed = new Date(normalized)
    if (Number.isNaN(parsed.getTime())) return null
    return parsed
}

function buildRange(range?: string, dateFrom?: string, dateTo?: string) {
    const todayIso = new Date().toISOString().slice(0, 10)
    if (!range || range === 'custom') {
        const from = parseDate(dateFrom ?? todayIso)
        const to = parseDate(dateTo ?? todayIso, true)
        return { from, to }
    }

    const today = new Date()
    const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

    if (range === 'today') {
        const iso = base.toISOString().slice(0, 10)
        return { from: parseDate(iso), to: parseDate(iso, true) }
    }

    if (range === '7d' || range === '30d') {
        const days = range === '7d' ? 6 : 29
        const fromDate = new Date(base)
        fromDate.setUTCDate(fromDate.getUTCDate() - days)
        const fromIso = fromDate.toISOString().slice(0, 10)
        const toIso = base.toISOString().slice(0, 10)
        return { from: parseDate(fromIso), to: parseDate(toIso, true) }
    }

    if (range === 'month') {
        const fromDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
        const fromIso = fromDate.toISOString().slice(0, 10)
        const toIso = base.toISOString().slice(0, 10)
        return { from: parseDate(fromIso), to: parseDate(toIso, true) }
    }

    const fallbackFrom = parseDate(dateFrom ?? todayIso)
    const fallbackTo = parseDate(dateTo ?? todayIso, true)
    return { from: fallbackFrom, to: fallbackTo }
}

export const reportsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/reports/catalog
reportsRouter.get('/catalog', authMiddleware, async (c) => {
    return ok(c, [
        { id: 'sales', name: 'Penjualan' },
        { id: 'orders', name: 'Order' },
        { id: 'inventory', name: 'Inventory' },
        { id: 'pickup', name: 'Pickup & Delivery' },
    ])
})

// GET /api/dashboard/reports/summary
reportsRouter.get('/summary', authMiddleware, async (c) => {
    try {
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        const range = c.req.query('range')
        const dateFrom = c.req.query('dateFrom')
        const dateTo = c.req.query('dateTo')
        const branchId = c.req.query('branchId')

        const { from, to } = buildRange(range, dateFrom, dateTo)
        if (!from || !to) return errors.badRequest(c, 'Invalid date range')
        if (branchIds.length === 0) {
            if (!isOrgWide) return errors.forbidden(c, 'No branch access')
            if (branchId) return errors.forbidden(c, 'No access to branch')
            return ok(c, {
                revenueTotal: 0,
                completedOrders: 0,
                cancellationRate: 0,
                range: { from, to },
            })
        }

        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) {
                return errors.forbidden(c, 'No access to branch')
            }
        }

        const scopedBranchIds = await resolveScopedBranchIds(
            c,
            orgId,
            branchId ? [branchId] : undefined
        )
        const aggregate = await getOrganizationBranchAggregate(c, orgId, {
            branchIds: scopedBranchIds,
            range: { from, to },
        })

        const totalOrders = aggregate.totalOrders
        const completedOrders = aggregate.completedOrders
        const cancelledOrders = aggregate.cancelledOrders
        const cancellationRate = totalOrders === 0 ? 0 : Math.round((cancelledOrders / totalOrders) * 1000) / 10

        return ok(c, {
            revenueTotal: aggregate.revenueTotal,
            completedOrders,
            cancellationRate,
            range: { from, to },
        })
    } catch (err: any) {
        console.error('[reports/summary]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/reports/chart
reportsRouter.get('/chart', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        const range = c.req.query('range')
        const dateFrom = c.req.query('dateFrom')
        const dateTo = c.req.query('dateTo')
        const branchId = c.req.query('branchId')

        const { from, to } = buildRange(range, dateFrom, dateTo)
        if (!from || !to) return errors.badRequest(c, 'Invalid date range')
        if (branchIds.length === 0) {
            if (!isOrgWide) return errors.forbidden(c, 'No branch access')
            if (branchId) return errors.forbidden(c, 'No access to branch')
            return ok(c, [])
        }

        const paymentConditions = [
            eq(payments.organizationId, orgId),
            eq(payments.status, 'SUCCESS'),
            gte(payments.createdAt, from),
            lte(payments.createdAt, to),
        ]
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) {
                return errors.forbidden(c, 'No access to branch')
            }
            paymentConditions.push(eq(payments.branchId, branchId))
        } else {
            paymentConditions.push(inArray(payments.branchId, branchIds))
        }

        const orderConditions = [
            eq(orders.organizationId, orgId),
            gte(orders.createdAt, from),
            lte(orders.createdAt, to),
        ]
        if (branchId) {
            if (!hasBranchAccess(branchIds, branchId)) {
                return errors.forbidden(c, 'No access to branch')
            }
            orderConditions.push(eq(orders.branchId, branchId))
        } else {
            orderConditions.push(inArray(orders.branchId, branchIds))
        }

        const paymentDay = sql<string>`date_trunc('day', ${payments.createdAt})`
        const orderDay = sql<string>`date_trunc('day', ${orders.createdAt})`

        const [revenueRows, orderRows] = await Promise.all([
            db
                .select({
                    day: paymentDay,
                    revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`.as('revenue'),
                })
                .from(payments)
                .where(and(...paymentConditions))
                .groupBy(paymentDay)
                .orderBy(paymentDay),
            db
                .select({
                    day: orderDay,
                    orders: sql<number>`COUNT(*)`.as('orders'),
                })
                .from(orders)
                .where(and(...orderConditions))
                .groupBy(orderDay)
                .orderBy(orderDay),
        ])

        const points = new Map<string, { date: string; revenue: number; orders: number }>()

        for (const row of revenueRows) {
            const date = new Date(row.day).toISOString().slice(0, 10)
            points.set(date, {
                date,
                revenue: Number(row.revenue ?? 0),
                orders: 0,
            })
        }

        for (const row of orderRows) {
            const date = new Date(row.day).toISOString().slice(0, 10)
            const existing = points.get(date)
            points.set(date, {
                date,
                revenue: Number(existing?.revenue ?? 0),
                orders: Number(row.orders ?? 0),
            })
        }

        const data = Array.from(points.values()).sort((a, b) => a.date.localeCompare(b.date))
        return ok(c, data)
    } catch (err: any) {
        console.error('[reports/chart]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/reports/table
reportsRouter.get('/table', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        const range = c.req.query('range')
        const dateFrom = c.req.query('dateFrom')
        const dateTo = c.req.query('dateTo')

        const { from, to } = buildRange(range, dateFrom, dateTo)
        if (!from || !to) return errors.badRequest(c, 'Invalid date range')
        if (branchIds.length === 0) {
            if (!isOrgWide) return errors.forbidden(c, 'No branch access')
            return ok(c, [])
        }

        const revenueSub = db
            .select({
                branchId: payments.branchId,
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`.as('revenue'),
            })
            .from(payments)
            .where(and(
                eq(payments.organizationId, orgId),
                eq(payments.status, 'SUCCESS'),
                gte(payments.createdAt, from),
                lte(payments.createdAt, to),
                inArray(payments.branchId, branchIds),
            ))
            .groupBy(payments.branchId)
            .as('revenue')

        const orderSub = db
            .select({
                branchId: orders.branchId,
                total: sql<number>`COUNT(*)`.as('total'),
                completed: sql<number>`COUNT(*) FILTER (WHERE ${orders.status} = 'completed')`.as('completed'),
            })
            .from(orders)
            .where(and(
                eq(orders.organizationId, orgId),
                gte(orders.createdAt, from),
                lte(orders.createdAt, to),
                inArray(orders.branchId, branchIds),
            ))
            .groupBy(orders.branchId)
            .as('orders')

        const rows = await db
            .select({
                branchId: branches.id,
                branchName: branches.name,
                revenue: sql<number>`COALESCE(${revenueSub.revenue}, 0)`.as('revenue'),
                orders: sql<number>`COALESCE(${orderSub.total}, 0)`.as('orders'),
                completed: sql<number>`COALESCE(${orderSub.completed}, 0)`.as('completed'),
            })
            .from(branches)
            .leftJoin(revenueSub, eq(revenueSub.branchId, branches.id))
            .leftJoin(orderSub, eq(orderSub.branchId, branches.id))
            .where(and(
                eq(branches.organizationId, orgId),
                inArray(branches.id, branchIds)
            ))
            .orderBy(branches.name)

        return ok(c, rows.map((row: any) => {
            const totalOrders = Number(row.orders ?? 0)
            const completedOrders = Number(row.completed ?? 0)
            const completionRate = totalOrders === 0
                ? 0
                : Math.round((completedOrders / totalOrders) * 1000) / 10
            return {
                branch: { id: row.branchId, name: row.branchName },
                revenue: Number(row.revenue ?? 0),
                orders: totalOrders,
                completionRate,
            }
        }))
    } catch (err: any) {
        console.error('[reports/table]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/reports/export
reportsRouter.get('/export', authMiddleware, async (c) => {
    const format = c.req.query('format') ?? 'pdf'
    if (!['pdf', 'xlsx'].includes(format)) {
        return errors.badRequest(c, 'format must be pdf or xlsx')
    }
    return ok(c, {
        status: 'queued',
        format,
        downloadUrl: null,
        message: 'Export sedang diproses.',
    })
})
