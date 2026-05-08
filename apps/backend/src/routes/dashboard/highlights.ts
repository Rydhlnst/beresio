import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { highlights } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const createHighlightBodySchema = z.object({
    title: z.string().trim().min(1, 'title is required'),
    description: z.string().nullable().optional(),
    orderIndex: z.coerce.number().int().optional().default(0),
})

const updateHighlightBodySchema = z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().nullable().optional(),
    orderIndex: z.coerce.number().int().optional(),
    isArchived: z.boolean().optional(),
}).superRefine((value, ctx) => {
    if (
        value.title === undefined
        && value.description === undefined
        && value.orderIndex === undefined
        && value.isArchived === undefined
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'No fields to update',
            path: [],
        })
    }
})

const highlightOrderItemSchema = z.object({
    id: z.string().trim().min(1),
    orderIndex: z.coerce.number().int(),
})

const reorderHighlightsBodySchema = z.object({
    order: z.array(highlightOrderItemSchema).optional(),
    ids: z.array(z.string().trim().min(1)).optional(),
}).superRefine((value, ctx) => {
    const hasOrder = Array.isArray(value.order) && value.order.length > 0
    const hasIds = Array.isArray(value.ids) && value.ids.length > 0
    if (!hasOrder && !hasIds) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'order is required',
            path: [],
        })
    }
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

export const highlightsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/highlights
highlightsRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const includeArchived = c.req.query('includeArchived') === 'true'

        const conditions = [eq(highlights.organizationId, orgId)]
        if (!includeArchived) conditions.push(eq(highlights.isArchived, false))

        const rows = await db
            .select()
            .from(highlights)
            .where(and(...conditions))
            .orderBy(asc(highlights.orderIndex), desc(highlights.createdAt))

        return ok(c, rows)
    } catch (err: any) {
        console.error('[highlights/list]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/highlights
highlightsRouter.post('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = createHighlightBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const { title, description, orderIndex } = parsedBody.data

        const [created] = await db
            .insert(highlights)
            .values({
                organizationId: orgId,
                title,
                description: description ?? null,
                orderIndex,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[highlights/create]', err)
        return errors.internal(c)
    }
})

// GET /api/dashboard/highlights/:id
highlightsRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const highlightId = c.req.param('id')

        const [row] = await db
            .select()
            .from(highlights)
            .where(and(eq(highlights.id, highlightId), eq(highlights.organizationId, orgId)))
            .limit(1)

        if (!row) return errors.notFound(c, 'Highlight not found')
        return ok(c, row)
    } catch (err: any) {
        console.error('[highlights/detail]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/highlights/:id
highlightsRouter.patch('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const highlightId = c.req.param('id')
        const body = await c.req.json().catch(() => null)
        const parsedBody = updateHighlightBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const {
            title,
            description,
            orderIndex,
            isArchived,
        } = parsedBody.data

        const updated = await db
            .update(highlights)
            .set({
                title,
                description,
                orderIndex,
                isArchived,
            })
            .where(and(eq(highlights.id, highlightId), eq(highlights.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Highlight not found')
        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[highlights/update]', err)
        return errors.internal(c)
    }
})

// DELETE /api/dashboard/highlights/:id (archive)
highlightsRouter.delete('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const highlightId = c.req.param('id')

        const updated = await db
            .update(highlights)
            .set({ isArchived: true })
            .where(and(eq(highlights.id, highlightId), eq(highlights.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Highlight not found')
        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[highlights/archive]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/highlights/order
highlightsRouter.patch('/order', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = reorderHighlightsBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const orderList: Array<{ id: string; orderIndex: number }> = Array.isArray(parsedBody.data.order)
            ? parsedBody.data.order
            : Array.isArray(parsedBody.data.ids)
                ? parsedBody.data.ids.map((id: string, index: number) => ({ id, orderIndex: index }))
                : []

        const ids = orderList.map((item) => item.id)

        const existing = await db
            .select({ id: highlights.id })
            .from(highlights)
            .where(and(eq(highlights.organizationId, orgId), inArray(highlights.id, ids)))

        if (existing.length !== ids.length) return errors.badRequest(c, 'Invalid highlight ids')

        await db.transaction(async (tx: any) => {
            for (const item of orderList) {
                await tx
                    .update(highlights)
                    .set({ orderIndex: item.orderIndex })
                    .where(and(eq(highlights.id, item.id), eq(highlights.organizationId, orgId)))
            }
        })

        return ok(c, { updated: true })
    } catch (err: any) {
        console.error('[highlights/order]', err)
        return errors.internal(c)
    }
})
