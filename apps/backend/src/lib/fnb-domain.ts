import { and, asc, eq, gt, inArray } from "drizzle-orm";
import {
    type DomainEventEnvelope,
    fnbDomainEvents,
    fnbKdsItems,
    fnbProjectorCheckpoints,
    fnbTableSessions,
    fnbTables,
    orderItems,
    orders,
    stockMovements,
} from "@beresio/db";
import { adjustStockQuantity, recordStockMovement } from "./stock";

export const FNB_ORDER_TRANSITION_RULES: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["served", "completed", "cancelled"],
    served: ["completed", "cancelled"],
    completed: [],
    cancelled: ["pending"],
};

export function canTransitionOrderStatus(currentStatus: string, nextStatus: string) {
    if (currentStatus === nextStatus) return true;
    const allowed = FNB_ORDER_TRANSITION_RULES[currentStatus] ?? [];
    return allowed.includes(nextStatus);
}

export async function appendDomainEvent(
    tx: any,
    input: {
        organizationId: string;
        branchId?: string | null;
        aggregateType: "order" | "table_session" | "payment";
        aggregateId: string;
        eventType: DomainEventEnvelope["eventType"];
        actorId?: string | null;
        idempotencyKey?: string | null;
        payload?: Record<string, unknown>;
    }
): Promise<DomainEventEnvelope> {
    const [eventRow] = await tx
        .insert(fnbDomainEvents)
        .values({
            organizationId: input.organizationId,
            branchId: input.branchId ?? null,
            aggregateType: input.aggregateType,
            aggregateId: input.aggregateId,
            eventType: input.eventType,
            actorId: input.actorId ?? null,
            idempotencyKey: input.idempotencyKey ?? null,
            payload: input.payload ?? {},
        })
        .returning({
            eventId: fnbDomainEvents.id,
            sequence: fnbDomainEvents.sequence,
            organizationId: fnbDomainEvents.organizationId,
            branchId: fnbDomainEvents.branchId,
            aggregateType: fnbDomainEvents.aggregateType,
            aggregateId: fnbDomainEvents.aggregateId,
            eventType: fnbDomainEvents.eventType,
            occurredAt: fnbDomainEvents.occurredAt,
            actorId: fnbDomainEvents.actorId,
            idempotencyKey: fnbDomainEvents.idempotencyKey,
            payload: fnbDomainEvents.payload,
        });

    return {
        ...eventRow,
        aggregateType: eventRow.aggregateType as DomainEventEnvelope["aggregateType"],
        eventType: eventRow.eventType as DomainEventEnvelope["eventType"],
        payload: (eventRow.payload ?? {}) as Record<string, unknown>,
    };
}

async function projectOrderCreated(tx: any, event: DomainEventEnvelope) {
    const [orderRow] = await tx
        .select({
            id: orders.id,
            branchId: orders.branchId,
            serviceMode: orders.serviceMode,
            tableId: orders.tableId,
            sessionId: orders.sessionId,
            holdState: orders.holdState,
            guestCount: orders.guestCount,
            source: orders.source,
        })
        .from(orders)
        .where(and(
            eq(orders.id, event.aggregateId),
            eq(orders.organizationId, event.organizationId)
        ))
        .limit(1);
    if (!orderRow) return;
    if (orderRow.serviceMode !== "dine_in" || !orderRow.tableId) return;

    const tableStatus = orderRow.source === "self_order" ? "ordering" : "occupied";
    await tx
        .update(fnbTables)
        .set({ status: tableStatus })
        .where(and(
            eq(fnbTables.organizationId, event.organizationId),
            eq(fnbTables.id, orderRow.tableId)
        ));

    if (orderRow.sessionId) {
        await tx
            .update(fnbTableSessions)
            .set({
                orderId: orderRow.id,
                guestCount: Number(orderRow.guestCount ?? 1),
                holdState: orderRow.holdState ?? "none",
                status: orderRow.holdState === "held" ? "held" : "active",
                closedAt: null,
                updatedBy: event.actorId ?? null,
            })
            .where(and(
                eq(fnbTableSessions.organizationId, event.organizationId),
                eq(fnbTableSessions.id, orderRow.sessionId)
            ));
        return;
    }

    const [session] = await tx
        .insert(fnbTableSessions)
        .values({
            organizationId: event.organizationId,
            branchId: orderRow.branchId,
            tableId: orderRow.tableId,
            orderId: orderRow.id,
            source: orderRow.source === "self_order" ? "self_order" : "staff_pos",
            holdState: orderRow.holdState ?? "none",
            status: orderRow.holdState === "held" ? "held" : "active",
            guestCount: Number(orderRow.guestCount ?? 1),
            createdBy: event.actorId ?? null,
            updatedBy: event.actorId ?? null,
            openedBy: event.actorId ?? null,
        })
        .returning({ id: fnbTableSessions.id });

    await tx
        .update(orders)
        .set({ sessionId: session.id })
        .where(and(
            eq(orders.id, orderRow.id),
            eq(orders.organizationId, event.organizationId)
        ));
}

