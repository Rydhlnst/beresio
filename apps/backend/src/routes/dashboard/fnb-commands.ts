import { Hono } from "hono";
import { z } from "zod";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import {
    fnbDomainEvents,
    orderEvents,
    orders,
    payments,
} from "@beresio/db";
import { authMiddleware } from "../../middleware/auth";
import { getOrgId, getUserId } from "../../lib/auth-context";
import { errors } from "../../lib/errors";
import { appendDomainEvent, canTransitionOrderStatus, projectDomainEvent, runFnbProjectorUntilCaughtUp } from "../../lib/fnb-domain";
import { ensureIdempotencyKeyOrError, runIdempotentCommand } from "../../lib/idempotency";
import {
    getBranchScope,
    requireBranchAccess,
    requireOrganization,
    requirePermission,
    type BranchScope,
} from "../../lib/permissions";
import { ManualPaymentProviderAdapter } from "../../lib/payment-provider";
import {
    connectFnbWebSocket,
    invalidateKpiCache,
    publishFnbDomainEvent,
    shouldInvalidateKpiForFnbEvent,
} from "../../lib/realtime";

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    UPSTASH_REDIS_REST_URL?: string;
    UPSTASH_REDIS_REST_TOKEN?: string;
    LAUNDRY_REALTIME_HUB?: any;
    FNB_REALTIME_HUB?: any;
};
type Variables = { db: any; user: any; session: any };

const fnbCommandRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const EVENT_TO_STATUS: Record<string, "confirmed" | "preparing" | "ready" | "completed"> = {
    ORDER_CONFIRMED: "confirmed",
    ORDER_PREPARING: "preparing",
    ORDER_READY: "ready",
    ORDER_COMPLETED: "completed",
};

const replayProjectorSchema = z.object({
    projectorName: z.string().trim().min(1).max(100).optional().default("fnb-core-projector"),
    batchSize: z.coerce.number().int().min(1).max(1000).optional().default(100),
    maxBatches: z.coerce.number().int().min(1).max(200).optional().default(10),
});

function resolveWebSocketBranchId(branchScope: BranchScope) {
    const requested = branchScope.requestedBranchIds?.[0] ?? null;
    if (requested) return { ok: true as const, branchId: requested };

    if (branchScope.isOrgWide) {
        return { ok: true as const, branchId: null as string | null };
    }

    const effective = branchScope.effectiveBranchIds ?? [];
    if (effective.length === 1) {
        return { ok: true as const, branchId: effective[0] ?? null };
    }

    if (effective.length === 0) {
        return { ok: false as const, code: "FORBIDDEN", message: "No access to branch" };
    }

    return {
        ok: false as const,
        code: "BAD_REQUEST",
        message: "branchId is required for websocket when access covers multiple branches",
    };
}

async function resolveOrderBranchId(c: any): Promise<string | null> {
    const db = c.get("db");
    const orgId = (c.get("orgId") as string | undefined) ?? await getOrgId(c);
    const orderId = c.req.param("id");
    if (!orderId) return null;

    const [orderRow] = await db
        .select({ branchId: orders.branchId })
        .from(orders)
        .where(and(eq(orders.organizationId, orgId), eq(orders.id, orderId)))
        .limit(1);

    return orderRow?.branchId ?? null;
}

