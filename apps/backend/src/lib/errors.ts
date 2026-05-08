import type { Context } from 'hono'
import { fail, ok } from './response'

export const errors = {
    unauthorized: (c: Context, message = 'Unauthorized') =>
        fail(c, 'UNAUTHORIZED', message, 401),

    forbidden: (c: Context, message = 'Forbidden') =>
        fail(c, 'FORBIDDEN', message, 403),

    notFound: (c: Context, message = 'Not found') =>
        fail(c, 'NOT_FOUND', message, 404),

    badRequest: (c: Context, message = 'Bad request') =>
        fail(c, 'BAD_REQUEST', message, 400),

    internal: (c: Context, message = 'Internal server error') =>
        fail(c, 'INTERNAL_ERROR', message, 500),
}

export { ok }