async function projectOrderConfirmed(tx: any, event: DomainEventEnvelope) {
    const [orderRow] = await tx
        .select({
            id: orders.id,
            branchId: orders.branchId,
            tableId: orders.tableId,
            sessionId: orders.sessionId,
        })
        .from(orders)
        .where(and(
            eq(orders.id, event.aggregateId),
            eq(orders.organizationId, event.organizationId)
        ))
        .limit(1);
    if (!orderRow) return;

    await tx
        .update(orders)
        .set({ status: "confirmed" })
        .where(and(eq(orders.id, orderRow.id), eq(orders.organizationId, event.organizationId)));

    const itemRows = await tx
        .select({
            id: orderItems.id,
            inventoryProductId: orderItems.inventoryProductId,
            quantity: orderItems.quantity,
            station: orderItems.snapshotStation,
            prepTimeMinutes: orderItems.snapshotPrepTimeMinutes,
            fallbackStation: orderItems.station,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderRow.id));

    for (const item of itemRows) {
        if (item.inventoryProductId) {
            const [alreadyApplied] = await tx
                .select({ id: stockMovements.id })
                .from(stockMovements)
                .where(and(
                    eq(stockMovements.organizationId, event.organizationId),
                    eq(stockMovements.productId, item.inventoryProductId),
                    eq(stockMovements.refType, "domain_event"),
                    eq(stockMovements.refId, event.eventId)
                ))
                .limit(1);

            if (!alreadyApplied) {
                await adjustStockQuantity(tx, {
                    orgId: event.organizationId,
                    productId: item.inventoryProductId,
                    branchId: orderRow.branchId,
                    delta: -Number(item.quantity ?? 0),
                });
                await recordStockMovement(tx, {
                    orgId: event.organizationId,
                    productId: item.inventoryProductId,
                    branchId: orderRow.branchId,
                    delta: -Number(item.quantity ?? 0),
                    reason: "order_confirmed",
                    refType: "domain_event",
                    refId: event.eventId,
                    actorId: event.actorId,
                });
            }
        }

        const prepTime = Number(item.prepTimeMinutes ?? 0);
        const now = new Date();
        const targetReadyAt = new Date(now.getTime() + Math.max(0, prepTime) * 60 * 1000);
        const resolvedStation = item.station ?? item.fallbackStation ?? "kitchen";
        const priority = prepTime <= 5 ? 2 : 1;

        await tx
            .insert(fnbKdsItems)
            .values({
                organizationId: event.organizationId,
                branchId: orderRow.branchId,
                orderId: orderRow.id,
                orderItemId: item.id,
                sessionId: orderRow.sessionId,
                tableId: orderRow.tableId,
                station: resolvedStation,
                status: "new",
                priority,
                targetReadyAt,
                elapsedSeconds: 0,
                isOverdue: false,
            })
            .onConflictDoUpdate({
                target: fnbKdsItems.orderItemId,
                set: {
                    station: resolvedStation,
                    status: "new",
                    priority,
                    targetReadyAt,
                    updatedAt: now,
                },
            });
    }
}

async function projectOrderPreparing(tx: any, event: DomainEventEnvelope) {
    await tx
        .update(orders)
        .set({ status: "preparing" })
        .where(and(eq(orders.id, event.aggregateId), eq(orders.organizationId, event.organizationId)));

    await tx
        .update(fnbKdsItems)
        .set({
            status: "cooking",
            startedAt: new Date(),
        })
        .where(and(
            eq(fnbKdsItems.organizationId, event.organizationId),
            eq(fnbKdsItems.orderId, event.aggregateId)
        ));
}

