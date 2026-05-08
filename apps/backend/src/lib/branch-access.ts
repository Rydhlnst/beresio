import type { Context } from 'hono'
import { and, eq, inArray } from 'drizzle-orm'
import { branchMembers, branches, member, roles } from '@beresio/db'
import { parseJsonStringArray } from './safe-json'

const ORG_WIDE_ROLE_SLUGS = new Set([
    'owner',
    'admin',
    'administrator',
    'super_admin',
    'superadmin',
    'org_admin',
    'organization_admin',
])

export async function getMemberIdForOrg(c: Context, orgId: string): Promise<string | null> {
    const db = c.get('db')
    const user = c.get('user') as any
    const userId = user?.id
    if (!userId) return null

    const [row] = await db
        .select({ id: member.id })
        .from(member)
        .where(and(eq(member.userId, userId), eq(member.organizationId, orgId)))
        .limit(1)

    return row?.id ?? null
}

function normalizeRoleList(input: unknown): string[] {
    if (typeof input !== 'string') return []

    const trimmed = input.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[')) {
        const parsed = parseJsonStringArray(trimmed)
        if (parsed) return parsed
    }

    return trimmed
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
}

async function getMemberAccessContext(c: Context, orgId: string) {
    const db = c.get('db')
    const user = c.get('user') as any
    const userId = user?.id
    if (!userId) return { memberId: null, roleSlugs: [] }

    const [row] = await db
        .select({
            memberId: member.id,
            roleLegacy: member.role,
            roleSlug: roles.slug,
            roleName: roles.name,
        })
        .from(member)
        .leftJoin(roles, eq(member.roleId, roles.id))
        .where(and(eq(member.userId, userId), eq(member.organizationId, orgId)))
        .limit(1)

    const roleSlugs = new Set<string>()

    if (row?.roleSlug) {
        const normalized = row.roleSlug.toLowerCase().trim()
        if (normalized) roleSlugs.add(normalized)
    }

    if (row?.roleLegacy) {
        for (const role of normalizeRoleList(row.roleLegacy)) {
            roleSlugs.add(role)
        }
    }

    if (row?.roleName) {
        const normalized = row.roleName.toLowerCase().trim()
        if (normalized) roleSlugs.add(normalized)
    }

    const resolvedRoles = Array.from(roleSlugs)
    const isOrgWide = resolvedRoles.some((role) => ORG_WIDE_ROLE_SLUGS.has(role))

    return { memberId: row?.memberId ?? null, roleSlugs: resolvedRoles }
}

export async function getBranchAccessContext(c: Context, orgId: string): Promise<{ branchIds: string[]; isOrgWide: boolean }> {
    const db = c.get('db')
    const { memberId, roleSlugs } = await getMemberAccessContext(c, orgId)
    
    if (!memberId) {
        return { branchIds: [], isOrgWide: false }
    }

    const isOrgWide = roleSlugs.some((role) => ORG_WIDE_ROLE_SLUGS.has(role))

    if (isOrgWide) {
        const rows = await db
            .select({ branchId: branches.id })
            .from(branches)
            .where(eq(branches.organizationId, orgId))
        return { branchIds: rows.map((row: any) => row.branchId), isOrgWide }
    }

    const rows = await db
        .select({ branchId: branchMembers.branchId })
        .from(branchMembers)
        .where(and(eq(branchMembers.organizationId, orgId), eq(branchMembers.memberId, memberId)))

    return { branchIds: rows.map((row: any) => row.branchId), isOrgWide }
}

export async function getAccessibleBranchIds(c: Context, orgId: string): Promise<string[]> {
    const { branchIds } = await getBranchAccessContext(c, orgId)
    return branchIds
}

export async function getAccessibleBranches(c: Context, orgId: string) {
    const db = c.get('db')
    const branchIds = await getAccessibleBranchIds(c, orgId)
    if (branchIds.length === 0) return []

    return db
        .select({
            id: branches.id,
            name: branches.name,
            code: branches.code,
            address: branches.address,
            phone: branches.phone,
            isActive: branches.isActive,
        })
        .from(branches)
        .where(and(eq(branches.organizationId, orgId), inArray(branches.id, branchIds)))
        .orderBy(branches.name)
}

export function hasBranchAccess(branchIds: string[], branchId?: string | null) {
    if (!branchId) return false
    return branchIds.includes(branchId)
}
