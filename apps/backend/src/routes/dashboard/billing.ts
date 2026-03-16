import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { sql, and, eq, desc } from 'drizzle-orm'
import { organization, member, branches, payments } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const billingRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Plan limits per tier
const PLAN_LIMITS: Record<string, { branches: number; members: number }> = {
    starter: { branches: 1, members: 3 },
    growth: { branches: 5, members: 15 },
    pro: { branches: 20, members: 50 },
    enterprise: { branches: Infinity, members: Infinity },
}

// GET /api/dashboard/billing/status
billingRouter.get('/status', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const [orgRows, branchCountRows, memberCountRows, recentPayments] = await Promise.all([
            // Current org / plan
            db
                .select({
                    id: organization.id,
                    name: organization.name,
                    subscriptionPlan: organization.subscriptionPlan,
                })
                .from(organization)
                .where(eq(organization.id, orgId))
                .limit(1),

            // Active branch count
            db
                .select({ total: sql<number>`COUNT(*)` })
                .from(branches)
                .where(
                    and(
                        eq(branches.organizationId, orgId),
                        eq(branches.isActive, true)
                    )
                ),

            // Active member count
            db
                .select({ total: sql<number>`COUNT(*)` })
                .from(member)
                .where(eq(member.organizationId, orgId)),

            // Last 5 payment records for invoice display
            db
                .select({
                    id: payments.id,
                    amount: payments.amount,
                    status: payments.status,
                    reference: payments.reference,
                    createdAt: payments.createdAt,
                })
                .from(payments)
                .where(eq(payments.organizationId, orgId))
                .orderBy(desc(payments.createdAt))
                .limit(5),
        ])

        const org = orgRows[0]
        if (!org) return errors.notFound(c, 'Organization not found')

        const plan = org.subscriptionPlan ?? 'starter'
        const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS['starter']

        return ok(c, {
            plan,
            usage: {
                branches: {
                    current: Number(branchCountRows[0]?.total ?? 0),
                    limit: limits.branches === Infinity ? null : limits.branches,
                },
                members: {
                    current: Number(memberCountRows[0]?.total ?? 0),
                    limit: limits.members === Infinity ? null : limits.members,
                },
            },
            recentPayments: recentPayments.map((p: any) => ({
                id: p.id,
                amount: Number(p.amount),
                status: p.status,
                reference: p.reference,
                createdAt: p.createdAt,
            })),
        })
    } catch (err: any) {
        console.error('[billing/status]', err)
        return errors.internal(c, err.message)
    }
})
