import { Hono } from 'hono'
import { authMiddleware } from './middleware/auth'
import { drizzle } from 'drizzle-orm/d1'

type Bindings = {
  DB: D1Database
}

type Variables = {
  db: ReturnType<typeof drizzle>
  user: any
  session: any
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

app.use('*', async (c, next) => {
  const db = drizzle(c.env.DB)
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
