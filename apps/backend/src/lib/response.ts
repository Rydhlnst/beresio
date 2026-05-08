import type { Context } from 'hono'

type ResponseMeta = Record<string, unknown>

type ErrorShape = {
    code: string
    message: string
    details?: unknown
}

type SuccessResponse<T> = {
    success: true
    data: T
    meta?: ResponseMeta
}

type ErrorResponse = {
    success: false
    error: ErrorShape
}

export const ok = <T>(c: Context, data: T, meta?: ResponseMeta, status = 200) =>
    c.json<SuccessResponse<T>>({ success: true, data, ...(meta ? { meta } : {}) }, status as any)

export const created = <T>(c: Context, data: T, meta?: ResponseMeta) =>
    ok(c, data, meta, 201)

export const noContent = (c: Context) => c.body(null, 204)

export const fail = (
    c: Context,
    code: string,
    message: string,
    status = 400,
    details?: unknown,
) => c.json<ErrorResponse>({ success: false, error: { code, message, ...(details !== undefined ? { details } : {}) } }, status as any)