async function projectOrderReady(tx: any, event: DomainEventEnvelope) {
    await tx
        .update(orders)
        .set({ status: "ready" })
        .where(and(eq(orders.id, event.aggregateId), eq(orders.organizationId, event.organizationId)));

    const rows = await tx
        .select({
            id: fnbKdsItems.id,
            startedAt: fnbKdsItems.startedAt,
            targetReadyAt: fnbKdsItems.targetReadyAt,
        })
        .from(fnbKdsItems)
        .where(and(
            eq(fnbKdsItems.organizationId, event.organizationId),
            eq(fnbKdsItems.orderId, event.aggregateId)
        ));

    const now = new Date();
    for (const row of rows) {
        const started = row.startedAt ? new Date(row.startedAt).getTime() : now.getTime();
        const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - started) / 1000));
        const isOverdue = row.targetReadyAt ? now.getTime() > new Date(row.targetReadyAt).getTime() : false;
        await tx
            .update(fnbKdsItems)
            .set({
                status: "ready",
                completedAt: now,
                elapsedSeconds,
                isOverdue,
            })
            .where(eq(fnbKdsItems.id, row.id));
    }
}

async function projectOrderCompleted(tx: any, event: DomainEventEnvelope) {
    await tx
        .update(orders)
        .set({
            status: "completed",
            completedAt: new Date(),
            holdState: "released",
            heldAt: null,
        })
        .where(and(eq(orders.id, event.aggregateId), eq(orders.organizationId, event.organizationId)));

    await tx
        .update(fnbKdsItems)
        .set({
            status: "served",
            completedAt: new Date(),
        })
        .where(and(
            eq(fnbKdsItems.organizationId, event.organizationId),
            eq(fnbKdsItems.orderId, event.aggregateId)
        ));

    const sessions = await tx
        .select({
            id: fnbTableSessions.id,
            tableId: fnbTableSessions.tableId,
        })
        .from(fnbTableSessions)
        .where(and(
            eq(fnbTableSessions.organizationId, event.organizationId),
            eq(fnbTableSessions.orderId, event.aggregateId),
            inArray(fnbTableSessions.status, ["active", "held"])
        ));

    if (sessions.length === 0) return;

    await tx
        .update(fnbTableSessions)
        .set({
            status: "closed",
            holdState: "released",
            closedAt: new Date(),
            updatedBy: event.actorId ?? null,
        })
        .where(and(
            eq(fnbTableSessions.organizationId, event.organizationId),
            eq(fnbTableSessions.orderId, event.aggregateId),
            inArray(fnbTableSessions.status, ["active", "held"])
        ));

    for (const session of sessions) {
        await tx
            .update(fnbTables)
            .set({ status: "available" })
            .where(and(
                eq(fnbTables.organizationId, event.organizationId),
                eq(fnbTables.id, session.tableId)
            ));
    }
}

async function projectPaymentSettled(tx: any, event: DomainEventEnvelope) {
    await tx
        .update(orders)
        .set({ paymentStatus: "paid" })
        .where(and(eq(orders.id, event.aggregateId), eq(orders.organizationId, event.organizationId)));
}

async function projectTableSessionStatus(tx: any, event: DomainEventEnvelope, closed: boolean) {
    const tableId = (event.payload?.tableId as string | undefined) ?? null;
    if (!tableId) return;
    await tx
        .update(fnbTables)
        .set({ status: closed ? "available" : "ordering" })
        .where(and(
            eq(fnbTables.organizationId, event.organizationId),
            eq(fnbTables.id, tableId)
        ));
}

export async function projectDomainEvent(
    tx: any,
    event: DomainEventEnvelope,
    projectorName = "fnb-core-projector"
) {
    switch (event.eventType) {
        case "ORDER_CREATED":
            await projectOrderCreated(tx, event);
            break;
        case "ORDER_CONFIRMED":
            await projectOrderConfirmed(tx, event);
            break;
        case "ORDER_PREPARING":
            await projectOrderPreparing(tx, event);
            break;
        case "ORDER_READY":
            await projectOrderReady(tx, event);
            break;
        case "ORDER_COMPLETED":
            await projectOrderCompleted(tx, event);
            break;
        case "PAYMENT_SETTLED":
            await projectPaymentSettled(tx, event);
            break;
        case "TABLE_SESSION_OPENED":
            await projectTableSessionStatus(tx, event, false);
            break;
        case "TABLE_SESSION_CLOSED":
            await projectTableSessionStatus(tx, event, true);
            break;
        default:
            break;
    }

    await tx
        .insert(fnbProjectorCheckpoints)
        .values({
            organizationId: event.organizationId,
            projectorName,
            lastSequence: Number(event.sequence ?? 0),
        })
        .onConflictDoUpdate({
            target: [fnbProjectorCheckpoints.organizationId, fnbProjectorCheckpoints.projectorName],
            set: {
                lastSequence: Number(event.sequence ?? 0),
                updatedAt: new Date(),
            },
        });
}

