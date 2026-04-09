import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middleware/auth'
import { createDbHttp } from '@beresio/db'
import { dashboardRouter } from './routes/dashboard'
import { businessesRouter } from './routes/businesses'
import { publicRouter } from './routes/public'
import { internalRouter } from './routes/internal'

type Bindings = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  INTERNAL_API_SECRET?: string
  CORS_ALLOWED_ORIGINS?: string
}

type Variables = {
  db: ReturnType<typeof createDbHttp>
  user: any
  session: any
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

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

app.use('/api/*', (c, next) => {
  const allowedOrigins = parseAllowedOrigins(c.env.CORS_ALLOWED_ORIGINS)
  return cors({
    origin: (origin) => (origin && allowedOrigins.has(origin) ? origin : ''),
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })(c, next)
})

app.use('*', async (c, next) => {
  const db = createDbHttp(c.env.DATABASE_URL)
  c.set('db', db)
  await next()
})

app.get('/', (c) => {
  return c.text('Hello Beresio Backend!')
})

app.get('/me', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json({ user })
})

// Mount dashboard API routes
const routes = app
  .route('/api/dashboard', dashboardRouter)
  .route('/api/businesses', businessesRouter)
  .route('/api/public', publicRouter)
  .route('/api/internal', internalRouter)

export type AppType = typeof routes

export default app
