import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { eq } from 'drizzle-orm'
import { organization, user } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const profileBodySchema = z.object({
    name: z.string().trim().min(1).optional(),
    image: z.string().trim().min(1).nullable().optional(),
    avatar: z.string().trim().min(1).nullable().optional(),
}).superRefine((value, ctx) => {
    const hasName = value.name !== undefined
    const hasImage = value.image !== undefined || value.avatar !== undefined
    if (!hasName && !hasImage) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'name or image is required',
            path: [],
        })
    }
})

const integrationBodySchema = z.object({
    connected: z.boolean().optional(),
    payload: z.unknown().optional(),
}).superRefine((value, ctx) => {
    if (value.connected === undefined && value.payload === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'connected or payload is required',
            path: [],
        })
    }
})

const securityBodySchema = z.object({
    passwordPolicy: z.unknown().optional(),
    twoFactor: z.unknown().optional(),
}).superRefine((value, ctx) => {
    if (value.passwordPolicy === undefined && value.twoFactor === undefined) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'passwordPolicy or twoFactor is required',
            path: [],
        })
    }
})

const notificationsBodySchema = z.record(z.unknown())

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

function parseMetadata(raw: string | null) {
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') return parsed as Record<string, any>
        return {}
    } catch {
        return {}
    }
}

function buildMetadata(current: string | null, updater: (data: Record<string, any>) => void) {
    const data = parseMetadata(current)
    updater(data)
    return JSON.stringify(data)
}

export const settingsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// PATCH /api/dashboard/settings/profile
settingsRouter.patch('/profile', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const userId = getUserId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = profileBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const name = parsedBody.data.name
        const image = parsedBody.data.image ?? parsedBody.data.avatar

        const updated = await db
            .update(user)
            .set({
                name: name ?? undefined,
                image: image ?? undefined,
            })
            .where(eq(user.id, userId))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'User not found')
        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[settings/profile]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/settings/integrations/:provider
settingsRouter.patch('/integrations/:provider', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const provider = c.req.param('provider')
        const body = await c.req.json().catch(() => null)
        const parsedBody = integrationBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const { connected, payload } = parsedBody.data

        const [orgRow] = await db
            .select({ id: organization.id, metadata: organization.metadata })
            .from(organization)
            .where(eq(organization.id, orgId))
            .limit(1)
        if (!orgRow) return errors.notFound(c, 'Organization not found')

        const metadata = buildMetadata(orgRow.metadata ?? null, (data) => {
            data.settings = data.settings ?? {}
            data.settings.integrations = data.settings.integrations ?? {}
            data.settings.integrations[provider] = {
                ...(data.settings.integrations[provider] ?? {}),
                ...(connected === undefined ? {} : { connected }),
                ...(payload === undefined ? {} : { payload }),
            }
        })

        const updated = await db
            .update(organization)
            .set({ metadata })
            .where(eq(organization.id, orgId))
            .returning()

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[settings/integrations]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/settings/security
settingsRouter.patch('/security', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = securityBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const { passwordPolicy, twoFactor } = parsedBody.data

        const [orgRow] = await db
            .select({ id: organization.id, metadata: organization.metadata })
            .from(organization)
            .where(eq(organization.id, orgId))
            .limit(1)
        if (!orgRow) return errors.notFound(c, 'Organization not found')

        const metadata = buildMetadata(orgRow.metadata ?? null, (data) => {
            data.settings = data.settings ?? {}
            data.settings.security = {
                ...(data.settings.security ?? {}),
                ...(passwordPolicy !== undefined ? { passwordPolicy } : {}),
                ...(twoFactor !== undefined ? { twoFactor } : {}),
            }
        })

        const updated = await db
            .update(organization)
            .set({ metadata })
            .where(eq(organization.id, orgId))
            .returning()

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[settings/security]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/settings/notifications
settingsRouter.patch('/notifications', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = notificationsBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, 'payload is required')
        }

        const [orgRow] = await db
            .select({ id: organization.id, metadata: organization.metadata })
            .from(organization)
            .where(eq(organization.id, orgId))
            .limit(1)
        if (!orgRow) return errors.notFound(c, 'Organization not found')

        const metadata = buildMetadata(orgRow.metadata ?? null, (data) => {
            data.settings = data.settings ?? {}
            data.settings.notifications = {
                ...(data.settings.notifications ?? {}),
                ...parsedBody.data,
            }
        })

        const updated = await db
            .update(organization)
            .set({ metadata })
            .where(eq(organization.id, orgId))
            .returning()

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[settings/notifications]', err)
        return errors.internal(c)
    }
})