function toDomainEventEnvelope(eventRow: any): DomainEventEnvelope {
    return {
        eventId: eventRow.id,
        sequence: Number(eventRow.sequence ?? 0),
        organizationId: eventRow.organizationId,
        branchId: eventRow.branchId ?? null,
        aggregateType: eventRow.aggregateType,
        aggregateId: eventRow.aggregateId,
        eventType: eventRow.eventType,
        occurredAt: eventRow.occurredAt,
        actorId: eventRow.actorId ?? null,
        idempotencyKey: eventRow.idempotencyKey ?? null,
        payload: (eventRow.payload ?? {}) as Record<string, unknown>,
    };
}

export async function runFnbProjectorBatch(
    db: any,
    input: {
        organizationId: string;
        projectorName?: string;
        batchSize?: number;
        fromSequence?: number;
    }
) {
    const projectorName = input.projectorName ?? "fnb-core-projector";
    const batchSize = Math.max(1, Math.min(input.batchSize ?? 100, 1000));

    return db.transaction(async (tx: any) => {
        const [checkpoint] = await tx
            .select({ lastSequence: fnbProjectorCheckpoints.lastSequence })
            .from(fnbProjectorCheckpoints)
            .where(and(
                eq(fnbProjectorCheckpoints.organizationId, input.organizationId),
                eq(fnbProjectorCheckpoints.projectorName, projectorName)
            ))
            .limit(1);

        const cursor = Math.max(
            Number(checkpoint?.lastSequence ?? 0),
            Number(input.fromSequence ?? 0)
        );

        const rows = await tx
            .select({
                id: fnbDomainEvents.id,
                sequence: fnbDomainEvents.sequence,
                organizationId: fnbDomainEvents.organizationId,
                branchId: fnbDomainEvents.branchId,
                aggregateType: fnbDomainEvents.aggregateType,
                aggregateId: fnbDomainEvents.aggregateId,
                eventType: fnbDomainEvents.eventType,
                occurredAt: fnbDomainEvents.occurredAt,
                actorId: fnbDomainEvents.actorId,
                idempotencyKey: fnbDomainEvents.idempotencyKey,
                payload: fnbDomainEvents.payload,
            })
            .from(fnbDomainEvents)
            .where(and(
                eq(fnbDomainEvents.organizationId, input.organizationId),
                gt(fnbDomainEvents.sequence, cursor)
            ))
            .orderBy(asc(fnbDomainEvents.sequence))
            .limit(batchSize);

        let lastSequence = cursor;
        for (const row of rows) {
            const event = toDomainEventEnvelope(row);
            await projectDomainEvent(tx, event, projectorName);
            lastSequence = Number(event.sequence ?? lastSequence);
        }

        return {
            processedCount: rows.length,
            lastSequence,
            projectorName,
        };
    });
}

export async function runFnbProjectorUntilCaughtUp(
    db: any,
    input: {
        organizationId: string;
        projectorName?: string;
        batchSize?: number;
        maxBatches?: number;
    }
) {
    const maxBatches = Math.max(1, Math.min(input.maxBatches ?? 10, 200));
    let totalProcessed = 0;
    let lastSequence = 0;
    let batches = 0;

    for (let idx = 0; idx < maxBatches; idx += 1) {
        const batch = await runFnbProjectorBatch(db, input);
        batches += 1;
        totalProcessed += batch.processedCount;
        lastSequence = batch.lastSequence;
        if (batch.processedCount < Math.max(1, Math.min(input.batchSize ?? 100, 1000))) break;
    }

    return {
        projectorName: input.projectorName ?? "fnb-core-projector",
        totalProcessed,
        lastSequence,
        batches,
    };
}
