import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { sql, and, eq, gt } from 'drizzle-orm'
import { payments, activityLogs, customers, session, member } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const kpisRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

kpisRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        // Run all aggregations in parallel
        const [revenueResult, customerResult, sessionResult, alertResult] = await Promise.all([
            // Total Revenue: SUM of SUCCESS payments
            db
                .select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
                .from(payments)
                .where(
                    and(
                        eq(payments.organizationId, orgId),
                        eq(payments.status, 'SUCCESS')
                    )
                ),

            // Total Customers: unique count
            db
                .select({ total: sql<number>`COUNT(*)` })
                .from(customers)
                .where(eq(customers.organizationId, orgId)),

            // Active Sessions: sessions not expired for org members
            db
                .select({ total: sql<number>`COUNT(DISTINCT ${session.id})` })
                .from(session)
                .innerJoin(member, eq(session.userId, member.userId))
                .where(
                    and(
                        eq(member.organizationId, orgId),
                        gt(session.expiresAt, new Date())
                    )
                ),

            // Security Alerts: warning-level activity logs
            db
                .select({ total: sql<number>`COUNT(*)` })
                .from(activityLogs)
                .where(
                    and(
                        eq(activityLogs.organizationId, orgId),
                        eq(activityLogs.level, 'warning')
                    )
                ),
        ])

        return ok(c, {
            totalRevenue: Number(revenueResult[0]?.total ?? 0),
            totalCustomers: Number(customerResult[0]?.total ?? 0),
            activeSessions: Number(sessionResult[0]?.total ?? 0),
            securityAlerts: Number(alertResult[0]?.total ?? 0),
        })
    } catch (err: any) {
        console.error('[kpis]', err)
        return errors.internal(c, err.message)
    }
})
