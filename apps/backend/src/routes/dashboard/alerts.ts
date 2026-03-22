import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq, lt, sql } from 'drizzle-orm'
import { orders } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const alertsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

alertsRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

        // 1. Pending orders > 2 hours
        const staleOrdersResult = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(orders)
            .where(
                and(
                    eq(orders.organizationId, orgId),
                    eq(orders.status, 'pending'),
                    lt(orders.createdAt, twoHoursAgo)
                )
            )

        const alerts = []
        
        const staleCount = Number(staleOrdersResult[0]?.count ?? 0)
        if (staleCount > 0) {
            alerts.push({
                id: 'stale-orders',
                type: 'warning',
                title: 'Pesanan Tertunda',
                description: `${staleCount} pesanan belum diproses > 2 jam.`,
                actionLabel: 'Lihat Pesanan',
                actionUrl: '/dashboard/orders?status=pending',
            })
        }

        // Add more alert logic here as needed (e.g. low stock, branches offline)

        return ok(c, alerts)
    } catch (err: any) {
        console.error('[alerts]', err)
        return errors.internal(c, err.message)
    }
})
