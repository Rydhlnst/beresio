import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq, ne, sql } from 'drizzle-orm'
import { branchMembers, branches, payments } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const branchesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

branchesRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        const revenueSub = db
            .select({
                branchId: payments.branchId,
                revenue: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
                orders: sql<number>`COUNT(${payments.id})`,
            })
            .from(payments)
            .where(and(eq(payments.organizationId, orgId), eq(payments.status, 'SUCCESS')))
            .groupBy(payments.branchId)
            .as('revenue')

        const staffSub = db
            .select({
                branchId: branchMembers.branchId,
                staffCount: sql<number>`COUNT(DISTINCT ${branchMembers.memberId})`,
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

        return ok(c, rows)
    } catch (err: any) {
        console.error('[branches/list]', err)
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

branchesRouter.post('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const name = body?.name?.trim()
        const code = body?.code?.trim()

        if (!name || !code) {
            return errors.badRequest(c, 'name and code are required')
        }

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
                name,
                code,
                address: body?.address ?? null,
                phone: body?.phone ?? null,
                isActive: body?.isActive ?? true,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[branches/create]', err)
        return errors.internal(c, err.message)
    }
})

branchesRouter.patch('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        if (body?.code) {
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

        const updated = await db
            .update(branches)
            .set({
                name: body?.name,
                code: body?.code,
                address: body?.address,
                phone: body?.phone,
            })
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Branch not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[branches/update]', err)
        return errors.internal(c, err.message)
    }
})

branchesRouter.patch('/:id/status', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        if (typeof body?.isActive !== 'boolean') {
            return errors.badRequest(c, 'isActive must be boolean')
        }

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
