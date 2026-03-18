import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq, ilike, or, desc } from 'drizzle-orm'
import { customers, customerNotes, customerTagLinks, customerTags } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const customersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/customers
// Optional query: q, limit
customersRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const q = c.req.query('q')
        const limit = Math.min(Number(c.req.query('limit') ?? 50), 200)

        const conditions = [eq(customers.organizationId, orgId)]
        if (q) {
            conditions.push(or(
                ilike(customers.name, `%${q}%`),
                ilike(customers.phone, `%${q}%`),
                ilike(customers.email, `%${q}%`)
            ))
        }

        const rows = await db
            .select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
                email: customers.email,
                address: customers.address,
                loyaltyPoints: customers.loyaltyPoints,
                loyaltyTier: customers.loyaltyTier,
                totalSpentRp: customers.totalSpentRp,
                createdAt: customers.createdAt,
            })
            .from(customers)
            .where(and(...conditions))
            .orderBy(desc(customers.createdAt))
            .limit(limit)

        return ok(c, rows)
    } catch (err: any) {
        console.error('[customers/list]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/customers/:id
customersRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const customerId = c.req.param('id')

        const [customerRow] = await db
            .select()
            .from(customers)
            .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
            .limit(1)

        if (!customerRow) return errors.notFound(c, 'Customer not found')

        const [tags, notes] = await Promise.all([
            db
                .select({
                    id: customerTags.id,
                    name: customerTags.name,
                    slug: customerTags.slug,
                    color: customerTags.color,
                })
                .from(customerTagLinks)
                .innerJoin(customerTags, eq(customerTagLinks.tagId, customerTags.id))
                .where(and(
                    eq(customerTagLinks.customerId, customerId),
                    eq(customerTagLinks.organizationId, orgId)
                )),
            db
                .select({
                    id: customerNotes.id,
                    note: customerNotes.note,
                    createdAt: customerNotes.createdAt,
                })
                .from(customerNotes)
                .where(and(
                    eq(customerNotes.customerId, customerId),
                    eq(customerNotes.organizationId, orgId)
                ))
                .orderBy(desc(customerNotes.createdAt))
        ])

        return ok(c, {
            ...customerRow,
            tags,
            notes,
        })
    } catch (err: any) {
        console.error('[customers/detail]', err)
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/customers
customersRouter.post('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const body = await c.req.json().catch(() => null)
        const name = body?.name?.trim()
        const phone = body?.phone?.trim()

        if (!name || !phone) {
            return errors.badRequest(c, 'name and phone are required')
        }

        const [created] = await db
            .insert(customers)
            .values({
                organizationId: orgId,
                name,
                phone,
                email: body?.email ?? null,
                address: body?.address ?? null,
                loyaltyPoints: body?.loyaltyPoints ?? 0,
                loyaltyTier: body?.loyaltyTier ?? 'regular',
                totalSpentRp: body?.totalSpentRp ?? 0,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[customers/create]', err)
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/customers/:id
customersRouter.patch('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const customerId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const updated = await db
            .update(customers)
            .set({
                name: body?.name,
                phone: body?.phone,
                email: body?.email,
                address: body?.address,
                loyaltyTier: body?.loyaltyTier,
            })
            .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Customer not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[customers/update]', err)
        return errors.internal(c, err.message)
    }
})
