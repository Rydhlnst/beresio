import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, desc, eq, lt, sql } from 'drizzle-orm'
import { activityLogs, user } from '@beresio/db'
import { getBranchAccessContext, hasBranchAccess } from '../../lib/branch-access'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const ACTIVITY_TYPES = ['RBAC', 'PAYMENT', 'AUTH', 'SYSTEM', 'BRANCH', 'CUSTOMER'] as const

const listActivitiesQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().trim().min(1).optional(),
    branchId: z.string().trim().min(1).optional(),
    type: z.preprocess(
        (value) => (typeof value === 'string' ? value.trim().toUpperCase() : value),
        z.enum(ACTIVITY_TYPES).optional()
    ),
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid request') {
    return error.issues[0]?.message ?? fallback
}

export const activitiesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * GET /api/dashboard/activities
 * Query params:
 *   - limit: number (default 20, max 50)
 *   - cursor: UUID of the last item from previous page (for cursor pagination)
 *   - type: filter by activity type (RBAC | PAYMENT | AUTH | SYSTEM | BRANCH | CUSTOMER)
 */
activitiesRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const parsedQuery = listActivitiesQuerySchema.safeParse({
            limit: c.req.query('limit') ?? 20,
            cursor: c.req.query('cursor') ?? undefined,
            branchId: c.req.query('branchId') ?? undefined,
            type: c.req.query('type') ?? undefined,
        })
        if (!parsedQuery.success) {
            return errors.badRequest(c, getValidationMessage(parsedQuery.error))
        }

        const { limit, cursor, branchId, type: typeFilter } = parsedQuery.data

        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (!isOrgWide && branchIds.length === 0) {
            return errors.forbidden(c, 'No branch access')
        }
        if (branchId && !isOrgWide && !hasBranchAccess(branchIds, branchId)) {
            return errors.forbidden(c, 'No access to branch')
        }

        // Build where conditions
        const conditions = [eq(activityLogs.organizationId, orgId)]

        if (typeFilter) {
            conditions.push(eq(activityLogs.type, typeFilter.toUpperCase()))
        }
        if (branchId) {
            conditions.push(
                sql`(
                    (${activityLogs.entityType} = 'branch' AND ${activityLogs.entityId} = ${branchId})
                    OR (${activityLogs.metadata} ILIKE ${`%"branchId":"${branchId}"%`})
                )`
            )
        }

        // Cursor: get items created before the cursor item's createdAt
        // We use a simple approach: find the cursor row's createdAt and paginate from there
        if (cursor) {
            const [cursorRow] = await db
                .select({ createdAt: activityLogs.createdAt })
                .from(activityLogs)
                .where(
                    and(
                        eq(activityLogs.id, cursor),
                        eq(activityLogs.organizationId, orgId)
                    )
                )
                .limit(1)

            if (cursorRow) {
                conditions.push(lt(activityLogs.createdAt, cursorRow.createdAt))
            }
        }

        const rows = await db
            .select({
                id: activityLogs.id,
                type: activityLogs.type,
                level: activityLogs.level,
                description: activityLogs.description,
                actorId: activityLogs.actorId,
                actorName: user.name,
                entityType: activityLogs.entityType,
                entityId: activityLogs.entityId,
                metadata: activityLogs.metadata,
                createdAt: activityLogs.createdAt,
            })
            .from(activityLogs)
            .leftJoin(user, eq(activityLogs.actorId, user.id))
            .where(and(...conditions))
            .orderBy(desc(activityLogs.createdAt))
            .limit(limit + 1) // fetch one extra to determine if there's a next page

        const hasMore = rows.length > limit
        const items = hasMore ? rows.slice(0, limit) : rows
        const nextCursor = hasMore ? items[items.length - 1]?.id : null

        return ok(c, items, {
            pagination: {
                limit,
                hasMore,
                nextCursor,
            },
        })
    } catch (err: any) {
        console.error('[activities]', err)
        return errors.internal(c)
    }
})
