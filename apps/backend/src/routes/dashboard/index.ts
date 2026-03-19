import { Hono } from 'hono'
import { kpisRouter } from './kpis'
import { performanceRouter } from './performance'
import { rbacRouter } from './rbac'
import { billingRouter } from './billing'
import { activitiesRouter } from './activities'
import { teamRouter } from './team'
import { branchesRouter } from './branches'
import { organizationRouter } from './organization'
import { ordersRouter } from './orders'
import { customersRouter } from './customers'
import { inventoryRouter } from './inventory'
import { reportsRouter } from './reports'
import { pickupRouter } from './pickup'
import { highlightsRouter } from './highlights'
import { settingsRouter } from './settings'

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
dashboardRouter.route('/organization', organizationRouter)
dashboardRouter.route('/orders', ordersRouter)
dashboardRouter.route('/customers', customersRouter)
dashboardRouter.route('/inventory', inventoryRouter)
dashboardRouter.route('/reports', reportsRouter)
dashboardRouter.route('/pickup', pickupRouter)
dashboardRouter.route('/highlights', highlightsRouter)
dashboardRouter.route('/settings', settingsRouter)
