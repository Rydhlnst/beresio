import type { Context } from 'hono'

export const errors = {
    unauthorized: (c: Context, message = 'Unauthorized') =>
        c.json({ success: false, error: { code: 'UNAUTHORIZED', message } }, 401),

    forbidden: (c: Context, message = 'Forbidden') =>
        c.json({ success: false, error: { code: 'FORBIDDEN', message } }, 403),

    notFound: (c: Context, message = 'Not found') =>
        c.json({ success: false, error: { code: 'NOT_FOUND', message } }, 404),

    badRequest: (c: Context, message = 'Bad request') =>
        c.json({ success: false, error: { code: 'BAD_REQUEST', message } }, 400),

    internal: (c: Context, message = 'Internal server error') =>
        c.json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500),
}

export function ok<T>(c: Context, data: T, meta?: Record<string, unknown>) {
    return c.json({ success: true, data, ...(meta ? { meta } : {}) })
}