async function executeOrderLifecycleCommand(
    c: any,
    input: {
        orderId: string;
        eventType: "ORDER_CONFIRMED" | "ORDER_PREPARING" | "ORDER_READY" | "ORDER_COMPLETED";
        note: string;
        idempotencyScope: string;
    }
) {
    const db = c.get("db");
    const orgId = await getOrgId(c);
    const actorId = (() => {
        try {
            return getUserId(c);
        } catch {
            return null;
        }
    })();

    const idempotency = ensureIdempotencyKeyOrError(c);
    if (!idempotency.key) return idempotency.response;

    return runIdempotentCommand(c, {
        orgId,
        scope: `${input.idempotencyScope}:${input.orderId}`,
        idempotencyKey: idempotency.key,
        execute: async () => {
            const result = await db.transaction(async (tx: any) => {
                const [orderRow] = await tx
                    .select({
                        id: orders.id,
                        branchId: orders.branchId,
                        status: orders.status,
                        serviceMode: orders.serviceMode,
                        tableId: orders.tableId,
                        sessionId: orders.sessionId,
                        totalAmount: orders.totalAmount,
                        paymentStatus: orders.paymentStatus,
                    })
                    .from(orders)
                    .where(and(eq(orders.id, input.orderId), eq(orders.organizationId, orgId)))
                    .limit(1);

                if (!orderRow) {
                    return { status: 404, body: { success: false, error: { code: "NOT_FOUND", message: "Order not found" } } };
                }

                const targetStatus = EVENT_TO_STATUS[input.eventType];
                if (!targetStatus) {
                    return {
                        status: 400,
                        body: {
                            success: false,
                            error: {
                                code: "BAD_REQUEST",
                                message: `Unsupported event type: ${input.eventType}`,
                            },
                        },
                    };
                }
                if (!canTransitionOrderStatus(orderRow.status, targetStatus)) {
                    return {
                        status: 400,
                        body: {
                            success: false,
                            error: {
                                code: "BAD_REQUEST",
                                message: `Transisi status tidak valid: ${orderRow.status} -> ${targetStatus}`,
                            },
                        },
                    };
                }

                const event = await appendDomainEvent(tx, {
                    organizationId: orgId,
                    branchId: orderRow.branchId,
                    aggregateType: "order",
                    aggregateId: orderRow.id,
                    eventType: input.eventType,
                    actorId,
                    idempotencyKey: idempotency.key,
                    payload: {
                        orderId: orderRow.id,
                        previousStatus: orderRow.status,
                        nextStatus: targetStatus,
                        tableId: orderRow.tableId,
                        sessionId: orderRow.sessionId,
                    },
                });

                await projectDomainEvent(tx, event);

                await tx.insert(orderEvents).values({
                    organizationId: orgId,
                    orderId: orderRow.id,
                    status: targetStatus,
                    note: input.note,
                    actorId,
                });

                const [updatedOrder] = await tx
                    .select({
                        id: orders.id,
                        orderNumber: orders.orderNumber,
                        status: orders.status,
                        paymentStatus: orders.paymentStatus,
                        serviceMode: orders.serviceMode,
                        tableId: orders.tableId,
                        sessionId: orders.sessionId,
                        totalAmount: orders.totalAmount,
                        updatedAt: orders.updatedAt,
                    })
                    .from(orders)
                    .where(and(eq(orders.id, orderRow.id), eq(orders.organizationId, orgId)))
                    .limit(1);

                return {
                    status: 200,
                    body: { success: true, data: updatedOrder },
                    event,
                };
            });

            if (result.status === 200 && result.event) {
                await Promise.all([
                    publishFnbDomainEvent(c, result.event),
                    shouldInvalidateKpiForFnbEvent(result.event.eventType)
                        ? invalidateKpiCache(c, orgId)
                        : Promise.resolve(),
                ]);
            }

            return result;
        },
    });
}

