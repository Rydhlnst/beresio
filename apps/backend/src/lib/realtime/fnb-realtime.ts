import { createUpstashClient } from './upstash'

export const FNB_REALTIME_STREAMS = ['orders', 'kds', 'tables'] as const
export type FnbRealtimeStream = (typeof FNB_REALTIME_STREAMS)[number]

export type FnbDomainEventForRealtime = {
    id?: string
    eventId?: string
    sequence?: number | null
    organizationId: string
    branchId?: string | null
    aggregateType?: string | null
    aggregateId?: string | null
    eventType: string
    occurredAt?: Date | string | null
    payload?: Record<string, unknown> | null
}

export type FnbRealtimeEnvelope = {
    channel: 'fnb'
    stream: FnbRealtimeStream
    orgId: string
    branchId: string | null
    eventId: string
    sequence: number
    aggregateType: string | null
    aggregateId: string | null
    eventType: string
    occurredAt: string
    payload: Record<string, unknown>
}

const EVENT_TO_STREAMS: Record<string, FnbRealtimeStream[]> = {
    ORDER_CREATED: ['orders', 'tables'],
    ORDER_CONFIRMED: ['orders', 'kds'],
    ORDER_PREPARING: ['kds'],
    ORDER_READY: ['kds'],
    ORDER_COMPLETED: ['orders', 'kds', 'tables'],
    PAYMENT_SETTLED: ['orders'],
    TABLE_SESSION_OPENED: ['tables'],
    TABLE_SESSION_CLOSED: ['tables'],
}

const KPI_INVALIDATION_EVENT_TYPES = new Set<string>([
    'ORDER_CREATED',
    'ORDER_CONFIRMED',
    'ORDER_PREPARING',
    'ORDER_READY',
    'ORDER_COMPLETED',
    'PAYMENT_SETTLED',
])

function resolveNamespace(env: any) {
    return env?.FNB_REALTIME_HUB ?? env?.LAUNDRY_REALTIME_HUB
}

function buildRoomName(stream: FnbRealtimeStream, orgId: string, branchId?: string | null) {
    if (branchId) return `fnb:${stream}:org:${orgId}:branch:${branchId}`
    return `fnb:${stream}:org:${orgId}:all`
}

function resolveOccurredAt(value: Date | string | null | undefined) {
    const parsed = new Date(value ?? Date.now())
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString()
}

function resolveEventId(event: FnbDomainEventForRealtime) {
    if (typeof event.id === 'string' && event.id.trim().length > 0) return event.id
    if (typeof event.eventId === 'string' && event.eventId.trim().length > 0) return event.eventId
    return `${event.eventType}:${Number(event.sequence ?? 0)}:${Date.now()}`
}

function toRealtimeEnvelope(
    event: FnbDomainEventForRealtime,
    stream: FnbRealtimeStream
): FnbRealtimeEnvelope {
    return {
        channel: 'fnb',
        stream,
        orgId: event.organizationId,
        branchId: event.branchId ?? null,
        eventId: resolveEventId(event),
        sequence: Number(event.sequence ?? 0),
        aggregateType: event.aggregateType ?? null,
        aggregateId: event.aggregateId ?? null,
        eventType: event.eventType,
        occurredAt: resolveOccurredAt(event.occurredAt),
        payload: event.payload ?? {},
    }
}

export function resolveFnbStreamsForEvent(eventType: string): FnbRealtimeStream[] {
    return EVENT_TO_STREAMS[eventType] ?? []
}

export function shouldInvalidateKpiForFnbEvent(eventType: string) {
    return KPI_INVALIDATION_EVENT_TYPES.has(eventType)
}

async function publishEnvelope(c: any, envelope: FnbRealtimeEnvelope) {
    const serialized = JSON.stringify(envelope)
    const redis = createUpstashClient(c?.env)
    if (redis.enabled) {
        const branchChannel = envelope.branchId
            ? `realtime:fnb:${envelope.stream}:${envelope.orgId}:branch:${envelope.branchId}`
            : null

        const tasks: Array<Promise<void>> = [
            redis.publish(`realtime:fnb:${envelope.stream}:${envelope.orgId}:all`, serialized),
        ]
        if (branchChannel) tasks.push(redis.publish(branchChannel, serialized))
        await Promise.all(tasks).catch(() => undefined)
    }

    const namespace = resolveNamespace(c?.env)
    if (!namespace?.idFromName || !namespace?.get) return

    const targets = [
        buildRoomName(envelope.stream, envelope.orgId),
        buildRoomName(envelope.stream, envelope.orgId, envelope.branchId),
    ]
    const uniqueTargets = Array.from(new Set(targets))
    await Promise.all(uniqueTargets.map(async (target) => {
        const id = namespace.idFromName(target)
        const stub = namespace.get(id)
        await stub.fetch('https://fnb-realtime-hub/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: serialized,
        }).catch(() => undefined)
    }))
}

export async function publishFnbDomainEvent(
    c: any,
    event: FnbDomainEventForRealtime,
    options?: { streams?: FnbRealtimeStream[] }
) {
    const streams = Array.from(new Set(options?.streams ?? resolveFnbStreamsForEvent(event.eventType)))
    if (streams.length === 0) return

    await Promise.all(
        streams.map(async (stream) => {
            const envelope = toRealtimeEnvelope(event, stream)
            await publishEnvelope(c, envelope)
        })
    )
}

export async function connectFnbWebSocket(
    c: any,
    options: { orgId: string; stream: FnbRealtimeStream; branchId?: string | null }
) {
    const upgrade = c.req.header('upgrade') ?? c.req.header('Upgrade')
    if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
        return c.json({
            success: false,
            error: {
                code: 'BAD_REQUEST',
                message: 'Expected Upgrade: websocket',
            },
        }, 400)
    }

    const namespace = resolveNamespace(c?.env)
    if (!namespace?.idFromName || !namespace?.get) {
        return c.json({
            success: false,
            error: {
                code: 'NOT_IMPLEMENTED',
                message: 'WebSocket hub is not configured',
            },
        }, 501)
    }

    const room = buildRoomName(options.stream, options.orgId, options.branchId ?? null)
    const id = namespace.idFromName(room)
    const stub = namespace.get(id)

    return stub.fetch(c.req.raw)
}
