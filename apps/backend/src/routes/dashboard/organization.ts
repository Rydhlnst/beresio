import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { eq } from 'drizzle-orm'
import { organization } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const updateOrganizationBodySchema = z.object({
    name: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
    businessType: z.string().trim().min(1).optional(),
    logoUrl: z.string().trim().min(1).nullable().optional(),
    metadata: z.record(z.unknown()).optional(),
    timezone: z.string().trim().min(1).optional(),
    currency: z.string().trim().min(1).optional(),
}).superRefine((value, ctx) => {
    if (
        value.name === undefined
        && value.slug === undefined
        && value.businessType === undefined
        && value.logoUrl === undefined
        && value.metadata === undefined
        && value.timezone === undefined
        && value.currency === undefined
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
        return errors.internal(c)
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
        const parsedBody = updateOrganizationBodySchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const {
            name,
            slug,
            businessType,
            logoUrl,
            metadata,
            timezone,
            currency,
        } = parsedBody.data

        const [orgRow] = await db
            .select({ id: organization.id, metadata: organization.metadata })
            .from(organization)
            .where(eq(organization.id, orgId))
            .limit(1)

        if (!orgRow) return errors.notFound(c, 'Organization not found')

        let nextMetadata = orgRow.metadata
        if (metadata !== undefined) {
            nextMetadata = JSON.stringify(metadata)
        } else if (timezone !== undefined || currency !== undefined) {
            let parsed: Record<string, any> = {}
            try {
                parsed = orgRow.metadata ? JSON.parse(orgRow.metadata) : {}
            } catch {
                parsed = {}
            }
            if (timezone !== undefined) parsed.timezone = timezone
            if (currency !== undefined) parsed.currency = currency
            nextMetadata = JSON.stringify(parsed)
        }

        const updated = await db
            .update(organization)
            .set({
                name: name ?? undefined,
                slug: slug ?? undefined,
                businessType: businessType ?? undefined,
                logoUrl: logoUrl ?? undefined,
                metadata: nextMetadata ?? undefined,
            })
            .where(eq(organization.id, orgId))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Organization not found')
        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[organization/update]', err)
        return errors.internal(c)
    }
})
