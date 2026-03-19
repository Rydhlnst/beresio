import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { eq } from 'drizzle-orm'
import { organization, user } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

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

        const name = body?.name?.trim()
        const image = body?.image ?? body?.avatar ?? null

        if (!name && image === null) {
            return errors.badRequest(c, 'name or image is required')
        }

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
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/settings/integrations/:provider
settingsRouter.patch('/integrations/:provider', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const provider = c.req.param('provider')
        const body = await c.req.json().catch(() => null)

        const connected = typeof body?.connected === 'boolean' ? body.connected : undefined
        const payload = body?.payload ?? null

        if (connected === undefined && payload === null) {
            return errors.badRequest(c, 'connected or payload is required')
        }

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
                ...(payload ? { payload } : {}),
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
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/settings/security
settingsRouter.patch('/security', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const passwordPolicy = body?.passwordPolicy
        const twoFactor = body?.twoFactor

        if (passwordPolicy === undefined && twoFactor === undefined) {
            return errors.badRequest(c, 'passwordPolicy or twoFactor is required')
        }

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
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/settings/notifications
settingsRouter.patch('/notifications', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        if (!body || typeof body !== 'object') {
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
                ...body,
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
        return errors.internal(c, err.message)
    }
})
