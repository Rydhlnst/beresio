import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { sql, and, eq, desc, inArray } from 'drizzle-orm'
import { member, invitation, activityLogs, user, roles, rolePermissions } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const rbacRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

const DEFAULT_ROLES = [
    { slug: 'owner', name: 'Owner' },
    { slug: 'admin', name: 'Admin' },
    { slug: 'branch_manager', name: 'Branch Manager' },
    { slug: 'cashier', name: 'Cashier' },
    { slug: 'laundry_worker', name: 'Laundry Worker' },
    { slug: 'driver', name: 'Driver' },
    { slug: 'staff', name: 'Staff' },
]

const DEFAULT_LAUNDRY_ROLE_PERMISSIONS: Record<string, string[]> = {
    owner: [
        'dashboard.read',
        'branch.read',
        'team.read',
        'settings.read',
        'order.read',
        'order.create',
        'laundry.status.update',
        'laundry.payment.record',
        'laundry.service.manage',
        'pickup.read',
        'pickup.manage',
        'laundry.driver.assign',
        'report.read',
    ],
    admin: [
        'dashboard.read',
        'branch.read',
        'team.read',
        'settings.read',
        'order.read',
        'order.create',
        'laundry.status.update',
        'laundry.payment.record',
        'laundry.service.manage',
        'pickup.read',
        'pickup.manage',
        'laundry.driver.assign',
        'report.read',
    ],
    branch_manager: [
        'dashboard.read',
        'branch.read',
        'team.read',
        'settings.read',
        'order.read',
        'order.create',
        'laundry.status.update',
        'laundry.payment.record',
        'laundry.service.manage',
        'pickup.read',
        'pickup.manage',
        'laundry.driver.assign',
        'report.read',
    ],
    laundry_worker: [
        'order.read',
        'order.create',
        'laundry.status.update',
        'laundry.service.manage',
        'pickup.read',
        'pickup.manage',
    ],
    cashier: [
        'order.read',
        'order.create',
        'laundry.payment.record',
        'report.read',
    ],
    driver: [
        'pickup.read',
        'pickup.manage',
        'laundry.driver.assign',
    ],
}

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

            const seededRoles = await tx
                .select({ id: roles.id, slug: roles.slug })
                .from(roles)
                .where(eq(roles.organizationId, orgId))

            const roleIdBySlug = new Map<string, string>(
                seededRoles.map((role: any): [string, string] => [String(role.slug), String(role.id)])
            )

            const targetRoleIds = Object.keys(DEFAULT_LAUNDRY_ROLE_PERMISSIONS)
                .map((slug) => roleIdBySlug.get(slug))
                .filter((value): value is string => Boolean(value))

            let permissionsInserted = 0
            if (targetRoleIds.length > 0) {
                const existingPermissionRows = await tx
                    .select({ roleId: rolePermissions.roleId, permission: rolePermissions.permission })
                    .from(rolePermissions)
                    .where(and(
                        eq(rolePermissions.organizationId, orgId),
                        inArray(rolePermissions.roleId, targetRoleIds)
                    ))

                const existingPermissionSet = new Set(
                    existingPermissionRows.map((row: any) => `${row.roleId}:${row.permission}`)
                )

                const permissionsToInsert: Array<{ organizationId: string; roleId: string; permission: string }> = []
                for (const [slug, permissions] of Object.entries(DEFAULT_LAUNDRY_ROLE_PERMISSIONS)) {
                    const roleId = roleIdBySlug.get(slug)
                    if (!roleId) continue
                    for (const permission of permissions) {
                        const key = `${roleId}:${permission}`
                        if (existingPermissionSet.has(key)) continue
                        permissionsToInsert.push({
                            organizationId: orgId,
                            roleId,
                            permission,
                        })
                    }
                }

                if (permissionsToInsert.length > 0) {
                    await tx.insert(rolePermissions).values(permissionsToInsert)
                    permissionsInserted = permissionsToInsert.length
                }
            }

            let resolvedRoleId = roleIdBySlug.get(roleSlug)
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
                permissionsInserted,
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
