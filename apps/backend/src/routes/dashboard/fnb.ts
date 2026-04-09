import { Hono } from 'hono'
import { z } from 'zod'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { branches, fnbTableSessions, fnbTables } from '@beresio/db'
import {
    ensureBranchAccessible,
    getBranchScope,
    requireBranchAccess,
    requireOrganization,
    requirePermission,
} from '../../lib/permissions'
import { appendDomainEvent, projectDomainEvent } from '../../lib/fnb-domain'
import { fnbCommandRouter } from './fnb-commands'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const TABLE_STATUS = ['available', 'ordering', 'occupied', 'bill_requested', 'cleaning'] as const
const TABLE_SESSION_STATUS = ['active', 'held', 'closed', 'cancelled'] as const
const TABLE_HOLD_STATE = ['none', 'held', 'resumed', 'released'] as const
const TABLE_SESSION_SOURCE = ['staff_pos', 'self_order'] as const

const createTableSchema = z.object({
    branchId: z.string().trim().min(1, 'branchId is required'),
    code: z.string().trim().min(1, 'code is required').max(30),
    name: z.string().trim().min(1, 'name is required').max(120),
    area: z.string().trim().max(80).nullable().optional(),
    capacity: z.coerce.number().int().min(1, 'capacity must be >= 1').default(1),
    status: z.enum(TABLE_STATUS).optional().default('available'),
    isActive: z.boolean().optional().default(true),
})

const updateTableSchema = z.object({
    id: z.string().trim().min(1, 'id is required'),
    code: z.string().trim().min(1, 'code cannot be empty').max(30).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    area: z.string().trim().max(80).nullable().optional(),
    status: z.enum(TABLE_STATUS).optional(),
    isActive: z.boolean().optional(),
    capacity: z.coerce.number().int().min(1, 'capacity must be >= 1').optional(),
}).superRefine((value, ctx) => {
    if (
        value.code === undefined
        && value.name === undefined
        && value.area === undefined
        && value.status === undefined
        && value.isActive === undefined
        && value.capacity === undefined
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tidak ada field yang diupdate',
            path: [],
        })
    }
})

const createTableSessionSchema = z.object({
    tableId: z.string().trim().min(1, 'tableId is required'),
    orderId: z.string().trim().min(1).nullable().optional(),
    sessionCode: z.string().trim().min(1).max(50).nullable().optional(),
    source: z.enum(TABLE_SESSION_SOURCE).optional().default('staff_pos'),
    holdState: z.enum(TABLE_HOLD_STATE).optional().default('none'),
    guestCount: z.coerce.number().int().min(1).default(1),
    customerName: z.string().max(150).nullable().optional(),
    notes: z.string().nullable().optional(),
})

const updateTableSessionSchema = z.object({
    id: z.string().trim().min(1, 'id is required'),
    status: z.enum(TABLE_SESSION_STATUS).optional(),
    holdState: z.enum(TABLE_HOLD_STATE).optional(),
    orderId: z.string().trim().min(1).nullable().optional(),
    sessionCode: z.string().trim().min(1).max(50).nullable().optional(),
    source: z.enum(TABLE_SESSION_SOURCE).optional(),
    guestCount: z.coerce.number().int().min(1).optional(),
    customerName: z.string().max(150).nullable().optional(),
    notes: z.string().nullable().optional(),
}).superRefine((value, ctx) => {
    if (
        value.status === undefined
        && value.holdState === undefined
        && value.orderId === undefined
        && value.sessionCode === undefined
        && value.source === undefined
        && value.guestCount === undefined
        && value.customerName === undefined
        && value.notes === undefined
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tidak ada field yang diupdate',
            path: [],
        })
    }
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

