import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq, ilike, or, desc } from 'drizzle-orm'
import { customers, customerNotes, customerTagLinks, customerTags } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const createCustomerBodySchema = z.object({
    name: z.string().trim().min(1, 'name and phone are required'),
    phone: z.string().trim().min(1, 'name and phone are required'),
    email: z.string().trim().email().nullable().optional(),
    address: z.string().nullable().optional(),
    loyaltyPoints: z.coerce.number().int().min(0).optional().default(0),
    loyaltyTier: z.string().trim().min(1).optional().default('regular'),
    totalSpentRp: z.coerce.number().min(0).optional().default(0),
})

const updateCustomerBodySchema = z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
    email: z.string().trim().email().nullable().optional(),
    address: z.string().nullable().optional(),
    loyaltyTier: z.string().trim().min(1).optional(),
}).superRefine((value, ctx) => {
    if (
        value.name === undefined
        && value.phone === undefined
        && value.email === undefined
        && value.address === undefined
        && value.loyaltyTier === undefined
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'No fields to update',
            path: [],
        })
    }
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

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
        return errors.internal(c)
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
        return errors.internal(c)
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
        const parsedBody = createCustomerBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const {
            name,
            phone,
            email,
            address,
            loyaltyPoints,
            loyaltyTier,
            totalSpentRp,
        } = parsedBody.data

        const [created] = await db
            .insert(customers)
            .values({
                organizationId: orgId,
                name,
                phone,
                email: email ?? null,
                address: address ?? null,
                loyaltyPoints,
                loyaltyTier,
                totalSpentRp,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[customers/create]', err)
        return errors.internal(c)
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
        const parsedBody = updateCustomerBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const {
            name,
            phone,
            email,
            address,
            loyaltyTier,
        } = parsedBody.data

        const updated = await db
            .update(customers)
            .set({
                name,
                phone,
                email,
                address,
                loyaltyTier,
            })
            .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Customer not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[customers/update]', err)
        return errors.internal(c)
    }
})
