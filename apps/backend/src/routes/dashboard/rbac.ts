import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { sql, and, eq, desc } from 'drizzle-orm'
import { member, invitation, activityLogs, user } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const rbacRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

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

        const [roleRows, pendingRows, recentActivityRows] = await Promise.all([
            // Role distribution
            db
                .select({
                    role: member.role,
                    count: sql<number>`COUNT(*)`,
                })
                .from(member)
                .where(eq(member.organizationId, orgId))
                .groupBy(member.role),

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
