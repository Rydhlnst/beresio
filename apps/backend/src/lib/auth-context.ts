import { member } from '@beresio/db'
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'

/**
 * Extracts the organizationId from the authenticated user's session context.
 * Falls back to the first organization from user's memberships if no active org in session.
 * Throws a 401 if no session or org context is available.
 */
export async function getOrgId(c: Context): Promise<string> {
    const session = c.get('session') as any
    const user = c.get('user') as any
    
    // First try: Get from session
    let orgId = session?.activeOrganizationId ?? session?.organizationId
    
    // Second try: Get from user's first membership (consistent with frontend behavior)
    if (!orgId && user?.id) {
        const db = c.get('db');
        const [membership] = await db
            .select({ organizationId: member.organizationId })
            .from(member)
            .where(eq(member.userId, user.id))
            .limit(1);
        
        if (membership) {
            orgId = membership.organizationId;
        }
    }

    if (!orgId) {
        throw new Error('NO_ORG_CONTEXT')
    }
    return orgId as string
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
