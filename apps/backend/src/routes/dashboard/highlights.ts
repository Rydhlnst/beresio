import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import { highlights } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

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
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/highlights
highlightsRouter.post('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const title = body?.title?.trim()
        if (!title) return errors.badRequest(c, 'title is required')

        const [created] = await db
            .insert(highlights)
            .values({
                organizationId: orgId,
                title,
                description: body?.description ?? null,
                orderIndex: Number(body?.orderIndex ?? 0),
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[highlights/create]', err)
        return errors.internal(c, err.message)
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
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/highlights/:id
highlightsRouter.patch('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const highlightId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const updated = await db
            .update(highlights)
            .set({
                title: body?.title ?? undefined,
                description: body?.description ?? undefined,
                orderIndex: body?.orderIndex ?? undefined,
                isArchived: typeof body?.isArchived === 'boolean' ? body.isArchived : undefined,
            })
            .where(and(eq(highlights.id, highlightId), eq(highlights.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Highlight not found')
        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[highlights/update]', err)
        return errors.internal(c, err.message)
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
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/highlights/order
highlightsRouter.patch('/order', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const orderList: Array<{ id: string; orderIndex: number }> = Array.isArray(body?.order)
            ? body.order
            : Array.isArray(body?.ids)
                ? body.ids.map((id: string, index: number) => ({ id, orderIndex: index }))
                : []

        if (orderList.length === 0) return errors.badRequest(c, 'order is required')

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
        return errors.internal(c, err.message)
    }
})
