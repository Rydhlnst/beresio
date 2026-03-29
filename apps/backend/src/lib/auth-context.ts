import type { Context } from 'hono'

/**
 * Extracts the organizationId from the authenticated user's session context.
 * Throws a 401 if no session or org context is available.
 */
export async function getOrgId(c: Context): Promise<string> {
    const session = c.get('session') as any
    const orgId = session?.activeOrganizationId ?? session?.organizationId
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
