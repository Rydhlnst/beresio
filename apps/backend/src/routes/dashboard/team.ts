import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId, getUserId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm'
import {
    branches,
    branchMembers,
    invitation,
    member,
    rolePermissions,
    roles,
    user,
} from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const DEFAULT_LIMIT = 50

function normalizeSlug(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
}

export const teamRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

teamRouter.get('/members', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        const search = c.req.query('search')?.trim()
        const roleId = c.req.query('roleId')
        const status = c.req.query('status')
        const branchId = c.req.query('branchId')
        const limit = Math.min(Number(c.req.query('limit') ?? DEFAULT_LIMIT), 100)

        const conditions = [eq(member.organizationId, orgId)]

        if (status) {
            conditions.push(eq(member.status, status))
        }

        if (roleId) {
            conditions.push(eq(member.roleId, roleId))
        }

        if (search) {
            const q = `%${search}%`
            conditions.push(or(
                ilike(user.name, q),
                ilike(user.email, q),
                ilike(member.role, q),
                ilike(roles.name, q),
                ilike(roles.slug, q),
            ))
        }

        if (branchId) {
            conditions.push(sql`exists (
                select 1
                from branch_members bm
                where bm.member_id = ${member.id}
                  and bm.branch_id = ${branchId}
                  and bm.organization_id = ${orgId}
            )`)
        }

        const rows = await db
            .select({
                id: member.id,
                status: member.status,
                createdAt: member.createdAt,
                roleId: member.roleId,
                roleLegacy: member.role,
                userName: user.name,
                userEmail: user.email,
                userImage: user.image,
                roleName: roles.name,
                roleSlug: roles.slug,
                branchId: branches.id,
                branchName: branches.name,
            })
            .from(member)
            .innerJoin(user, eq(member.userId, user.id))
            .leftJoin(roles, eq(member.roleId, roles.id))
            .leftJoin(branchMembers, and(eq(branchMembers.memberId, member.id), eq(branchMembers.isPrimary, true)))
            .leftJoin(branches, eq(branchMembers.branchId, branches.id))
            .where(and(...conditions))
            .orderBy(desc(member.createdAt))
            .limit(limit)

        const data = rows.map((row: any) => ({
            id: row.id,
            name: row.userName,
            email: row.userEmail,
            avatar: row.userImage,
            roleId: row.roleId ?? null,
            role: row.roleSlug ?? row.roleLegacy ?? 'member',
            roleName: row.roleName ?? row.roleLegacy ?? 'Member',
            status: row.status ?? 'active',
            primaryBranch: row.branchId ? { id: row.branchId, name: row.branchName } : null,
            joinedAt: row.createdAt,
        }))

        return ok(c, data)
    } catch (err: any) {
        console.error('[team/members]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.patch('/members/:id/role', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const memberId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        if (!body?.roleId) {
            return errors.badRequest(c, 'roleId is required')
        }

        const [roleRow] = await db
            .select({
                id: roles.id,
                slug: roles.slug,
                name: roles.name,
            })
            .from(roles)
            .where(and(eq(roles.id, body.roleId), eq(roles.organizationId, orgId)))
            .limit(1)

        if (!roleRow) return errors.notFound(c, 'Role not found')

        const updated = await db
            .update(member)
            .set({
                roleId: roleRow.id,
                role: roleRow.slug ?? roleRow.name,
            })
            .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Member not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[team/members/role]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.patch('/members/:id/status', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const memberId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const nextStatus = body?.status
        if (nextStatus !== 'active' && nextStatus !== 'inactive') {
            return errors.badRequest(c, 'status must be active or inactive')
        }

        const updated = await db
            .update(member)
            .set({
                status: nextStatus,
                deactivatedAt: nextStatus === 'inactive' ? new Date() : null,
            })
            .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Member not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[team/members/status]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.post('/members/:id/branches', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const memberId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const branchId = body?.branchId
        if (!branchId) return errors.badRequest(c, 'branchId is required')

        const [branchRow] = await db
            .select({ id: branches.id })
            .from(branches)
            .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
            .limit(1)

        if (!branchRow) return errors.notFound(c, 'Branch not found')

        const [memberRow] = await db
            .select({ id: member.id })
            .from(member)
            .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
            .limit(1)

        if (!memberRow) return errors.notFound(c, 'Member not found')

        if (body?.remove === true) {
            await db
                .delete(branchMembers)
                .where(and(
                    eq(branchMembers.organizationId, orgId),
                    eq(branchMembers.memberId, memberId),
                    eq(branchMembers.branchId, branchId)
                ))

            return ok(c, { removed: true })
        }

        const isPrimary = body?.isPrimary === true

        await db.transaction(async (tx: any) => {
            if (isPrimary) {
                await tx
                    .update(branchMembers)
                    .set({ isPrimary: false })
                    .where(and(
                        eq(branchMembers.organizationId, orgId),
                        eq(branchMembers.memberId, memberId),
                        eq(branchMembers.isPrimary, true)
                    ))
            }

            const [existing] = await tx
                .select({ id: branchMembers.id })
                .from(branchMembers)
                .where(and(
                    eq(branchMembers.organizationId, orgId),
                    eq(branchMembers.memberId, memberId),
                    eq(branchMembers.branchId, branchId)
                ))
                .limit(1)

            if (existing) {
                await tx
                    .update(branchMembers)
                    .set({ isPrimary })
                    .where(eq(branchMembers.id, existing.id))
            } else {
                await tx
                    .insert(branchMembers)
                    .values({
                        organizationId: orgId,
                        memberId,
                        branchId,
                        isPrimary,
                    })
            }
        })

        return ok(c, { assigned: true, isPrimary })
    } catch (err: any) {
        console.error('[team/members/branches]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.get('/roles', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        const rows = await db
            .select({
                id: roles.id,
                name: roles.name,
                slug: roles.slug,
                description: roles.description,
                isSystem: roles.isSystem,
                permissionsCount: sql<number>`COUNT(${rolePermissions.id})`,
            })
            .from(roles)
            .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
            .where(eq(roles.organizationId, orgId))
            .groupBy(roles.id, roles.name, roles.slug, roles.description, roles.isSystem)
            .orderBy(roles.name)

        return ok(c, rows)
    } catch (err: any) {
        console.error('[team/roles]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/team/roles/:id
teamRouter.get('/roles/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const roleId = c.req.param('id')

        const [row] = await db
            .select({
                id: roles.id,
                name: roles.name,
                slug: roles.slug,
                description: roles.description,
                isSystem: roles.isSystem,
                createdAt: roles.createdAt,
                updatedAt: roles.updatedAt,
            })
            .from(roles)
            .where(and(eq(roles.id, roleId), eq(roles.organizationId, orgId)))
            .limit(1)

        if (!row) return errors.notFound(c, 'Role not found')
        return ok(c, row)
    } catch (err: any) {
        console.error('[team/roles/detail]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/team/roles/:id/permissions
teamRouter.get('/roles/:id/permissions', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const roleId = c.req.param('id')

        const [roleRow] = await db
            .select({ id: roles.id })
            .from(roles)
            .where(and(eq(roles.id, roleId), eq(roles.organizationId, orgId)))
            .limit(1)

        if (!roleRow) return errors.notFound(c, 'Role not found')

        const rows = await db
            .select({
                permission: rolePermissions.permission,
            })
            .from(rolePermissions)
            .where(eq(rolePermissions.roleId, roleId))
            .orderBy(rolePermissions.permission)

        return ok(c, rows.map((row: any) => row.permission))
    } catch (err: any) {
        console.error('[team/roles/permissions]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.post('/roles', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const name = body?.name?.trim()
        if (!name) return errors.badRequest(c, 'name is required')

        const slug = normalizeSlug(body?.slug ?? name)
        if (!slug) return errors.badRequest(c, 'slug is required')

        const [existing] = await db
            .select({ id: roles.id })
            .from(roles)
            .where(and(eq(roles.organizationId, orgId), eq(roles.slug, slug)))
            .limit(1)

        if (existing) return errors.badRequest(c, 'Role slug already exists')

        const permissions = Array.isArray(body?.permissions) ? body.permissions.filter(Boolean) : []

        const created = await db.transaction(async (tx: any) => {
            const [roleRow] = await tx
                .insert(roles)
                .values({
                    organizationId: orgId,
                    name,
                    slug,
                    description: body?.description ?? null,
                    isSystem: false,
                })
                .returning()

            if (permissions.length > 0) {
                await tx
                    .insert(rolePermissions)
                    .values(permissions.map((permission: string) => ({
                        organizationId: orgId,
                        roleId: roleRow.id,
                        permission,
                    })))
            }

            return roleRow
        })

        return ok(c, created)
    } catch (err: any) {
        console.error('[team/roles/create]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.put('/roles/:id/permissions', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const roleId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const permissions = Array.isArray(body?.permissions)
            ? body.permissions.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
            : null

        if (!permissions) return errors.badRequest(c, 'permissions must be an array')

        const [roleRow] = await db
            .select({ id: roles.id })
            .from(roles)
            .where(and(eq(roles.id, roleId), eq(roles.organizationId, orgId)))
            .limit(1)

        if (!roleRow) return errors.notFound(c, 'Role not found')

        await db.transaction(async (tx: any) => {
            await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))

            if (permissions.length > 0) {
                await tx
                    .insert(rolePermissions)
                    .values(permissions.map((permission: string) => ({
                        organizationId: orgId,
                        roleId,
                        permission,
                    })))
            }
        })

        return ok(c, { updated: true })
    } catch (err: any) {
        console.error('[team/roles/permissions]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.get('/invitations', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        const rows = await db
            .select({
                id: invitation.id,
                email: invitation.email,
                status: invitation.status,
                sentAt: invitation.sentAt,
                expiresAt: invitation.expiresAt,
                role: invitation.role,
                roleId: invitation.roleId,
                roleName: roles.name,
                roleSlug: roles.slug,
                branchId: invitation.branchId,
                branchName: branches.name,
            })
            .from(invitation)
            .leftJoin(roles, eq(invitation.roleId, roles.id))
            .leftJoin(branches, eq(invitation.branchId, branches.id))
            .where(eq(invitation.organizationId, orgId))
            .orderBy(desc(invitation.sentAt))

        return ok(c, rows.map((row: any) => ({
            id: row.id,
            email: row.email,
            status: row.status,
            sentAt: row.sentAt,
            expiresAt: row.expiresAt,
            roleId: row.roleId,
            role: row.roleSlug ?? row.role,
            roleName: row.roleName ?? row.role,
            branch: row.branchId ? { id: row.branchId, name: row.branchName } : null,
        })))
    } catch (err: any) {
        console.error('[team/invitations]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.post('/invitations', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const inviterId = getUserId(c)
        const body = await c.req.json().catch(() => null)

        const email = body?.email?.trim()
        if (!email) return errors.badRequest(c, 'email is required')

        const branchId = body?.branchId ?? null
        if (branchId) {
            const [branchRow] = await db
                .select({ id: branches.id })
                .from(branches)
                .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
                .limit(1)

            if (!branchRow) return errors.notFound(c, 'Branch not found')
        }

        let roleId = body?.roleId ?? null
        let roleSlug: string | null = body?.role ?? null

        if (roleId) {
            const [roleRow] = await db
                .select({ id: roles.id, slug: roles.slug })
                .from(roles)
                .where(and(eq(roles.id, roleId), eq(roles.organizationId, orgId)))
                .limit(1)

            if (!roleRow) return errors.notFound(c, 'Role not found')
            roleSlug = roleRow.slug
        }

        const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        const [created] = await db
            .insert(invitation)
            .values({
                organizationId: orgId,
                teamId: body?.teamId ?? null,
                email,
                role: roleSlug,
                roleId,
                branchId,
                status: body?.status ?? 'pending',
                sentAt: new Date(),
                expiresAt,
                inviterId,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[team/invitations/create]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.post('/invitations/:id/resend', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const inviteId = c.req.param('id')

        const updated = await db
            .update(invitation)
            .set({ sentAt: new Date(), updatedAt: new Date() })
            .where(and(eq(invitation.id, inviteId), eq(invitation.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Invitation not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[team/invitations/resend]', err)
        return errors.internal(c, err.message)
    }
})

teamRouter.post('/invitations/:id/cancel', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const inviteId = c.req.param('id')

        const updated = await db
            .update(invitation)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(and(eq(invitation.id, inviteId), eq(invitation.organizationId, orgId)))
            .returning()

        if (updated.length === 0) return errors.notFound(c, 'Invitation not found')

        return ok(c, updated[0])
    } catch (err: any) {
        console.error('[team/invitations/cancel]', err)
        return errors.internal(c, err.message)
    }
})
