import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { sql, and, eq, desc } from 'drizzle-orm'
import { member, invitation, activityLogs, user, roles } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const rbacRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const DEFAULT_ROLES = [
    { slug: 'owner', name: 'Owner' },
    { slug: 'admin', name: 'Admin' },
    { slug: 'branch_manager', name: 'Branch Manager' },
    { slug: 'cashier', name: 'Cashier' },
    { slug: 'staff', name: 'Staff' },
]

// POST /api/dashboard/rbac/bootstrap
// Ensures default roles exist and links current member to roleId based on legacy role slug.
rbacRouter.post('/bootstrap', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const userId = getUserId(c)

        const [membership] = await db
            .select({
                id: member.id,
                role: member.role,
                roleId: member.roleId,
            })
            .from(member)
            .where(and(eq(member.organizationId, orgId), eq(member.userId, userId)))
            .limit(1)

        if (!membership) {
            return errors.forbidden(c, 'Member not found in organization')
        }

        const roleSlug = (membership.role ?? 'owner').toLowerCase()

        const result = await db.transaction(async (tx: any) => {
            const existingRoles = await tx
                .select({ id: roles.id, slug: roles.slug })
                .from(roles)
                .where(eq(roles.organizationId, orgId))

            const existingBySlug = new Map(
                existingRoles.map((role: any) => [role.slug, role.id])
            )

            const missingRoles = DEFAULT_ROLES.filter(
                (role) => !existingBySlug.has(role.slug)
            )

            if (missingRoles.length > 0) {
                await tx
                    .insert(roles)
                    .values(
                        missingRoles.map((role) => ({
                            organizationId: orgId,
                            name: role.name,
                            slug: role.slug,
                            isSystem: true,
                        }))
                    )
            }

            let resolvedRoleId = existingBySlug.get(roleSlug)
            if (!resolvedRoleId) {
                const [roleRow] = await tx
                    .select({ id: roles.id })
                    .from(roles)
                    .where(and(eq(roles.organizationId, orgId), eq(roles.slug, roleSlug)))
                    .limit(1)

                resolvedRoleId = roleRow?.id ?? null
            }

            let memberUpdated = false
            if (resolvedRoleId && !membership.roleId) {
                await tx
                    .update(member)
                    .set({ roleId: resolvedRoleId })
                    .where(eq(member.id, membership.id))
                memberUpdated = true
            }

            return {
                rolesInserted: missingRoles.length,
                memberUpdated,
                roleSlug,
            }
        })

        return ok(c, result)
    } catch (err: any) {
        console.error('[rbac/bootstrap]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/rbac/summary
rbacRouter.get('/summary', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const roleKey = sql<string>`COALESCE(${roles.slug}, ${member.role})`

        const [roleRows, pendingRows, recentActivityRows] = await Promise.all([
            // Role distribution
            db
                .select({
                    role: roleKey,
                    count: sql<number>`COUNT(*)`,
                })
                .from(member)
                .leftJoin(roles, eq(member.roleId, roles.id))
                .where(eq(member.organizationId, orgId))
                .groupBy(roleKey),

            // Pending invitations
            db
                .select({ total: sql<number>`COUNT(*)` })
                .from(invitation)
                .where(
                    and(
                        eq(invitation.organizationId, orgId),
                        eq(invitation.status, 'pending')
                    )
                ),

            // Recent RBAC activity (last 10 events)
            db
                .select({
                    id: activityLogs.id,
                    type: activityLogs.type,
                    level: activityLogs.level,
                    description: activityLogs.description,
                    actorId: activityLogs.actorId,
                    actorName: user.name,
                    entityType: activityLogs.entityType,
                    entityId: activityLogs.entityId,
                    createdAt: activityLogs.createdAt,
                })
                .from(activityLogs)
                .leftJoin(user, eq(activityLogs.actorId, user.id))
                .where(
                    and(
                        eq(activityLogs.organizationId, orgId),
                        eq(activityLogs.type, 'RBAC')
                    )
                )
                .orderBy(desc(activityLogs.createdAt))
                .limit(10),
        ])

        return ok(c, {
            roleDistribution: roleRows.map((r: any) => ({
                role: r.role,
                count: Number(r.count),
            })),
            pendingInvites: Number(pendingRows[0]?.total ?? 0),
            recentActivity: recentActivityRows,
        })
    } catch (err: any) {
        console.error('[rbac/summary]', err)
        return errors.internal(c, err.message)
    }
})
