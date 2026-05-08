import { Hono } from "hono";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
    fnbMenuVersionItems,
    fnbMenuVersions,
    fnbSessionParticipants,
    fnbTableSessions,
    fnbTables,
    orderEvents,
    orderItems,
    orders,
    products,
} from "@beresio/db";
import { errors, ok } from "../../lib/errors";
import { appendDomainEvent, projectDomainEvent } from "../../lib/fnb-domain";
import { generateOrderNumber } from "../../lib/order-number";

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string };
type Variables = { db: any; user: any; session: any };

const COOKIE_DEVICE_KEY = "beres_fnb_device";
const ACTIVE_SESSION_STATUS = ["active", "held"] as const;

const joinSessionSchema = z.object({
    guestCount: z.coerce.number().int().min(1).optional().default(1),
});

const createPublicOrderSchema = z.object({
    sessionId: z.string().trim().min(1),
    notes: z.string().nullable().optional(),
    items: z.array(z.object({
        menuVersionItemId: z.string().trim().min(1).nullable().optional(),
        productId: z.string().trim().min(1).nullable().optional(),
        quantity: z.coerce.number().int().min(1),
        notes: z.string().nullable().optional(),
    })).min(1),
});

function parseCookies(rawCookieHeader: string | null | undefined) {
    const values = new Map<string, string>();
    if (!rawCookieHeader) return values;
    const chunks = rawCookieHeader.split(";");
    for (const chunk of chunks) {
        const idx = chunk.indexOf("=");
        if (idx <= 0) continue;
        const key = chunk.slice(0, idx).trim();
        const value = chunk.slice(idx + 1).trim();
        if (!key) continue;
        values.set(key, decodeURIComponent(value));
    }
    return values;
}