export const fnbRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/fnb/tables
fnbRouter.get(
    '/tables',
    authMiddleware,
    requireOrganization,
    requirePermission('tables.read'),
    requireBranchAccess((c) => c.req.query('branchId') ?? null, { allowMissing: true }),
    async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.query('branchId')
        const status = c.req.query('status')
        const branchScope = getBranchScope(c)

        const conditions = [eq(fnbTables.organizationId, orgId)]
        if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 0) {
            if (branchScope.effectiveBranchIds.length === 1) {
                conditions.push(eq(fnbTables.branchId, branchScope.effectiveBranchIds[0]!))
            } else {
                conditions.push(inArray(fnbTables.branchId, branchScope.effectiveBranchIds))
            }
        } else if (branchId) {
            conditions.push(eq(fnbTables.branchId, branchId))
        }
        if (status) {
            if (!TABLE_STATUS.includes(status as any)) {
                return errors.badRequest(c, 'Invalid status')
            }
            conditions.push(eq(fnbTables.status, status))
        }

        const rows = await db
            .select({
                id: fnbTables.id,
                branchId: fnbTables.branchId,
                branchName: branches.name,
                code: fnbTables.code,
                name: fnbTables.name,
                area: fnbTables.area,
                capacity: fnbTables.capacity,
                status: fnbTables.status,
                isActive: fnbTables.isActive,
                createdAt: fnbTables.createdAt,
                updatedAt: fnbTables.updatedAt,
            })
            .from(fnbTables)
            .leftJoin(branches, eq(fnbTables.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(asc(fnbTables.branchId), asc(fnbTables.code))

        return ok(c, rows)
    } catch (err: any) {
        console.error('[fnb/tables]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/fnb/tables
fnbRouter.post(
    '/tables',
    authMiddleware,
    requireOrganization,
    requirePermission('tables.manage'),
    requireBranchAccess(async (c) => {
        const payload = await c.req.raw.clone().json().catch(() => null)
        return typeof payload?.branchId === 'string' ? payload.branchId : null
    }),
    async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = createTableSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const {
            branchId,
            code,
            name,
            area,
            capacity,
            status,
            isActive,
        } = parsedBody.data

        const [dup] = await db
            .select({ id: fnbTables.id })
            .from(fnbTables)
            .where(and(
                eq(fnbTables.organizationId, orgId),
                eq(fnbTables.branchId, branchId),
                eq(fnbTables.code, code)
            ))
            .limit(1)
        if (dup) return errors.badRequest(c, 'Kode meja sudah digunakan di cabang ini')

        const [created] = await db
            .insert(fnbTables)
            .values({
                organizationId: orgId,
                branchId,
                code,
                name,
                area,
                capacity,
                status,
                isActive,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[fnb/tables/create]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/fnb/tables
fnbRouter.patch('/tables', authMiddleware, requireOrganization, requirePermission('tables.manage'), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = updateTableSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const {
            id: tableId,
            code,
            name,
            area,
            status,
            isActive,
            capacity,
        } = parsedBody.data

        const [existing] = await db
            .select({
                id: fnbTables.id,
                branchId: fnbTables.branchId,
                code: fnbTables.code,
            })
            .from(fnbTables)
            .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)))
            .limit(1)
        if (!existing) return errors.notFound(c, 'Table not found')

        const branchError = await ensureBranchAccessible(c, orgId, existing.branchId)
        if (branchError) return branchError

        const updates: any = {}
        if (name !== undefined) updates.name = name
        if (area !== undefined) updates.area = area
        if (status !== undefined) updates.status = status
        if (isActive !== undefined) updates.isActive = isActive
        if (capacity !== undefined) updates.capacity = capacity
        if (code !== undefined) updates.code = code

        const [updated] = await db
            .update(fnbTables)
            .set(updates)
            .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)))
            .returning()

        return ok(c, updated)
    } catch (err: any) {
        console.error('[fnb/tables/update]', err)
        return errors.internal(c)
    }
})

