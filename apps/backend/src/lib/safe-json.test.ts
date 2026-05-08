import { describe, expect, it } from 'vitest'
import {
    isLikelyMalformedJsonError,
    parseJsonRecord,
    parseJsonStringArray,
    parseJsonWithGuard,
} from './safe-json'

describe('safe-json helpers', () => {
    it('parseJsonRecord returns fallback object for malformed JSON', () => {
        expect(parseJsonRecord('{invalid-json')).toEqual({})
        expect(parseJsonRecord(null)).toEqual({})
    })

    it('parseJsonStringArray returns normalized values for JSON arrays', () => {
        expect(parseJsonStringArray('[" Owner ", "ADMIN"]')).toEqual(['owner', 'admin'])
        expect(parseJsonStringArray('{"role":"owner"}')).toBeNull()
    })

    it('parseJsonWithGuard validates parsed JSON shape', () => {
        const parsed = parseJsonWithGuard<{ cachedAt: number; data: unknown }>(
            '{"cachedAt":123,"data":{"ok":true}}',
            (value): value is { cachedAt: number; data: unknown } =>
                typeof value === 'object'
                && value !== null
                && 'cachedAt' in value
                && typeof (value as { cachedAt: unknown }).cachedAt === 'number'
                && 'data' in value,
        )

        expect(parsed).toEqual({ cachedAt: 123, data: { ok: true } })
        expect(parseJsonWithGuard('{"cachedAt":"wrong"}', (_value): _value is { cachedAt: number } => false)).toBeNull()
    })

    it('isLikelyMalformedJsonError detects JSON parse error signatures', () => {
        expect(isLikelyMalformedJsonError(new Error('Unexpected token } in JSON at position 12'))).toBe(true)
        expect(isLikelyMalformedJsonError(new Error('Malformed JSON in request body'))).toBe(true)
        expect(isLikelyMalformedJsonError(new Error('Database unavailable'))).toBe(false)
    })
})
