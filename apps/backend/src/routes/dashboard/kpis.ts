import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { sql, and, eq, gt, gte } from 'drizzle-orm'
import { orders, customers, branches } from '@beresio/db'

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

        // 1. Omzet Hari Ini: SUM total_amount of orders created today
        // 2. Pesanan Hari Ini: COUNT orders created today
        // 3. Pelanggan Baru: COUNT customers created today
        // 4. Cabang Aktif: Active vs Total count

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [revenueResult, ordersResult, customerResult, branchResult] = await Promise.all([
            // Omzet Hari Ini
            db
                .select({ total: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)` })
                .from(orders)
                .where(
                    and(
                        eq(orders.organizationId, orgId),
                        eq(orders.paymentStatus, 'paid'),
                        gte(orders.createdAt, today)
                    )
                ),

            // Pesanan Hari Ini
            db
                .select({ total: sql<number>`COUNT(*)` })
                .from(orders)
                .where(
                    and(
                        eq(orders.organizationId, orgId),
                        gte(orders.createdAt, today)
                    )
                ),

            // Pelanggan Baru (Today)
            db
                .select({ total: sql<number>`COUNT(*)` })
                .from(customers)
                .where(
                    and(
                        eq(customers.organizationId, orgId),
                        gte(customers.createdAt, today)
                    )
                ),

            // Cabang Aktif vs Total
            db
                .select({
                    active: sql<number>`COUNT(*) FILTER (WHERE ${branches.isActive} = true)`,
                    total: sql<number>`COUNT(*)`,
                })
                .from(branches)
                .where(eq(branches.organizationId, orgId)),
        ])

        return ok(c, {
            omzetHariIni: Number(revenueResult[0]?.total ?? 0),
            pesananHariIni: Number(ordersResult[0]?.total ?? 0),
            pelangganBaru: Number(customerResult[0]?.total ?? 0),
            activeBranches: Number(branchResult[0]?.active ?? 0),
            totalBranches: Number(branchResult[0]?.total ?? 0),
        })
    } catch (err: any) {
        console.error('[kpis]', err)
        return errors.internal(c, err.message)
    }
})
