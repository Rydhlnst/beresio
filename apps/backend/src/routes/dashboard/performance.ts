import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { sql, and, eq, gte } from 'drizzle-orm'
import { payments, branches } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const performanceRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/performance/trend?timeRange=7d|30d
performanceRouter.get('/trend', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const timeRange = c.req.query('timeRange') ?? '7d'
        const days = timeRange === '30d' ? 30 : 7
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

        const rows = await db
            .select({
                branchId: payments.branchId,
                branchName: branches.name,
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
                txCount: sql<number>`COUNT(${payments.id})`,
            })
            .from(payments)
            .innerJoin(branches, eq(payments.branchId, branches.id))
            .where(
                and(
                    eq(payments.organizationId, orgId),
                    eq(payments.status, 'SUCCESS')
                )
            )
            .groupBy(payments.branchId, branches.name)
            .orderBy(sql`SUM(${payments.amount}) DESC`)

        return ok(c, rows.map((r: any) => ({
            branchId: r.branchId,
            branchName: r.branchName,
            revenue: Number(r.revenue),
            txCount: Number(r.txCount),
        })))
    } catch (err: any) {
        console.error('[performance/branches]', err)
        return errors.internal(c, err.message)
    }
})
