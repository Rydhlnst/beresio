import { Hono } from 'hono'
import { authMiddleware } from './middleware/auth'
import { createDbHttp } from '@beresio/db'

type Bindings = {
  DATABASE_URL: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

type Variables = {
  db: ReturnType<typeof createDb>
  user: any
  session: any
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

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

export default app
