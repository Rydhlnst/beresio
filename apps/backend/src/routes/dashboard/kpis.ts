import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, eq, gte, inArray, sql } from 'drizzle-orm'
import { customers, inventoryStocks, orders, pickupOrders } from '@beresio/db'
import { getOrganizationBranchAggregate, resolveScopedBranchIds } from '../../lib/organization-aggregates'
import { getBranchAccessContext, hasBranchAccess } from '../../lib/branch-access'
import { readKpiCache, writeKpiCache } from '../../lib/realtime'

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
}
type Variables = { db: any; user: any; session: any }

export const kpisRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

async function resolveKpiScope(c: any, orgId: string) {
    const requestedBranchId = c.req.query('branchId') ?? c.req.header('x-branch-id') ?? null
    if (requestedBranchId) {
        const { branchIds, isOrgWide } = await getBranchAccessContext(c, orgId)
        if (!isOrgWide && !hasBranchAccess(branchIds, requestedBranchId)) {
            return { ok: false as const, response: errors.forbidden(c, 'No access to branch') }
        }
    }

    const scopedBranchIds = await resolveScopedBranchIds(
        c,
        orgId,
        requestedBranchId ? [requestedBranchId] : undefined
    )

    return {
        ok: true as const,
        requestedBranchId,
        scopedBranchIds,
    }
}

async function loadKpis(c: any, orgId: string, scopedBranchIds: string[]) {
    const db = c.get('db')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [customerResult, aggregate, activeDeliveriesResult, lowStockResult] = await Promise.all([
        db
            .select({ total: sql<number>`COUNT(*)` })
            .from(customers)
            .where(
                and(
                    eq(customers.organizationId, orgId),
                    gte(customers.createdAt, today)
                )
            ),
        getOrganizationBranchAggregate(c, orgId, {
            branchIds: scopedBranchIds,
            range: { from: today, to: null },
        }),
        scopedBranchIds.length === 0
            ? Promise.resolve([{ total: 0 }])
            : db
                .select({ total: sql<number>`COUNT(*)` })
                .from(pickupOrders)
                .innerJoin(orders, eq(pickupOrders.orderId, orders.id))
                .where(and(
                    eq(pickupOrders.organizationId, orgId),
                    inArray(orders.branchId, scopedBranchIds),
                    sql`${pickupOrders.status} <> 'Selesai'`
                )),
        scopedBranchIds.length === 0
            ? Promise.resolve([{ total: 0 }])
            : db
                .select({ total: sql<number>`COUNT(*)` })
                .from(inventoryStocks)
                .where(and(
                    eq(inventoryStocks.organizationId, orgId),
                    inArray(inventoryStocks.branchId, scopedBranchIds),
                    sql`${inventoryStocks.minThreshold} > 0`,
                    sql`${inventoryStocks.quantity} <= ${inventoryStocks.minThreshold}`
                )),
    ])

    return {
        omzetHariIni: aggregate.revenueTotal,
        pesananHariIni: aggregate.totalOrders,
        pelangganBaru: Number(customerResult[0]?.total ?? 0),
        activeBranches: aggregate.activeBranches,
        totalBranches: aggregate.totalBranches,
        activeStaff: aggregate.activeStaff,
        totalRevenueToday: aggregate.revenueTotal,
        totalOrdersToday: aggregate.totalOrders,
        activeDeliveries: Number(activeDeliveriesResult[0]?.total ?? 0),
        lowStockAlerts: Number(lowStockResult[0]?.total ?? 0),
    }
}

async function loadKpisWithCache(c: any, orgId: string, scopedBranchIds: string[]) {
    const cached = await readKpiCache<any>(c, {
        orgId,
        branchIds: scopedBranchIds,
    });
    if (cached) return cached;

    const payload = await loadKpis(c, orgId, scopedBranchIds);
    await writeKpiCache(c, {
        orgId,
        branchIds: scopedBranchIds,
        data: payload,
    });
    return payload;
}

kpisRouter.get('/', authMiddleware, async (c) => {
    try {
        let orgId: string
        try {
            orgId = await getOrgId(c)
        } catch {
            return errors.unauthorized(c, 'No organization context')
        }

        const resolvedScope = await resolveKpiScope(c, orgId)
        if (!resolvedScope.ok) return resolvedScope.response

        const payload = await loadKpisWithCache(c, orgId, resolvedScope.scopedBranchIds)
        return ok(c, payload, {
            scope: resolvedScope.requestedBranchId ? "branch" : "organization",
            branchId: resolvedScope.requestedBranchId,
        })
    } catch (err: any) {
        console.error('[kpis]', err)
        return errors.internal(c, err.message)
    }
})

kpisRouter.get('/stream', authMiddleware, async (c) => {
    let orgId: string
    try {
        orgId = await getOrgId(c)
    } catch {
        return errors.unauthorized(c, 'No organization context')
    }

    const resolvedScope = await resolveKpiScope(c, orgId)
    if (!resolvedScope.ok) return resolvedScope.response

    const scopedBranchIds = resolvedScope.scopedBranchIds
    const encoder = new TextEncoder()
    let timer: ReturnType<typeof setInterval> | null = null

    const stream = new ReadableStream({
        async start(controller) {
            const write = (chunk: string) => controller.enqueue(encoder.encode(chunk))
            const emit = async () => {
                try {
                    const payload = await loadKpisWithCache(c, orgId, scopedBranchIds)
                    write(`event: kpi\ndata: ${JSON.stringify(payload)}\n\n`)
                } catch (err: any) {
                    write(`event: error\ndata: ${JSON.stringify({ message: "kpi_stream_error", detail: err?.message ?? "unknown" })}\n\n`)
                }
            }

            write(`retry: 5000\n\n`)
            await emit()
            timer = setInterval(() => {
                void emit()
            }, 15000)

            const abort = () => {
                if (timer) {
                    clearInterval(timer)
                    timer = null
                }
                try {
                    controller.close()
                } catch {
                    // no-op
                }
            }

            c.req.raw.signal?.addEventListener('abort', abort, { once: true })
        },
        cancel() {
            if (timer) {
                clearInterval(timer)
                timer = null
            }
        },
    })

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    })
})
