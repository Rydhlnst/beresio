import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq } from 'drizzle-orm'
import { member, organization, roles } from '@beresio/db'
import { getOrganizationBranchAggregate } from '../../lib/organization-aggregates'
import { markOrganizationWriteDiscouraged } from '../../lib/scope-guard'
import { parseJsonRecord } from '../../lib/safe-json'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const updateOrganizationBodySchema = z.object({
    name: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
    businessType: z.string().trim().min(1).optional(),
    mode: z.enum(["single", "multi"]).optional(),
    logoUrl: z.string().trim().min(1).nullable().optional(),
    metadata: z.record(z.unknown()).optional(),
    timezone: z.string().trim().min(1).optional(),
    currency: z.string().trim().min(1).optional(),
}).superRefine((value, ctx) => {
    if (
        value.name === undefined
        && value.slug === undefined
        && value.businessType === undefined
        && value.mode === undefined
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
                mode: organization.mode,
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

        const parsedMetadata = parseJsonRecord(org.metadata, {})

        const aggregate = await getOrganizationBranchAggregate(c, orgId)

        return ok(c, {
            id: org.id,
            name: org.name,
            slug: org.slug,
            businessType: org.businessType,
            mode: org.mode,
            subscriptionPlan: org.subscriptionPlan,
            logoUrl: org.logoUrl,
            metadata: parsedMetadata,
            createdAt: org.createdAt,
            branchAggregate: {
                totalBranches: aggregate.totalBranches,
                activeBranches: aggregate.activeBranches,
                activeStaff: aggregate.activeStaff,
                revenueTotal: aggregate.revenueTotal,
                totalOrders: aggregate.totalOrders,
                completedOrders: aggregate.completedOrders,
                cancelledOrders: aggregate.cancelledOrders,
            },
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
            mode,
            logoUrl,
            metadata,
            timezone,
            currency,
        } = parsedBody.data

        const [orgRow] = await db
            .select({ id: organization.id, metadata: organization.metadata, mode: organization.mode })
            .from(organization)
            .where(eq(organization.id, orgId))
            .limit(1)

        if (!orgRow) return errors.notFound(c, 'Organization not found')

        if (mode !== undefined) {
            const userId = getUserId(c)
            const [membership] = await db
                .select({
                    roleLegacy: member.role,
                    roleSlug: roles.slug,
                })
                .from(member)
                .leftJoin(roles, eq(member.roleId, roles.id))
                .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
                .limit(1)

            const roleLabel = (membership?.roleSlug ?? membership?.roleLegacy ?? "").toLowerCase()
            if (roleLabel !== "owner") {
                return errors.forbidden(c, 'Only owner can change organization mode')
            }

            if (orgRow.mode === "multi" && mode === "single") {
                return errors.badRequest(c, 'Downgrade from multi to single is not supported')
            }
        }

        let nextMetadata = orgRow.metadata
        if (metadata !== undefined) {
            nextMetadata = JSON.stringify(metadata)
        } else if (timezone !== undefined || currency !== undefined) {
            const parsed = parseJsonRecord(orgRow.metadata, {})
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
                mode: mode ?? undefined,
                logoUrl: logoUrl ?? undefined,
                metadata: nextMetadata ?? undefined,
            })
            .where(eq(organization.id, orgId))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Organization not found')
        await markOrganizationWriteDiscouraged(c, {
            description: 'Organization-level update executed (discouraged, prefer branch-level operations).',
            entityType: 'organization',
            entityId: orgId,
        })
        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[organization/update]', err)
        return errors.internal(c)
    }
})
