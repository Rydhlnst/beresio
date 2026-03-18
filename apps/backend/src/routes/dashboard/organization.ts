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