function createSseResponse(options: {
    c: any;
    orgId: string;
    channel: "orders" | "kds" | "tables";
    eventTypes: string[];
    branchScope: BranchScope;
}) {
    const { c, orgId, channel, eventTypes, branchScope } = options;
    const db = c.get("db");
    const encoder = new TextEncoder();
    const lastEventId = c.req.header("Last-Event-ID");
    const sinceParam = c.req.query("since");
    const startingSequence = Number(sinceParam ?? lastEventId ?? "0");

    const stream = new ReadableStream({
        start(controller) {
            let closed = false;
            let cursor = Number.isFinite(startingSequence) ? startingSequence : 0;
            let pollInterval: ReturnType<typeof setInterval> | null = null;
            let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

            const write = (chunk: string) => controller.enqueue(encoder.encode(chunk));
            const close = () => {
                if (closed) return;
                closed = true;
                if (pollInterval) clearInterval(pollInterval);
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                try {
                    controller.close();
                } catch {
                    // no-op
                }
            };

            const poll = async () => {
                if (closed) return;
                try {
                    const conditions: any[] = [
                        eq(fnbDomainEvents.organizationId, orgId),
                        inArray(fnbDomainEvents.eventType, eventTypes),
                    ];
                    if (cursor > 0) {
                        conditions.push(gt(fnbDomainEvents.sequence, cursor));
                    }
                    if (branchScope.effectiveBranchIds && branchScope.effectiveBranchIds.length > 0) {
                        conditions.push(inArray(fnbDomainEvents.branchId, branchScope.effectiveBranchIds));
                    }

                    const events = await db
                        .select({
                            id: fnbDomainEvents.id,
                            sequence: fnbDomainEvents.sequence,
                            branchId: fnbDomainEvents.branchId,
                            aggregateType: fnbDomainEvents.aggregateType,
                            aggregateId: fnbDomainEvents.aggregateId,
                            eventType: fnbDomainEvents.eventType,
                            occurredAt: fnbDomainEvents.occurredAt,
                            payload: fnbDomainEvents.payload,
                        })
                        .from(fnbDomainEvents)
                        .where(and(...conditions))
                        .orderBy(asc(fnbDomainEvents.sequence))
                        .limit(100);

                    for (const event of events) {
                        cursor = Number(event.sequence ?? cursor);
                        write(`id: ${cursor}\n`);
                        write(`event: ${channel}\n`);
                        write(`data: ${JSON.stringify(event)}\n\n`);
                    }
                } catch {
                    write(`event: error\ndata: ${JSON.stringify({ message: "stream_failure" })}\n\n`);
                }
            };

            write("retry: 2000\n\n");
            pollInterval = setInterval(poll, 2000);
            heartbeatInterval = setInterval(() => {
                if (closed) return;
                write(`event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
            }, 15000);
            void poll();
            c.req.raw.signal?.addEventListener("abort", close);
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}

fnbCommandRouter.post(
    "/orders/:id/confirm",
    authMiddleware,
    requireOrganization,
    requirePermission("order.manage"),
    requireBranchAccess(resolveOrderBranchId),
    async (c) => {
        return executeOrderLifecycleCommand(c, {
            orderId: c.req.param("id"),
            eventType: "ORDER_CONFIRMED",
            note: "ORDER_CONFIRMED emitted",
            idempotencyScope: "fnb.orders.confirm",
        });
    }
);

fnbCommandRouter.post(
    "/orders/:id/preparing",
    authMiddleware,
    requireOrganization,
    requirePermission("kds.manage", "order.manage"),
    requireBranchAccess(resolveOrderBranchId),
    async (c) => {
        return executeOrderLifecycleCommand(c, {
            orderId: c.req.param("id"),
            eventType: "ORDER_PREPARING",
            note: "ORDER_PREPARING emitted",
            idempotencyScope: "fnb.orders.preparing",
        });
    }
);

fnbCommandRouter.post(
    "/orders/:id/ready",
    authMiddleware,
    requireOrganization,
    requirePermission("kds.manage", "order.manage"),
    requireBranchAccess(resolveOrderBranchId),
    async (c) => {
        return executeOrderLifecycleCommand(c, {
            orderId: c.req.param("id"),
            eventType: "ORDER_READY",
            note: "ORDER_READY emitted",
            idempotencyScope: "fnb.orders.ready",
        });
    }
);

fnbCommandRouter.post(
    "/orders/:id/complete",
    authMiddleware,
    requireOrganization,
    requirePermission("order.manage"),
    requireBranchAccess(resolveOrderBranchId),
    async (c) => {
        return executeOrderLifecycleCommand(c, {
            orderId: c.req.param("id"),
            eventType: "ORDER_COMPLETED",
            note: "ORDER_COMPLETED emitted",
            idempotencyScope: "fnb.orders.complete",
        });
    }
);

fnbCommandRouter.post(
    "/orders/:id/payment/settle-manual",
    authMiddleware,
    requireOrganization,
    requirePermission("payment.settle"),
    requireBranchAccess(resolveOrderBranchId),
    async (c) => {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        const orderId = c.req.param("id");

        const idempotency = ensureIdempotencyKeyOrError(c);
        if (!idempotency.key) return idempotency.response;

        const actorId = (() => {
            try {
                return getUserId(c);
            } catch {
                return null;
            }
        })();

        return runIdempotentCommand(c, {
            orgId,
            scope: `fnb.orders.manual_settle:${orderId}`,
            idempotencyKey: idempotency.key,
            execute: async () => {
                const result = await db.transaction(async (tx: any) => {
                    const [orderRow] = await tx
                        .select({
                            id: orders.id,
                            branchId: orders.branchId,
                            totalAmount: orders.totalAmount,
                            paymentStatus: orders.paymentStatus,
                        })
                        .from(orders)
                        .where(and(eq(orders.id, orderId), eq(orders.organizationId, orgId)))
                        .limit(1);
                    if (!orderRow) {
                        return { status: 404, body: { success: false, error: { code: "NOT_FOUND", message: "Order not found" } } };
                    }

                    const provider = new ManualPaymentProviderAdapter();
                    const settleResult = await provider.settlePayment({
                        organizationId: orgId,
                        branchId: orderRow.branchId,
                        orderId: orderRow.id,
                        amount: Number(orderRow.totalAmount ?? 0),
                        idempotencyKey: idempotency.key!,
                    });

                    await tx.insert(payments).values({
                        organizationId: orgId,
                        branchId: orderRow.branchId,
                        orderId: orderRow.id,
                        amount: Number(orderRow.totalAmount ?? 0),
                        status: "SUCCESS",
                        reference: settleResult.providerTransactionId,
                        notes: "Manual settlement",
                    });

                    const event = await appendDomainEvent(tx, {
                        organizationId: orgId,
                        branchId: orderRow.branchId,
                        aggregateType: "order",
                        aggregateId: orderRow.id,
                        eventType: "PAYMENT_SETTLED",
                        actorId,
                        idempotencyKey: idempotency.key,
                        payload: {
                            provider: settleResult.provider,
                            providerTransactionId: settleResult.providerTransactionId,
                            amount: Number(orderRow.totalAmount ?? 0),
                        },
                    });
                    await projectDomainEvent(tx, event);

                    await tx.insert(orderEvents).values({
                        organizationId: orgId,
                        orderId: orderRow.id,
                        status: "completed",
                        note: "PAYMENT_SETTLED emitted",
                        actorId,
                    });

                    const [updated] = await tx
                        .select({
                            id: orders.id,
                            orderNumber: orders.orderNumber,
                            status: orders.status,
                            paymentStatus: orders.paymentStatus,
                            updatedAt: orders.updatedAt,
                        })
                        .from(orders)
                        .where(and(eq(orders.id, orderRow.id), eq(orders.organizationId, orgId)))
                        .limit(1);

                    return {
                        status: 200,
                        body: { success: true, data: { order: updated, payment: settleResult } },
                        event,
                    };
                });

                if (result.status === 200 && result.event) {
                    await Promise.all([
                        publishFnbDomainEvent(c, result.event),
                        shouldInvalidateKpiForFnbEvent(result.event.eventType)
                            ? invalidateKpiCache(c, orgId)
                            : Promise.resolve(),
                    ]);
                }

                return result;
            },
        });
    }
);

fnbCommandRouter.get(
    "/ws/orders",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    requireBranchAccess((c) => c.req.query("branchId") ?? null, { allowMissing: true }),
    async (c) => {
        try {
            const orgId = await getOrgId(c);
            const branchScope = getBranchScope(c);
            const resolvedBranch = resolveWebSocketBranchId(branchScope);
            if (!resolvedBranch.ok) {
                return resolvedBranch.code === "FORBIDDEN"
                    ? errors.forbidden(c, resolvedBranch.message)
                    : errors.badRequest(c, resolvedBranch.message);
            }

            return connectFnbWebSocket(c, {
                orgId,
                stream: "orders",
                branchId: resolvedBranch.branchId,
            });
        } catch (err: any) {
            console.error("[fnb/ws/orders]", err);
            return errors.internal(c);
        }
    }
);

fnbCommandRouter.get(
    "/ws/kds",
    authMiddleware,
    requireOrganization,
    requirePermission("kds.read"),
    requireBranchAccess((c) => c.req.query("branchId") ?? null, { allowMissing: true }),
    async (c) => {
        try {
            const orgId = await getOrgId(c);
            const branchScope = getBranchScope(c);
            const resolvedBranch = resolveWebSocketBranchId(branchScope);
            if (!resolvedBranch.ok) {
                return resolvedBranch.code === "FORBIDDEN"
                    ? errors.forbidden(c, resolvedBranch.message)
                    : errors.badRequest(c, resolvedBranch.message);
            }

            return connectFnbWebSocket(c, {
                orgId,
                stream: "kds",
                branchId: resolvedBranch.branchId,
            });
        } catch (err: any) {
            console.error("[fnb/ws/kds]", err);
            return errors.internal(c);
        }
    }
);

fnbCommandRouter.get(
    "/ws/tables",
    authMiddleware,
    requireOrganization,
    requirePermission("tables.read"),
    requireBranchAccess((c) => c.req.query("branchId") ?? null, { allowMissing: true }),
    async (c) => {
        try {
            const orgId = await getOrgId(c);
            const branchScope = getBranchScope(c);
            const resolvedBranch = resolveWebSocketBranchId(branchScope);
            if (!resolvedBranch.ok) {
                return resolvedBranch.code === "FORBIDDEN"
                    ? errors.forbidden(c, resolvedBranch.message)
                    : errors.badRequest(c, resolvedBranch.message);
            }

            return connectFnbWebSocket(c, {
                orgId,
                stream: "tables",
                branchId: resolvedBranch.branchId,
            });
        } catch (err: any) {
            console.error("[fnb/ws/tables]", err);
            return errors.internal(c);
        }
    }
);

fnbCommandRouter.get(
    "/streams/orders",
    authMiddleware,
    requireOrganization,
    requirePermission("order.read"),
    requireBranchAccess((c) => c.req.query("branchId") ?? null, { allowMissing: true }),
    async (c) => {
        const orgId = await getOrgId(c);
        const branchScope = getBranchScope(c);
        return createSseResponse({
            c,
            orgId,
            channel: "orders",
            eventTypes: ["ORDER_CREATED", "ORDER_CONFIRMED", "ORDER_COMPLETED", "PAYMENT_SETTLED"],
            branchScope,
        });
    }
);

fnbCommandRouter.get(
    "/streams/kds",
    authMiddleware,
    requireOrganization,
    requirePermission("kds.read"),
    requireBranchAccess((c) => c.req.query("branchId") ?? null, { allowMissing: true }),
    async (c) => {
        const orgId = await getOrgId(c);
        const branchScope = getBranchScope(c);
        return createSseResponse({
            c,
            orgId,
            channel: "kds",
            eventTypes: ["ORDER_CONFIRMED", "ORDER_PREPARING", "ORDER_READY", "ORDER_COMPLETED"],
            branchScope,
        });
    }
);

fnbCommandRouter.get(
    "/streams/tables",
    authMiddleware,
    requireOrganization,
    requirePermission("tables.read"),
    requireBranchAccess((c) => c.req.query("branchId") ?? null, { allowMissing: true }),
    async (c) => {
        const orgId = await getOrgId(c);
        const branchScope = getBranchScope(c);
        return createSseResponse({
            c,
            orgId,
            channel: "tables",
            eventTypes: ["TABLE_SESSION_OPENED", "TABLE_SESSION_CLOSED", "ORDER_CREATED", "ORDER_COMPLETED"],
            branchScope,
        });
    }
);

fnbCommandRouter.post(
    "/projectors/replay",
    authMiddleware,
    requireOrganization,
    requirePermission("order.manage"),
    async (c) => {
        const payload = await c.req.json().catch(() => ({}));
        const parsed = replayProjectorSchema.safeParse(payload);
        if (!parsed.success) {
            return c.json({
                success: false,
                error: {
                    code: "BAD_REQUEST",
                    message: parsed.error.issues[0]?.message ?? "Invalid payload",
                },
            }, 400);
        }

        const orgId = await getOrgId(c);
        const db = c.get("db");
        const result = await runFnbProjectorUntilCaughtUp(db, {
            organizationId: orgId,
            projectorName: parsed.data.projectorName,
            batchSize: parsed.data.batchSize,
            maxBatches: parsed.data.maxBatches,
        });

        return c.json({ success: true, data: result });
    }
);

export { fnbCommandRouter };
