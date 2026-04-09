import { member } from '@beresio/db'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'

/**
 * Extracts the organizationId from the authenticated user's session context.
 * Falls back to the first membership when active org is not set in session.
 * Throws when no organization context is available.
 */
export async function getOrgId(c: Context): Promise<string> {
    const session = c.get('session') as any
    const user = c.get('user') as any
    let orgId =
        session?.activeOrganizationId ??
        session?.organizationId ??
        user?.activeOrganizationId ??
        user?.organizationId

    if ((!orgId || String(orgId).trim().length === 0) && user?.id) {
        const db = c.get('db') as any
        if (db) {
            const [membership] = await db
                .select({ organizationId: member.organizationId })
                .from(member)
                .where(eq(member.userId, user.id))
                .limit(1)

            orgId = membership?.organizationId
        }
    }

    if (typeof orgId !== 'string' || orgId.trim().length === 0) {
        throw new Error('NO_ORG_CONTEXT')
    }
    return orgId
}

/**
 * Extracts the userId from the authenticated session context.
 */
export function getUserId(c: Context): string {
    const user = c.get('user') as any
    if (!user?.id) {
        throw new Error('NO_USER_CONTEXT')
    }
    return user.id as string
}
