import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq, ne, sql, gte, lte } from 'drizzle-orm'
import { branchMembers, branches, member, orders, payments } from '@beresio/db'
import { getAccessibleBranches } from '../../lib/branch-access'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Validation schemas
const createBranchSchema = z.object({
    name: z.string().min(1, 'Name is required').max(150, 'Name too long'),
    code: z.string().min(1, 'Code is required').max(10, 'Code too long'),
    address: z.string().max(300).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    isActive: z.boolean().default(true),
})

const updateBranchSchema = z.object({
    name: z.string().min(1).max(150).optional(),
    code: z.string().min(1).max(10).optional(),
    address: z.string().max(300).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
})

const updateStatusSchema = z.object({
    isActive: z.boolean(),
})

export const branchesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

branchesRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        // Pagination params
        const page = Math.max(1, Number(c.req.query('page') || 1))
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number(c.req.query('limit') || DEFAULT_LIMIT)))
        const offset = (page - 1) * limit

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(branches)
            .where(eq(branches.organizationId, orgId))

        const revenueSub = db
            .select({
                branchId: payments.branchId,
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`.as('revenue'),
                orders: sql<number>`COUNT(${payments.id})`.as('orders'),
            })
            .from(payments)
            .where(and(eq(payments.organizationId, orgId), eq(payments.status, 'SUCCESS')))
            .groupBy(payments.branchId)
            .as('revenue')

        const staffSub = db
            .select({
                branchId: branchMembers.branchId,
                staffCount: sql<number>`COUNT(DISTINCT ${branchMembers.memberId})`.as('staff_count'),
            })
            .from(branchMembers)
            .where(eq(branchMembers.organizationId, orgId))
            .groupBy(branchMembers.branchId)
            .as('staff')

        const rows = await db
            .select({
                id: branches.id,
                name: branches.name,
                code: branches.code,
                address: branches.address,
                phone: branches.phone,
                isActive: branches.isActive,
                revenue: sql<number>`COALESCE(${revenueSub.revenue}, 0)`,
                orders: sql<number>`COALESCE(${revenueSub.orders}, 0)`,
                staffCount: sql<number>`COALESCE(${staffSub.staffCount}, 0)`,
            })
            .from(branches)
            .leftJoin(revenueSub, eq(revenueSub.branchId, branches.id))
            .leftJoin(staffSub, eq(staffSub.branchId, branches.id))
            .where(eq(branches.organizationId, orgId))
            .orderBy(branches.name)
            .limit(limit)
            .offset(offset)

        return ok(c, {
            data: rows,
            meta: {
                total: Number(count),
                page,
                limit,
                totalPages: Math.ceil(Number(count) / limit),
            },
        })
    } catch (err: any) {
        console.error('[branches/list]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/branches/mine
branchesRouter.get('/mine', authMiddleware, async (c) => {
    try {
        const orgId = await getOrgId(c)
        const rows = await getAccessibleBranches(c, orgId)
        return ok(c, rows)
    } catch (err: any) {
        console.error('[branches/mine]', err)
        return errors.internal(c, err.message)
    }
})

branchesRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.param('id')

        const [branchRow] = await db
            .select()
            .from(branches)
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .limit(1)

        if (!branchRow) return errors.notFound(c, 'Branch not found')

        return ok(c, branchRow)
    } catch (err: any) {
        console.error('[branches/detail]', err)
        return errors.internal(c, err.message)
    }
})

branchesRouter.post('/', authMiddleware, zValidator('json', createBranchSchema), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = c.req.valid('json')

        const { name, code } = body

        const [existing] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.organizationId, orgId), eq(branches.code, code)))
            .limit(1)

        if (existing) return errors.badRequest(c, 'Branch code already exists')

        const [created] = await db
            .insert(branches)
            .values({
                organizationId: orgId,
                name: name.trim(),
                code: code.trim(),
                address: body.address ?? null,
                phone: body.phone ?? null,
                isActive: body.isActive,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[branches/create]', err)
        return errors.internal(c, err.message)
    }
})

branchesRouter.patch('/:id', authMiddleware, zValidator('json', updateBranchSchema), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.param('id')
        const body = c.req.valid('json')

        if (body.code) {
            const [existing] = await db
                .select({ id: branches.id })
                .from(branches)
                .where(and(
                    eq(branches.organizationId, orgId),
                    eq(branches.code, body.code),
                    ne(branches.id, branchId)
                ))
                .limit(1)

            if (existing) return errors.badRequest(c, 'Branch code already exists')
        }

        const updates: Record<string, unknown> = {}
        if (body.name !== undefined) updates.name = body.name.trim()
        if (body.code !== undefined) updates.code = body.code.trim()
        if (body.address !== undefined) updates.address = body.address
        if (body.phone !== undefined) updates.phone = body.phone

        if (Object.keys(updates).length === 0) {
            return errors.badRequest(c, 'No fields to update')
        }

        const updated = await db
            .update(branches)
            .set(updates)
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Branch not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[branches/update]', err)
        return errors.internal(c, err.message)
    }
})

branchesRouter.patch('/:id/status', authMiddleware, zValidator('json', updateStatusSchema), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.param('id')
        const body = c.req.valid('json')

        const updated = await db
            .update(branches)
            .set({ isActive: body.isActive })
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Branch not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[branches/status]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/branches/:id/metrics
branchesRouter.get('/:id/metrics', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.param('id')

        const dateFrom = c.req.query('dateFrom')
        const dateTo = c.req.query('dateTo')

        const from = dateFrom
            ? new Date(`${dateFrom}T00:00:00.000Z`)
            : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z')
        const to = dateTo
            ? new Date(`${dateTo}T23:59:59.999Z`)
            : new Date(new Date().toISOString().slice(0, 10) + 'T23:59:59.999Z')

        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
            return errors.badRequest(c, 'Invalid date range')
        }

        const [branchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .limit(1)

        if (!branchRow) return errors.notFound(c, 'Branch not found')

        const [revenueRows, orderRows, staffRows] = await Promise.all([
            db
                .select({
                    revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`.as('revenue'),
                })
                .from(payments)
                .where(and(
                    eq(payments.organizationId, orgId),
                    eq(payments.branchId, branchId),
                    eq(payments.status, 'SUCCESS'),
                    gte(payments.createdAt, from),
                    lte(payments.createdAt, to),
                )),
            db
                .select({
                    total: sql<number>`COUNT(*)`.as('total'),
                })
                .from(orders)
                .where(and(
                    eq(orders.organizationId, orgId),
                    eq(orders.branchId, branchId),
                    gte(orders.createdAt, from),
                    lte(orders.createdAt, to),
                )),
            db
                .select({
                    staff: sql<number>`COUNT(DISTINCT ${branchMembers.memberId})`.as('staff'),
                })
                .from(branchMembers)
                .innerJoin(member, eq(branchMembers.memberId, member.id))
                .where(and(
                    eq(branchMembers.organizationId, orgId),
                    eq(branchMembers.branchId, branchId),
                    eq(member.status, 'active'),
                )),
        ])

        return ok(c, {
            ordersToday: Number(orderRows[0]?.total ?? 0),
            revenueToday: Number(revenueRows[0]?.revenue ?? 0),
            staffActive: Number(staffRows[0]?.staff ?? 0),
            range: { from, to },
        })
    } catch (err: any) {
        console.error('[branches/metrics]', err)
        return errors.internal(c, err.message)
    }
})
