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

// POST /api/dashboard/billing/upgrade
billingRouter.post('/upgrade', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const body = await c.req.json().catch(() => null)
        const plan = body?.plan
        if (!plan || !PLAN_LIMITS[plan]) return errors.badRequest(c, 'Invalid plan')

        const updated = await db
            .update(organization)
            .set({ subscriptionPlan: plan })
            .where(eq(organization.id, orgId))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Organization not found')

        return ok(c, {
            plan,
            limits: PLAN_LIMITS[plan],
        })
    } catch (err: any) {
        console.error('[billing/upgrade]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/billing/invoices
billingRouter.get('/invoices', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const limit = Math.min(Number(c.req.query('limit') ?? 20), 100)

        const rows = await db
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
            .limit(limit)

        return ok(c, rows.map((row: any) => ({
            id: row.id,
            amount: Number(row.amount ?? 0),
            status: row.status,
            reference: row.reference,
            createdAt: row.createdAt,
        })))
    } catch (err: any) {
        console.error('[billing/invoices]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/billing/invoices/:id/download
billingRouter.get('/invoices/:id/download', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const invoiceId = c.req.param('id')
        const [row] = await db
            .select({
                id: payments.id,
                amount: payments.amount,
                status: payments.status,
                reference: payments.reference,
                createdAt: payments.createdAt,
            })
            .from(payments)
            .where(and(eq(payments.id, invoiceId), eq(payments.organizationId, orgId)))
            .limit(1)

        if (!row) return errors.notFound(c, 'Invoice not found')

        return ok(c, {
            id: row.id,
            amount: Number(row.amount ?? 0),
            status: row.status,
            reference: row.reference,
            createdAt: row.createdAt,
            downloadUrl: null,
            message: 'Invoice download belum tersedia.',
        })
    } catch (err: any) {
        console.error('[billing/invoices/download]', err)
        return errors.internal(c, err.message)
    }
})
