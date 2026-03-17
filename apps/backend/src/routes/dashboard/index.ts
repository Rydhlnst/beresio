import { Hono } from 'hono'
import { kpisRouter } from './kpis'
import { performanceRouter } from './performance'
import { rbacRouter } from './rbac'
import { billingRouter } from './billing'
import { activitiesRouter } from './activities'
import { teamRouter } from './team'
import { branchesRouter } from './branches'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

export const dashboardRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

dashboardRouter.route('/kpis', kpisRouter)
dashboardRouter.route('/performance', performanceRouter)
dashboardRouter.route('/rbac', rbacRouter)
dashboardRouter.route('/billing', billingRouter)
dashboardRouter.route('/activities', activitiesRouter)
dashboardRouter.route('/team', teamRouter)
dashboardRouter.route('/branches', branchesRouter)
