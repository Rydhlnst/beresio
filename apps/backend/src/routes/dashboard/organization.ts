import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { eq } from 'drizzle-orm'
import { organization } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const organizationRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/organization
organizationRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const orgRows = await db
            .select({
                id: organization.id,
                name: organization.name,
                slug: organization.slug,
                businessType: organization.businessType,
                subscriptionPlan: organization.subscriptionPlan,
                logoUrl: organization.logoUrl,
                metadata: organization.metadata,
                createdAt: organization.createdAt,
            })
            .from(organization)
            .where(eq(organization.id, orgId))
            .limit(1)

        const org = orgRows[0]
        if (!org) return errors.notFound(c, 'Organization not found')

        let parsedMetadata: unknown = null
        if (org.metadata) {
            try {
                parsedMetadata = JSON.parse(org.metadata)
            } catch {
                parsedMetadata = org.metadata
            }
        }

        return ok(c, {
            id: org.id,
            name: org.name,
            slug: org.slug,
            businessType: org.businessType,
            subscriptionPlan: org.subscriptionPlan,
            logoUrl: org.logoUrl,
            metadata: parsedMetadata,
            createdAt: org.createdAt,
        })
    } catch (err: any) {
        console.error('[organization]', err)
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/organization
organizationRouter.patch('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const body = await c.req.json().catch(() => null)

        const [orgRow] = await db
            .select({ id: organization.id, metadata: organization.metadata })
            .from(organization)
            .where(eq(organization.id, orgId))
            .limit(1)

        if (!orgRow) return errors.notFound(c, 'Organization not found')

        let nextMetadata = orgRow.metadata
        if (body?.metadata && typeof body.metadata === 'object') {
            nextMetadata = JSON.stringify(body.metadata)
        } else if (body?.timezone || body?.currency) {
            let parsed: Record<string, any> = {}
            try {
                parsed = orgRow.metadata ? JSON.parse(orgRow.metadata) : {}
            } catch {
                parsed = {}
            }
            if (body?.timezone) parsed.timezone = body.timezone
            if (body?.currency) parsed.currency = body.currency
            nextMetadata = JSON.stringify(parsed)
        }

        const updated = await db
            .update(organization)
            .set({
                name: body?.name ?? undefined,
                slug: body?.slug ?? undefined,
                businessType: body?.businessType ?? undefined,
                logoUrl: body?.logoUrl ?? undefined,
                metadata: nextMetadata ?? undefined,
            })
            .where(eq(organization.id, orgId))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Organization not found')
        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[organization/update]', err)
        return errors.internal(c, err.message)
    }
})
