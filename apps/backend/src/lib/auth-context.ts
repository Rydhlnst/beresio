import { member } from '@beresio/db'
import { eq } from 'drizzle-orm'

/**
 * Extracts the organizationId from the authenticated user's session context.
 * Throws a 401 if no session or org context is available.
 */
export async function getOrgId(c: Context): Promise<string> {
    const session = c.get('session') as any
    let orgId = session?.activeOrganizationId ?? session?.organizationId
    
    if (!orgId) {
        // Fallback: If no active org in session, pick the first one from memberships
        const user = c.get('user') as any;
        if (user?.id) {
            const db = c.get('db');
            const [membership] = await db
                .select()
                .from(member)
                .where(eq(member.userId, user.id))
                .limit(1);
            
            if (membership) {
                orgId = membership.organizationId;
            }
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
