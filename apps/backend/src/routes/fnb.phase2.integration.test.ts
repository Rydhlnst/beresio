import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createDbMock } from "./dashboard/test-utils";

vi.mock("../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../lib/permissions", () => ({
    requireOrganization: async (c: any, next: any) => {
        c.set("orgId", "org-1");
        await next();
    },
    requirePermission: () => async (_c: any, next: any) => {
        await next();
    },
    requireBranchAccess: () => async (c: any, next: any) => {
        c.set("branchScope", {
            isOrgWide: false,
            accessibleBranchIds: ["br-1"],
            requestedBranchIds: null,
            effectiveBranchIds: ["br-1"],
        });
        await next();
    },
    getBranchScope: (c: any) => c.get("branchScope"),
    ensureBranchAccessible: async () => null,
}));

vi.mock("../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
    getUserId: vi.fn(() => "user-1"),
}));

vi.mock("../lib/fnb-domain", () => ({
    appendDomainEvent: vi.fn(async (_tx: any, input: any) => ({
        eventId: `evt-${input.eventType}`,
        sequence: 1,
        organizationId: input.organizationId,
        branchId: input.branchId ?? null,
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        eventType: input.eventType,
        occurredAt: new Date(),
        actorId: input.actorId ?? null,
        idempotencyKey: input.idempotencyKey ?? null,
        payload: input.payload ?? {},
    })),
    projectDomainEvent: vi.fn(async () => undefined),
    canTransitionOrderStatus: vi.fn((from: string, to: string) => from === "pending" && to === "confirmed"),
    runFnbProjectorUntilCaughtUp: vi.fn(async () => ({
        projectorName: "fnb-core-projector",
        totalProcessed: 0,
        lastSequence: 0,
        batches: 0,
    })),
}));

const generateOrderNumberMock = vi.fn()
    .mockResolvedValueOnce("ORD-0001")
    .mockResolvedValueOnce("ORD-0002");

vi.mock("../lib/order-number", () => ({
    generateOrderNumber: (...args: any[]) => generateOrderNumberMock(...args),
}));

import { publicFnbRouter } from "./public/fnb";
import { fnbCommandRouter } from "./dashboard/fnb-commands";

function createIntegrationApp(db: any) {
    const app = new Hono<{ Variables: { db: any } }>();
    app.use("*", async (c, next) => {
        c.set("db", db);
        await next();
    });
    app.route("/api/public/fnb", publicFnbRouter);
    app.route("/api/dashboard/fnb", fnbCommandRouter);
    return app;
}

describe("phase 2 integration: qr session + multi-round + confirm idempotent", () => {
    it("supports multi-round in one session and retry-safe confirm", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "tbl-1", organizationId: "org-1", branchId: "br-1", isActive: true, status: "available" }],
                [],

                [{ id: "sess-1", organizationId: "org-1", branchId: "br-1", tableId: "tbl-1", guestCount: 2, status: "active" }],
                [{ id: "part-1" }],
                [{ id: "mv-1" }],
                [{ id: "mvi-1", productId: "prod-1", itemName: "Nasi Goreng", unitPrice: 25000, modifierSchema: [], station: "kitchen", prepTimeMinutes: 10 }],

                [{ id: "sess-1", organizationId: "org-1", branchId: "br-1", tableId: "tbl-1", guestCount: 2, status: "active" }],
                [{ id: "part-1" }],
                [{ id: "mv-1" }],
                [{ id: "mvi-1", productId: "prod-1", itemName: "Nasi Goreng", unitPrice: 25000, modifierSchema: [], station: "kitchen", prepTimeMinutes: 10 }],

                [],
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    status: "pending",
                    serviceMode: "dine_in",
                    tableId: "tbl-1",
                    sessionId: "sess-1",
                    totalAmount: 25000,
                    paymentStatus: "pending",
                }],
                [{
                    id: "ord-1",
                    orderNumber: "ORD-0001",
                    status: "confirmed",
                    paymentStatus: "pending",
                    serviceMode: "dine_in",
                    tableId: "tbl-1",
                    sessionId: "sess-1",
                    totalAmount: 25000,
                    updatedAt: new Date(),
                }],

                [{
                    responseStatus: 200,
                    responseBody: {
                        success: true,
                        data: {
                            id: "ord-1",
                            orderNumber: "ORD-0001",
                            status: "confirmed",
                        },
                    },
                }],
            ],
            insertResults: [
                [{ id: "sess-1", status: "active", holdState: "none" }],
                [],

                [{ id: "ord-1", orderNumber: "ORD-0001", status: "pending", totalAmount: 25000 }],
                [],
                [],

                [{ id: "ord-2", orderNumber: "ORD-0002", status: "pending", totalAmount: 50000 }],
                [],
                [],

                [],
                [],
            ],
            updateResults: [
                [],
            ],
        });

        const app = createIntegrationApp(db);

        const joinRes = await app.request("/api/public/fnb/tables/tbl-1/session/join", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ guestCount: 2 }),
        });
        const joinBody = await joinRes.json() as any;

        expect(joinRes.status).toBe(200);
        expect(joinBody.success).toBe(true);
        expect(joinBody.data.sessionId).toBe("sess-1");

        const rawSetCookie = joinRes.headers.get("set-cookie") ?? "";
        const sessionCookie = rawSetCookie.split(";")[0];
        expect(sessionCookie.startsWith("beres_fnb_device=")).toBe(true);

        const round1Res = await app.request("/api/public/fnb/orders", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                cookie: sessionCookie,
            },
            body: JSON.stringify({
                sessionId: "sess-1",
                items: [{ menuVersionItemId: "mvi-1", quantity: 1 }],
            }),
        });
        const round1Body = await round1Res.json() as any;

        expect(round1Res.status).toBe(200);
        expect(round1Body.success).toBe(true);
        expect(round1Body.data.orderId).toBe("ord-1");

        const round2Res = await app.request("/api/public/fnb/orders", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                cookie: sessionCookie,
            },
            body: JSON.stringify({
                sessionId: "sess-1",
                items: [{ menuVersionItemId: "mvi-1", quantity: 2 }],
            }),
        });
        const round2Body = await round2Res.json() as any;

        expect(round2Res.status).toBe(200);
        expect(round2Body.success).toBe(true);
        expect(round2Body.data.orderId).toBe("ord-2");

        const confirmRes = await app.request("/api/dashboard/fnb/orders/ord-1/confirm", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "Idempotency-Key": "idem-confirm-1",
            },
        });
        const confirmBody = await confirmRes.json() as any;

        expect(confirmRes.status).toBe(200);
        expect(confirmBody.success).toBe(true);
        expect(confirmBody.data.status).toBe("confirmed");

        const confirmRetryRes = await app.request("/api/dashboard/fnb/orders/ord-1/confirm", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "Idempotency-Key": "idem-confirm-1",
            },
        });
        const confirmRetryBody = await confirmRetryRes.json() as any;

        expect(confirmRetryRes.status).toBe(200);
        expect(confirmRetryBody.success).toBe(true);
        expect(confirmRetryBody.data.orderNumber).toBe("ORD-0001");
    });
});
