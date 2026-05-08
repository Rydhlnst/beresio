export type JsonRecord = Record<string, unknown>

export function isJsonRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJsonRaw(raw: string | null | undefined): unknown | null {
    if (typeof raw !== 'string') return null

    const trimmed = raw.trim()
    if (!trimmed) return null

    try {
        return JSON.parse(trimmed)
    } catch {
        return null
    }
}

export function parseJsonRecord(
    raw: string | null | undefined,
    fallback: JsonRecord = {},
): JsonRecord {
    const parsed = parseJsonRaw(raw)
    return isJsonRecord(parsed) ? parsed : fallback
}

export function parseJsonStringArray(raw: string | null | undefined): string[] | null {
    const parsed = parseJsonRaw(raw)
    if (!Array.isArray(parsed)) return null

    return parsed
        .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
        .filter(Boolean)
}

export function parseJsonWithGuard<T>(
    raw: string | null | undefined,
    guard: (value: unknown) => value is T,
): T | null {
    const parsed = parseJsonRaw(raw)
    if (parsed === null) return null
    return guard(parsed) ? parsed : null
}

export function isLikelyMalformedJsonError(err: unknown): boolean {
    if (!(err instanceof Error)) return false

    const message = err.message.toLowerCase()
    if (message.includes('malformed json')) return true
    if (message.includes('unexpected end of json input')) return true
    if (message.includes('unexpected token') && message.includes('json')) return true
    if (message.includes('json') && message.includes('parse')) return true

    return false
}
