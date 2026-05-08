import type { Context } from 'hono'
import { createDbHttp } from '@beresio/db'
import type { Env } from '../env'

export type AppBindings = Env

export type AppUser = Record<string, unknown> & {
    id?: string
    activeOrganizationId?: string | null
    organizationId?: string | null
}

export type AppSession = Record<string, unknown> & {
    activeOrganizationId?: string | null
    organizationId?: string | null
}

export type AppVariables = {
    db: ReturnType<typeof createDbHttp>
    user: AppUser
    session: AppSession
}

export type AppRoute = {
    Bindings: AppBindings
    Variables: AppVariables
}

export type AppContext = Context<AppRoute>

