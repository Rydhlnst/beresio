import { describe, expect, it, vi } from "vitest";
import { createTestApp } from "./test-utils";

const { getOrgIdMock } = vi.hoisted(() => ({
    getOrgIdMock: vi.fn(async () => "org-1"),
}));

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: getOrgIdMock,
    getUserId: vi.fn(() => "user-1"),
}));

vi.mock("../../lib/branch-access", () => ({
    getAccessibleBranchIds: vi.fn(async () => ["br-1"]),
    getBranchAccessContext: vi.fn(async () => ({ branchIds: ["br-1"], isOrgWide: false })),
    hasBranchAccess: vi.fn((branchIds: string[], branchId?: string | null) => !!branchId && branchIds.includes(branchId)),
}));

vi.mock("../../lib/order-number", () => ({
    generateOrderNumber: vi.fn(async () => "ORD-0001"),
}));

vi.mock("../../lib/stock", () => ({
    adjustStockQuantity: vi.fn(async () => undefined),
    recordStockMovement: vi.fn(async () => undefined),
    resolveInventoryBySku: vi.fn(async () => new Map()),
}));

vi.mock("../../lib/fnb-domain", () => ({
    appendDomainEvent: vi.fn(async () => undefined),
    canTransitionOrderStatus: vi.fn(() => true),
    projectDomainEvent: vi.fn(() => null),
}));

import { ordersRouter } from "./orders";

function createOrdersContractApp(db: any) {
    return createTestApp(ordersRouter, "/api/dashboard/orders", db);
}

function createDbForCreate(capture: { insertedOrder?: any }) {
    let insertCall = 0;
    return {
        select: () => ({
            from: () => ({
                where: () => ({
                    limit: async () => [{ id: "br-1" }],
                }),
            }),
        }),
        transaction: async (fn: (tx: any) => Promise<unknown>) => fn({
            select: () => ({
                from: () => ({
                    where: () => ({
                        orderBy: () => ({
                            limit: async () => [],
                        }),
                        limit: async () => [],
                    }),
                }),
            }),
            insert: () => ({
                values: (payload: any) => ({
                    returning: async () => {
                        insertCall += 1;
                        if (insertCall === 1) {
                            capture.insertedOrder = payload;
                            return [{
                                ...payload,
                                id: "ord-1",
                                orderNumber: "ORD-0001",
                                createdAt: new Date(),
                            }];
                        }
                        return [];
                    },
                }),
            }),
            update: () => ({
                set: () => ({
                    where: () => ({
                        returning: async () => [],
                    }),
                }),
            }),
            delete: () => ({
                where: async () => [],
            }),
        }),
    };
}

function createDbForPatch(capture: { updatedOrder?: any }) {
    return {
        select: () => ({
            from: () => ({
                where: () => ({
                    limit: async () => [{
                        id: "ord-1",
                        branchId: "br-1",
                        status: "processing",
                        type: "walk_in",
                        paymentStatus: "pending",
                        source: "pos",
                        serviceMode: "walk_in",
                        tableId: null,
                        sessionId: null,
                        guestCount: 1,
                        holdState: "none",
                    }],
                }),
            }),
        }),
        transaction: async (fn: (tx: any) => Promise<unknown>) => fn({
            select: () => ({
                from: () => ({
                    where: () => [],
                }),
            }),
            insert: () => ({
                values: async () => [],
            }),
            update: () => ({
                set: (payload: any) => {
                    capture.updatedOrder = payload;
                    return {
                        where: () => ({
                            returning: async () => [{
                                id: "ord-1",
                                branchId: "br-1",
                                status: payload.status ?? "processing",
                                type: payload.type ?? "walk_in",
                                paymentStatus: payload.paymentStatus ?? "pending",
                                source: payload.source ?? "pos",
                                serviceMode: payload.serviceMode ?? "walk_in",
                                tableId: payload.tableId ?? null,
                                sessionId: payload.sessionId ?? null,
                                guestCount: payload.guestCount ?? 1,
                                holdState: payload.holdState ?? "none",
                            }],
                        }),
                    };
                },
            }),
            delete: () => ({
                where: async () => [],
            }),
        }),
    };
}

describe("orders contract compatibility", () => {
    it("POST / normalizes legacy status/type to canonical values", async () => {
        getOrgIdMock.mockResolvedValueOnce("org-1");
        const capture: { insertedOrder?: any } = {};
        const app = createOrdersContractApp(createDbForCreate(capture));

        const res = await app.request("/api/dashboard/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                type: "pickup_delivery",
                status: "done",
                items: [{ name: "Detergent", quantity: 1, unitPrice: 10000 }],
            }),
        });

        expect(res.status).toBe(200);
        expect(capture.insertedOrder.status).toBe("processing");
        expect(capture.insertedOrder.type).toBe("pickup");
    });

    it("PATCH /:id normalizes legacy status/type to canonical values", async () => {
        getOrgIdMock.mockResolvedValueOnce("org-1");
        const capture: { updatedOrder?: any } = {};
        const app = createOrdersContractApp(createDbForPatch(capture));

        const res = await app.request("/api/dashboard/orders/ord-1", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                "x-branch-id": "br-1",
            },
            body: JSON.stringify({
                status: "done",
                type: "walkin",
            }),
        });

        expect(res.status).toBe(200);
        expect(capture.updatedOrder.status).toBe("processing");
        expect(capture.updatedOrder.type).toBe("walk_in");
    });

    it("returns 401 when organization context is missing", async () => {
        getOrgIdMock.mockRejectedValueOnce(new Error("NO_ORG_CONTEXT"));
        const app = createOrdersContractApp(createDbForCreate({}));

        const res = await app.request("/api/dashboard/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                items: [{ name: "Detergent", quantity: 1, unitPrice: 10000 }],
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 for invalid create payload", async () => {
        getOrgIdMock.mockResolvedValueOnce("org-1");
        const app = createOrdersContractApp(createDbForCreate({}));

        const res = await app.request("/api/dashboard/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "",
                items: [{ name: "", quantity: 0, unitPrice: -1 }],
            }),
        });

        expect(res.status).toBe(400);
    });

    it("returns 400 for invalid update payload", async () => {
        getOrgIdMock.mockResolvedValueOnce("org-1");
        const app = createOrdersContractApp(createDbForPatch({}));

        const res = await app.request("/api/dashboard/orders/ord-1", {
            method: "PATCH",
            headers: {
                "content-type": "application/json",
                "x-branch-id": "br-1",
            },
            body: JSON.stringify({
                guestCount: 0,
            }),
        });

        expect(res.status).toBe(400);
    });
});
