import { Hono } from 'hono'
import { kpisRouter } from './kpis'
import { alertsRouter } from './alerts'
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
import { uploadRouter } from './upload'
import { productsRouter } from './products'
import { suppliersRouter } from './suppliers'
import { transactionsRouter } from './transactions'
import { crmRouter } from './crm'
import { fnbRouter } from './fnb'
import { laundryRouter } from './laundry'
import type { AppRoute } from '../../types/app'

export const dashboardRouter = new Hono<AppRoute>()

dashboardRouter.route('/kpis', kpisRouter)
dashboardRouter.route('/alerts', alertsRouter)
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
dashboardRouter.route('/upload', uploadRouter)
dashboardRouter.route('/products', productsRouter)
dashboardRouter.route('/suppliers', suppliersRouter)
dashboardRouter.route('/transactions', transactionsRouter)
dashboardRouter.route('/crm', crmRouter)
dashboardRouter.route('/fnb', fnbRouter)
dashboardRouter.route('/laundry', laundryRouter)