function buildDeviceCookie(deviceId: string) {
    return `${COOKIE_DEVICE_KEY}=${encodeURIComponent(deviceId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export const publicFnbRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

publicFnbRouter.post("/tables/:tableId/session/join", async (c) => {
    try {
        const db = c.get("db");
        const tableId = c.req.param("tableId");
        const payload = await c.req.json().catch(() => ({}));
        const parsedPayload = joinSessionSchema.safeParse(payload);
        if (!parsedPayload.success) {
            return errors.badRequest(c, parsedPayload.error.issues[0]?.message ?? "Invalid payload");
        }

        const [tableRow] = await db
            .select({
                id: fnbTables.id,
                organizationId: fnbTables.organizationId,
                branchId: fnbTables.branchId,
                isActive: fnbTables.isActive,
                status: fnbTables.status,
            })
            .from(fnbTables)
            .where(eq(fnbTables.id, tableId))
            .limit(1);

        if (!tableRow || !tableRow.isActive) {
            return errors.notFound(c, "Table not found");
        }

        const cookies = parseCookies(c.req.header("cookie"));
        const existingDeviceId = cookies.get(COOKIE_DEVICE_KEY);
        const deviceId = existingDeviceId ?? crypto.randomUUID();

        const result = await db.transaction(async (tx: any) => {
            let [session] = await tx
                .select({
                    id: fnbTableSessions.id,
                    status: fnbTableSessions.status,
                    holdState: fnbTableSessions.holdState,
                })
                .from(fnbTableSessions)
                .where(and(
                    eq(fnbTableSessions.organizationId, tableRow.organizationId),
                    eq(fnbTableSessions.tableId, tableId),
                    inArray(fnbTableSessions.status, ACTIVE_SESSION_STATUS as any)
                ))
                .orderBy(desc(fnbTableSessions.openedAt))
                .limit(1);

            if (!session) {
                const [created] = await tx
                    .insert(fnbTableSessions)
                    .values({
                        organizationId: tableRow.organizationId,
                        branchId: tableRow.branchId,
                        tableId,
                        source: "self_order",
                        status: "active",
                        holdState: "none",
                        guestCount: parsedPayload.data.guestCount,
                    })
                    .returning({
                        id: fnbTableSessions.id,
                        status: fnbTableSessions.status,
                        holdState: fnbTableSessions.holdState,
                    });
                session = created;

                const openedEvent = await appendDomainEvent(tx, {
                    organizationId: tableRow.organizationId,
                    branchId: tableRow.branchId,
                    aggregateType: "table_session",
                    aggregateId: session.id,
                    eventType: "TABLE_SESSION_OPENED",
                    payload: {
                        tableId,
                        tableSessionId: session.id,
                        source: "qr",
                    },
                });
                await projectDomainEvent(tx, openedEvent);
            }

            await tx
                .insert(fnbSessionParticipants)
                .values({
                    organizationId: tableRow.organizationId,
                    branchId: tableRow.branchId,
                    tableSessionId: session.id,
                    deviceId,
                    source: "qr",
                })
                .onConflictDoUpdate({
                    target: [
                        fnbSessionParticipants.organizationId,
                        fnbSessionParticipants.tableSessionId,
                        fnbSessionParticipants.deviceId,
                    ],
                    set: {
                        lastSeenAt: new Date(),
                    },
                });

            await tx
                .update(fnbTables)
                .set({ status: "ordering" })
                .where(and(
                    eq(fnbTables.organizationId, tableRow.organizationId),
                    eq(fnbTables.id, tableId)
                ));

            return {
                sessionId: session.id,
                sessionStatus: session.status,
            };
        });

        if (!existingDeviceId) {
            c.header("Set-Cookie", buildDeviceCookie(deviceId));
        }

        return ok(c, {
            tableId,
            organizationId: tableRow.organizationId,
            branchId: tableRow.branchId,
            ...result,
            deviceId,
        });
    } catch (err) {
        console.error("[public/fnb/session/join]", err);
        return errors.internal(c);
    }
});

publicFnbRouter.get("/menu", async (c) => {
    try {
        const db = c.get("db");
        const tableId = c.req.query("tableId");
        const branchIdQuery = c.req.query("branchId");
        if (!tableId && !branchIdQuery) {
            return errors.badRequest(c, "branchId or tableId is required");
        }

        let orgId: string | null = null;
        let branchId: string | null = null;

        if (tableId) {
            const [tableRow] = await db
                .select({
                    organizationId: fnbTables.organizationId,
                    branchId: fnbTables.branchId,
                    isActive: fnbTables.isActive,
                })
                .from(fnbTables)
                .where(eq(fnbTables.id, tableId))
                .limit(1);
            if (!tableRow || !tableRow.isActive) return errors.notFound(c, "Table not found");
            orgId = tableRow.organizationId;
            branchId = tableRow.branchId;
        }

        if (!branchId && branchIdQuery) {
            const [tableRow] = await db
                .select({
                    organizationId: fnbTables.organizationId,
                    branchId: fnbTables.branchId,
                })
                .from(fnbTables)
                .where(eq(fnbTables.branchId, branchIdQuery))
                .limit(1);
            if (!tableRow) return errors.notFound(c, "Branch menu not found");
            orgId = tableRow.organizationId;
            branchId = tableRow.branchId;
        }

        if (!orgId || !branchId) return errors.notFound(c, "Menu context not found");

        const [activeMenuVersion] = await db
            .select({
                id: fnbMenuVersions.id,
                name: fnbMenuVersions.name,
                status: fnbMenuVersions.status,
            })
            .from(fnbMenuVersions)
            .where(and(
                eq(fnbMenuVersions.organizationId, orgId),
                eq(fnbMenuVersions.branchId, branchId),
                eq(fnbMenuVersions.status, "active")
            ))
            .orderBy(desc(fnbMenuVersions.activatedAt), desc(fnbMenuVersions.createdAt))
            .limit(1);

        if (activeMenuVersion) {
            const items = await db
                .select({
                    id: fnbMenuVersionItems.id,
                    productId: fnbMenuVersionItems.productId,
                    name: fnbMenuVersionItems.itemName,
                    price: fnbMenuVersionItems.unitPrice,
                    modifierSchema: fnbMenuVersionItems.modifierSchema,
                    station: fnbMenuVersionItems.station,
                    prepTimeMinutes: fnbMenuVersionItems.prepTimeMinutes,
                    sortOrder: fnbMenuVersionItems.sortOrder,
                })
                .from(fnbMenuVersionItems)
                .where(and(
                    eq(fnbMenuVersionItems.menuVersionId, activeMenuVersion.id),
                    eq(fnbMenuVersionItems.isActive, true)
                ))
                .orderBy(asc(fnbMenuVersionItems.sortOrder), asc(fnbMenuVersionItems.itemName));

            return ok(c, {
                menuVersionId: activeMenuVersion.id,
                menuVersionName: activeMenuVersion.name,
                branchId,
                items,
            });
        }

        const fallbackItems = await db
            .select({
                id: products.id,
                productId: products.id,
                name: products.name,
                price: products.salePrice,
                modifierSchema: products.modifierGroups,
                station: products.station,
                prepTimeMinutes: products.prepTimeMinutes,
            })
            .from(products)
            .where(and(
                eq(products.organizationId, orgId),
                eq(products.isActive, true),
                eq(products.isAvailableDineIn, true)
            ))
            .orderBy(asc(products.name));

        return ok(c, {
            menuVersionId: null,
            menuVersionName: "fallback-products",
            branchId,
            items: fallbackItems,
        });
    } catch (err) {
        console.error("[public/fnb/menu]", err);
        return errors.internal(c);
    }
});

publicFnbRouter.post("/orders", async (c) => {
    try {
        const db = c.get("db");
        const payload = await c.req.json().catch(() => null);
        const parsed = createPublicOrderSchema.safeParse(payload);
        if (!parsed.success) return errors.badRequest(c, parsed.error.issues[0]?.message ?? "Invalid payload");

        const cookies = parseCookies(c.req.header("cookie"));
        const deviceId = cookies.get(COOKIE_DEVICE_KEY);
        if (!deviceId) {
            return errors.badRequest(c, "Device session is required. Join table session first.");
        }

        const result = await db.transaction(async (tx: any) => {
            const [sessionRow] = await tx
                .select({
                    id: fnbTableSessions.id,
                    organizationId: fnbTableSessions.organizationId,
                    branchId: fnbTableSessions.branchId,
                    tableId: fnbTableSessions.tableId,
                    guestCount: fnbTableSessions.guestCount,
                    status: fnbTableSessions.status,
                })
                .from(fnbTableSessions)
                .where(and(
                    eq(fnbTableSessions.id, parsed.data.sessionId),
                    inArray(fnbTableSessions.status, ACTIVE_SESSION_STATUS as any)
                ))
                .limit(1);
            if (!sessionRow) return { error: errors.badRequest(c, "Active table session not found") };

            const [participant] = await tx
                .select({ id: fnbSessionParticipants.id })
                .from(fnbSessionParticipants)
                .where(and(
                    eq(fnbSessionParticipants.organizationId, sessionRow.organizationId),
                    eq(fnbSessionParticipants.tableSessionId, sessionRow.id),
                    eq(fnbSessionParticipants.deviceId, deviceId)
                ))
                .limit(1);
            if (!participant) {
                return { error: errors.forbidden(c, "Device is not part of this table session") };
            }

            const [activeMenuVersion] = await tx
                .select({ id: fnbMenuVersions.id })
                .from(fnbMenuVersions)
                .where(and(
                    eq(fnbMenuVersions.organizationId, sessionRow.organizationId),
                    eq(fnbMenuVersions.branchId, sessionRow.branchId),
                    eq(fnbMenuVersions.status, "active")
                ))
                .orderBy(desc(fnbMenuVersions.activatedAt), desc(fnbMenuVersions.createdAt))
                .limit(1);
            if (!activeMenuVersion) {
                return { error: errors.badRequest(c, "No active menu version for this branch") };
            }

            const menuItems = await tx
                .select({
                    id: fnbMenuVersionItems.id,
                    productId: fnbMenuVersionItems.productId,
                    itemName: fnbMenuVersionItems.itemName,
                    unitPrice: fnbMenuVersionItems.unitPrice,
                    modifierSchema: fnbMenuVersionItems.modifierSchema,
                    station: fnbMenuVersionItems.station,
                    prepTimeMinutes: fnbMenuVersionItems.prepTimeMinutes,
                })
                .from(fnbMenuVersionItems)
                .where(and(
                    eq(fnbMenuVersionItems.menuVersionId, activeMenuVersion.id),
                    eq(fnbMenuVersionItems.isActive, true)
                ));
            const menuById = new Map<string, any>(menuItems.map((item: any) => [item.id, item]));
            const menuByProductId = new Map<string, any>(
                menuItems.filter((item: any) => item.productId).map((item: any) => [item.productId, item])
            );

            const normalizedItems = parsed.data.items.map((item) => {
                const snapshot = item.menuVersionItemId
                    ? menuById.get(item.menuVersionItemId)
                    : (item.productId ? menuByProductId.get(item.productId) : null);
                if (!snapshot) return null;
                return {
                    menuVersionItemId: snapshot.id,
                    productId: snapshot.productId ?? null,
                    name: snapshot.itemName,
                    unitPrice: Number(snapshot.unitPrice ?? 0),
                    modifierSchema: snapshot.modifierSchema ?? [],
                    station: snapshot.station ?? "kitchen",
                    prepTimeMinutes: Number(snapshot.prepTimeMinutes ?? 0),
                    quantity: item.quantity,
                    notes: item.notes ?? null,
                };
            });
            if (normalizedItems.some((item) => !item)) {
                return { error: errors.badRequest(c, "Invalid menu item selected") };
            }

            const subtotalAmount = normalizedItems.reduce((sum: number, item: any) => (
                sum + item.quantity * item.unitPrice
            ), 0);
            const orderNumber = await generateOrderNumber(tx, sessionRow.organizationId);

            const [createdOrder] = await tx
                .insert(orders)
                .values({
                    organizationId: sessionRow.organizationId,
                    branchId: sessionRow.branchId,
                    orderNumber,
                    status: "pending",
                    type: "walk_in",
                    subtotalAmount,
                    discountAmount: 0,
                    taxAmount: 0,
                    totalAmount: subtotalAmount,
                    paymentStatus: "pending",
                    paymentMethod: null,
                    notes: parsed.data.notes ?? null,
                    source: "self_order",
                    serviceMode: "dine_in",
                    tableId: sessionRow.tableId,
                    sessionId: sessionRow.id,
                    guestCount: Number(sessionRow.guestCount ?? 1),
                    holdState: "none",
                })
                .returning();

            await tx
                .insert(orderItems)
                .values(normalizedItems.map((item: any) => ({
                    orderId: createdOrder.id,
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                    modifiers: [],
                    notes: item.notes,
                    station: item.station,
                    status: "pending",
                    menuVersionId: activeMenuVersion.id,
                    menuVersionItemId: item.menuVersionItemId,
                    snapshotModifierSchema: item.modifierSchema,
                    snapshotStation: item.station,
                    snapshotPrepTimeMinutes: item.prepTimeMinutes,
                })));

            await tx.insert(orderEvents).values({
                organizationId: sessionRow.organizationId,
                orderId: createdOrder.id,
                status: "pending",
                note: "Self-order created",
                actorId: null,
            });

            const event = await appendDomainEvent(tx, {
                organizationId: sessionRow.organizationId,
                branchId: sessionRow.branchId,
                aggregateType: "order",
                aggregateId: createdOrder.id,
                eventType: "ORDER_CREATED",
                payload: {
                    orderId: createdOrder.id,
                    orderNumber: createdOrder.orderNumber,
                    source: "self_order",
                    tableId: sessionRow.tableId,
                    sessionId: sessionRow.id,
                },
            });
            await projectDomainEvent(tx, event);

            return {
                orderId: createdOrder.id,
                orderNumber: createdOrder.orderNumber,
                status: createdOrder.status,
                totalAmount: Number(createdOrder.totalAmount ?? 0),
            };
        });

        if ((result as any)?.error) return (result as any).error;
        return ok(c, result);
    } catch (err) {
        console.error("[public/fnb/orders]", err);
        return errors.internal(c);
    }
});
