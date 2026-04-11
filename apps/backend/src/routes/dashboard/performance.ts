import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { branches, orderItems, orders, payments } from '@beresio/db'
import { getBranchAccessContext, hasBranchAccess } from '../../lib/branch-access'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const performanceRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

function resolveTimeRangeDays(timeRange: string | undefined) {
    return timeRange === '30d' ? 30 : 7
}

async function resolveBranchScope(c: any, orgId: string, requestedBranchId?: string | null) {
    const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
    if (branchIds.length === 0 && !isOrgWide) {
        return { ok: false as const, response: errors.forbidden(c, 'No branch access') }
    }

    if (requestedBranchId && !isOrgWide && !hasBranchAccess(branchIds, requestedBranchId)) {
        return { ok: false as const, response: errors.forbidden(c, 'No access to branch') }
    }

    const scopedBranchIds = requestedBranchId ? [requestedBranchId] : branchIds
    if (scopedBranchIds.length === 0) {
        return { ok: true as const, scopedBranchIds: [] }
    }

    return { ok: true as const, scopedBranchIds }
}

// GET /api/dashboard/performance/trend?timeRange=7d|30d&branchId=...
performanceRouter.get('/trend', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const branchId = c.req.query('branchId') ?? null
        const scoped = await resolveBranchScope(c, orgId, branchId)
        if (!scoped.ok) return scoped.response

        if (scoped.scopedBranchIds.length === 0) return ok(c, [], { timeRange: c.req.query('timeRange') ?? '7d' })

        const timeRange = c.req.query('timeRange') ?? '7d'
        const days = resolveTimeRangeDays(timeRange)
        const since = new Date()
        since.setDate(since.getDate() - days)

        const rows = await db
            .select({
                date: sql<string>`date_trunc('day', ${payments.createdAt})::date`,
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
            })
            .from(payments)
            .where(
                and(
                    eq(payments.organizationId, orgId),
                    eq(payments.status, 'SUCCESS'),
                    inArray(payments.branchId, scoped.scopedBranchIds),
                    gte(payments.createdAt, since)
                )
            )
            .groupBy(sql`date_trunc('day', ${payments.createdAt})::date`)
            .orderBy(sql`date_trunc('day', ${payments.createdAt})::date`)

        return ok(c, rows.map((r: any) => ({
            date: String(r.date),
            revenue: Number(r.revenue),
        })), { timeRange })
    } catch (err: any) {
        console.error('[performance/trend]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/performance/trend-by-branch?timeRange=7d|30d
performanceRouter.get('/trend-by-branch', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const scoped = await resolveBranchScope(c, orgId)
        if (!scoped.ok) return scoped.response
        if (scoped.scopedBranchIds.length === 0) return ok(c, [])

        const timeRange = c.req.query('timeRange') ?? '7d'
        const days = resolveTimeRangeDays(timeRange)
        const since = new Date()
        since.setDate(since.getDate() - days)

        const rows = await db
            .select({
                date: sql<string>`date_trunc('day', ${payments.createdAt})::date`,
                branchId: payments.branchId,
                branchName: branches.name,
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
            })
            .from(payments)
            .innerJoin(branches, eq(payments.branchId, branches.id))
            .where(and(
                eq(payments.organizationId, orgId),
                eq(payments.status, 'SUCCESS'),
                inArray(payments.branchId, scoped.scopedBranchIds),
                gte(payments.createdAt, since)
            ))
            .groupBy(sql`date_trunc('day', ${payments.createdAt})::date`, payments.branchId, branches.name)
            .orderBy(sql`date_trunc('day', ${payments.createdAt})::date`, branches.name)

        return ok(c, rows.map((row: any) => ({
            date: String(row.date),
            branchId: row.branchId,
            branchName: row.branchName,
            revenue: Number(row.revenue),
        })), { timeRange })
    } catch (err: any) {
        console.error('[performance/trend-by-branch]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/performance/branches
performanceRouter.get('/branches', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const scoped = await resolveBranchScope(c, orgId)
        if (!scoped.ok) return scoped.response
        if (scoped.scopedBranchIds.length === 0) return ok(c, [])

        const rows = await db
            .select({
                branchId: branches.id,
                branchCode: branches.code,
                branchName: branches.name,
                isActive: branches.isActive,
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
                orderCount: sql<number>`COUNT(${payments.id})`,
            })
            .from(branches)
            .leftJoin(payments, and(
                eq(payments.branchId, branches.id),
                eq(payments.organizationId, orgId),
                eq(payments.status, 'SUCCESS')
            ))
            .where(and(
                eq(branches.organizationId, orgId),
                inArray(branches.id, scoped.scopedBranchIds)
            ))
            .groupBy(branches.id, branches.code, branches.name, branches.isActive)
            .orderBy(sql`SUM(${payments.amount}) DESC NULLS LAST`, branches.name)

        return ok(c, rows.map((r: any) => ({
            branchId: r.branchId,
            branchCode: r.branchCode,
            branchName: r.branchName,
            isActive: Boolean(r.isActive),
            revenue: Number(r.revenue),
            orderCount: Number(r.orderCount),
            txCount: Number(r.orderCount),
        })))
    } catch (err: any) {
        console.error('[performance/branches]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/performance/orders-by-type?branchId=...
performanceRouter.get('/orders-by-type', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const branchId = c.req.query('branchId') ?? null
        const scoped = await resolveBranchScope(c, orgId, branchId)
        if (!scoped.ok) return scoped.response
        if (scoped.scopedBranchIds.length === 0) return ok(c, [])

        const rows = await db
            .select({
                type: orders.type,
                total: sql<number>`COUNT(*)`,
            })
            .from(orders)
            .where(and(
                eq(orders.organizationId, orgId),
                inArray(orders.branchId, scoped.scopedBranchIds)
            ))
            .groupBy(orders.type)
            .orderBy(sql`COUNT(*) DESC`)

        return ok(c, rows.map((row: any) => ({
            type: row.type ?? 'unknown',
            total: Number(row.total ?? 0),
        })))
    } catch (err: any) {
        console.error('[performance/orders-by-type]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/performance/hourly-sales?branchId=...
performanceRouter.get('/hourly-sales', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const branchId = c.req.query('branchId') ?? null
        const scoped = await resolveBranchScope(c, orgId, branchId)
        if (!scoped.ok) return scoped.response
        if (scoped.scopedBranchIds.length === 0) return ok(c, [])

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const rows = await db
            .select({
                hour: sql<number>`EXTRACT(HOUR FROM ${payments.createdAt})`,
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
                orderCount: sql<number>`COUNT(${payments.id})`,
            })
            .from(payments)
            .where(and(
                eq(payments.organizationId, orgId),
                eq(payments.status, 'SUCCESS'),
                inArray(payments.branchId, scoped.scopedBranchIds),
                gte(payments.createdAt, today)
            ))
            .groupBy(sql`EXTRACT(HOUR FROM ${payments.createdAt})`)
            .orderBy(sql`EXTRACT(HOUR FROM ${payments.createdAt})`)

        return ok(c, rows.map((row: any) => ({
            hour: Number(row.hour ?? 0),
            revenue: Number(row.revenue ?? 0),
            orderCount: Number(row.orderCount ?? 0),
        })))
    } catch (err: any) {
        console.error('[performance/hourly-sales]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/performance/top-products?branchId=...&limit=5
performanceRouter.get('/top-products', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const branchId = c.req.query('branchId') ?? null
        const scoped = await resolveBranchScope(c, orgId, branchId)
        if (!scoped.ok) return scoped.response
        if (scoped.scopedBranchIds.length === 0) return ok(c, [])

        const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 5), 1), 20)
        const since = new Date()
        since.setDate(since.getDate() - 7)

        const rows = await db
            .select({
                productName: orderItems.name,
                totalQuantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`,
                totalRevenue: sql<number>`COALESCE(SUM(${orderItems.totalPrice}), 0)`,
            })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(and(
                eq(orders.organizationId, orgId),
                inArray(orders.branchId, scoped.scopedBranchIds),
                gte(orders.createdAt, since)
            ))
            .groupBy(orderItems.name)
            .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
            .limit(limit)

        return ok(c, rows.map((row: any) => ({
            name: row.productName,
            quantity: Number(row.totalQuantity ?? 0),
            revenue: Number(row.totalRevenue ?? 0),
        })))
    } catch (err: any) {
        console.error('[performance/top-products]', err)
        return errors.internal(c, err.message)
    }
})