// GET /api/dashboard/fnb/table-sessions
fnbRouter.get(
    '/table-sessions',
    authMiddleware,
    requireOrganization,
    requirePermission('tables.read'),
    requireBranchAccess((c) => c.req.query('branchId') ?? null, { allowMissing: true }),
    async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const branchId = c.req.query('branchId')
        const status = c.req.query('status')
        const tableId = c.req.query('tableId')
        const branchScope = getBranchScope(c)

        const conditions = [eq(fnbTableSessions.organizationId, orgId)]
        if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 0) {
            if (branchScope.effectiveBranchIds.length === 1) {
                conditions.push(eq(fnbTableSessions.branchId, branchScope.effectiveBranchIds[0]!))
            } else {
                conditions.push(inArray(fnbTableSessions.branchId, branchScope.effectiveBranchIds))
            }
        } else if (branchId) {
            conditions.push(eq(fnbTableSessions.branchId, branchId))
        }
        if (status) {
            if (!TABLE_SESSION_STATUS.includes(status as any)) {
                return errors.badRequest(c, 'Invalid status')
            }
            conditions.push(eq(fnbTableSessions.status, status))
        }
        if (tableId) conditions.push(eq(fnbTableSessions.tableId, tableId))

        const rows = await db
            .select({
                id: fnbTableSessions.id,
                tableId: fnbTableSessions.tableId,
                tableCode: fnbTables.code,
                tableName: fnbTables.name,
                branchId: fnbTableSessions.branchId,
                branchName: branches.name,
                orderId: fnbTableSessions.orderId,
                sessionCode: fnbTableSessions.sessionCode,
                source: fnbTableSessions.source,
                status: fnbTableSessions.status,
                holdState: fnbTableSessions.holdState,
                guestCount: fnbTableSessions.guestCount,
                customerName: fnbTableSessions.customerName,
                notes: fnbTableSessions.notes,
                openedAt: fnbTableSessions.openedAt,
                closedAt: fnbTableSessions.closedAt,
                openedBy: fnbTableSessions.openedBy,
                createdAt: fnbTableSessions.createdAt,
                updatedAt: fnbTableSessions.updatedAt,
            })
            .from(fnbTableSessions)
            .leftJoin(fnbTables, eq(fnbTableSessions.tableId, fnbTables.id))
            .leftJoin(branches, eq(fnbTableSessions.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(asc(fnbTableSessions.openedAt))

        return ok(c, rows)
    } catch (err: any) {
        console.error('[fnb/table-sessions]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/fnb/table-sessions
fnbRouter.post('/table-sessions', authMiddleware, requireOrganization, requirePermission('tables.manage'), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = createTableSessionSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const {
            tableId,
            orderId,
            sessionCode,
            source,
            holdState,
            guestCount,
            customerName,
            notes,
        } = parsedBody.data

        const [tableRow] = await db
            .select({
                id: fnbTables.id,
                branchId: fnbTables.branchId,
                isActive: fnbTables.isActive,
            })
            .from(fnbTables)
            .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)))
            .limit(1)
        if (!tableRow) return errors.notFound(c, 'Table not found')

        const branchError = await ensureBranchAccessible(c, orgId, tableRow.branchId)
        if (branchError) return branchError
        if (!tableRow.isActive) return errors.badRequest(c, 'Table is inactive')

        const [activeSession] = await db
            .select({ id: fnbTableSessions.id })
            .from(fnbTableSessions)
            .where(and(
                eq(fnbTableSessions.organizationId, orgId),
                eq(fnbTableSessions.tableId, tableId),
                inArray(fnbTableSessions.status, ['active', 'held'])
            ))
            .limit(1)
        if (activeSession) return errors.badRequest(c, 'Table already has active session')

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const [created] = await db.transaction(async (tx: any) => {
            const [session] = await tx
                .insert(fnbTableSessions)
                .values({
                    organizationId: orgId,
                    branchId: tableRow.branchId,
                    tableId,
                    orderId,
                    sessionCode,
                    source,
                    status: 'active',
                    holdState,
                    guestCount,
                    customerName,
                    notes,
                    openedBy: actorId,
                    createdBy: actorId,
                    updatedBy: actorId,
                })
                .returning()

            await tx
                .update(fnbTables)
                .set({ status: 'occupied' })
                .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, tableId)))

            const domainEvent = await appendDomainEvent(tx, {
                organizationId: orgId,
                branchId: tableRow.branchId,
                aggregateType: 'table_session',
                aggregateId: session.id,
                eventType: 'TABLE_SESSION_OPENED',
                actorId,
                payload: {
                    tableId: session.tableId,
                    tableSessionId: session.id,
                    source: session.source,
                    status: session.status,
                },
            })
            await projectDomainEvent(tx, domainEvent)

            return [session]
        })

        return ok(c, created)
    } catch (err: any) {
        console.error('[fnb/table-sessions/create]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/fnb/table-sessions
fnbRouter.patch('/table-sessions', authMiddleware, requireOrganization, requirePermission('tables.manage'), async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = updateTableSessionSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const {
            id: sessionId,
            status,
            holdState,
            orderId,
            sessionCode,
            source,
            guestCount,
            customerName,
            notes,
        } = parsedBody.data

        const [existing] = await db
            .select({
                id: fnbTableSessions.id,
                tableId: fnbTableSessions.tableId,
                branchId: fnbTableSessions.branchId,
            })
            .from(fnbTableSessions)
            .where(and(eq(fnbTableSessions.organizationId, orgId), eq(fnbTableSessions.id, sessionId)))
            .limit(1)
        if (!existing) return errors.notFound(c, 'Table session not found')

        const branchError = await ensureBranchAccessible(c, orgId, existing.branchId)
        if (branchError) return branchError

        const actorId = (() => {
            try {
                return getUserId(c)
            } catch {
                return null
            }
        })()

        const updates: any = {
            updatedBy: actorId,
        }
        if (status !== undefined) updates.status = status
        if (holdState !== undefined) updates.holdState = holdState
        if (orderId !== undefined) updates.orderId = orderId
        if (sessionCode !== undefined) updates.sessionCode = sessionCode
        if (source !== undefined) updates.source = source
        if (guestCount !== undefined) updates.guestCount = guestCount
        if (customerName !== undefined) updates.customerName = customerName
        if (notes !== undefined) updates.notes = notes
        if (updates.status === 'closed' || updates.status === 'cancelled') updates.closedAt = new Date()

        const [updated] = await db.transaction(async (tx: any) => {
            const [session] = await tx
                .update(fnbTableSessions)
                .set(updates)
                .where(and(eq(fnbTableSessions.organizationId, orgId), eq(fnbTableSessions.id, sessionId)))
                .returning()

            await tx
                .update(fnbTables)
                .set({ status: (session.status === 'closed' || session.status === 'cancelled') ? 'available' : 'occupied' })
                .where(and(eq(fnbTables.organizationId, orgId), eq(fnbTables.id, existing.tableId)))

            const eventType = (session.status === 'closed' || session.status === 'cancelled')
                ? 'TABLE_SESSION_CLOSED'
                : 'TABLE_SESSION_OPENED'
            const domainEvent = await appendDomainEvent(tx, {
                organizationId: orgId,
                branchId: session.branchId,
                aggregateType: 'table_session',
                aggregateId: session.id,
                eventType,
                actorId,
                payload: {
                    tableId: existing.tableId,
                    tableSessionId: session.id,
                    status: session.status,
                },
            })
            await projectDomainEvent(tx, domainEvent)

            return [session]
        })

        return ok(c, updated)
    } catch (err: any) {
        console.error('[fnb/table-sessions/update]', err)
        return errors.internal(c)
    }
})

fnbRouter.route('/', fnbCommandRouter)
