import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import { authMiddleware } from './middleware/auth'
import { createDbHttp } from '@beresio/db'
import { dashboardRouter } from './routes/dashboard'
import { businessesRouter } from './routes/businesses'
import { publicRouter } from './routes/public'
import { internalRouter } from './routes/internal'
import { LaundryRealtimeHub } from './lib/realtime'
import type { AppRoute } from './types/app'
import { fail, ok } from './lib/response'
import { isLikelyMalformedJsonError } from './lib/safe-json'

const app = new Hono<AppRoute>()
const dbByUrl = new Map<string, ReturnType<typeof createDbHttp>>()

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
]

function parseAllowedOrigins(raw: string | undefined) {
  const values = (raw ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  const all = values.length > 0 ? values : DEFAULT_ALLOWED_ORIGINS
  return new Set(all)
}

app.use('*', logger())

app.use('/api/*', (c, next) => {
  const allowedOrigins = parseAllowedOrigins(c.env.CORS_ALLOWED_ORIGINS)
  const originHeader = c.req.header('origin')?.trim()
  if (originHeader && !allowedOrigins.has(originHeader)) {
    return fail(c, 'FORBIDDEN', 'Origin not allowed', 403)
  }

  return cors({
    origin: (origin) => (origin && allowedOrigins.has(origin) ? origin : undefined as any),
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })(c, next)
})

app.use('*', async (c, next) => {
  const url = c.env.DATABASE_URL
  let db = dbByUrl.get(url)
  if (!db) {
    db = createDbHttp(url)
    dbByUrl.set(url, db)
  }
  c.set('db', db)
  await next()
})

app.get('/', (c) => {
  return c.text('Hello Beresio Backend!')
})

app.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return ok(c, { user })
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return fail(c, 'HTTP_EXCEPTION', err.message, err.status)
  }

  if (isLikelyMalformedJsonError(err)) {
    return fail(c, 'BAD_REQUEST', 'Invalid JSON payload', 400)
  }

  console.error('[backend/unhandled]', err)
  return fail(c, 'INTERNAL_ERROR', 'Internal server error', 500)
})

app.notFound((c) => fail(c, 'NOT_FOUND', 'Route not found', 404))

// Mount dashboard API routes
const routes = app
  .route('/api/dashboard', dashboardRouter)
  .route('/api/businesses', businessesRouter)
  .route('/api/public', publicRouter)
  .route('/api/internal', internalRouter)

export type AppType = typeof routes
export { LaundryRealtimeHub }

export default app
