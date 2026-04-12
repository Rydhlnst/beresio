import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async (c: any) => c.get("orgId") ?? "org-1"),
    getUserId: vi.fn(() => "user-1"),
}));

vi.mock("../../lib/permissions", () => ({
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
}));

vi.mock("../../lib/branch-access", () => ({
    getBranchAccessContext: vi.fn(async () => ({ branchIds: ["br-1"], isOrgWide: false })),
    hasBranchAccess: vi.fn((branchIds: string[], branchId?: string | null) => !!branchId && branchIds.includes(branchId)),
}));

vi.mock("../../lib/fnb-domain", () => ({
    appendDomainEvent: vi.fn(async () => ({
        eventId: "evt-1",
        sequence: 1,
        organizationId: "org-1",
        branchId: "br-1",
        aggregateType: "order",
        aggregateId: "ord-1",
        eventType: "ORDER_CONFIRMED",
        occurredAt: new Date(),
        actorId: "user-1",
        idempotencyKey: "idem-1",
        payload: {},
    })),
    projectDomainEvent: vi.fn(async () => undefined),
    canTransitionOrderStatus: vi.fn((from: string, to: string) => from === "pending" && to === "confirmed"),
    runFnbProjectorUntilCaughtUp: vi.fn(async () => ({
        projectorName: "fnb-core-projector",
        totalProcessed: 2,
        lastSequence: 10,
        batches: 1,
    })),
}));

import { fnbCommandRouter } from "./fnb-commands";

const createApp = (db: any) => createTestApp(fnbCommandRouter, "/api/dashboard/fnb", db);

describe("fnb command routes", () => {
    it("POST /orders/:id/confirm requires Idempotency-Key", async () => {
        const app = createApp(createDbMock());
        const res = await app.request("/api/dashboard/fnb/orders/ord-1/confirm", {
            method: "POST",
            headers: { "content-type": "application/json" },
        });

        expect(res.status).toBe(400);
    });

    it("POST /orders/:id/confirm succeeds with idempotency key", async () => {
        const db = createDbMock({
            selectResults: [
                [], // fnb_command_idempotency check
                [{ // order for command
                    id: "ord-1",
                    branchId: "br-1",
                    status: "pending",
                    serviceMode: "dine_in",
                    tableId: "tbl-1",
                    sessionId: "sess-1",
                    totalAmount: 10000,
                    paymentStatus: "pending",
                }],
                [{ // updated order projection
                    id: "ord-1",
                    orderNumber: "ORD-0001",
                    status: "confirmed",
                    paymentStatus: "pending",
                    serviceMode: "dine_in",
                    tableId: "tbl-1",
                    sessionId: "sess-1",
                    totalAmount: 10000,
                    updatedAt: new Date(),
                }],
            ],
            insertResults: [
                [], // order_events insert
                [], // idempotency insert
            ],
        });
        const app = createApp(db);

        const res = await app.request("/api/dashboard/fnb/orders/ord-1/confirm", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "Idempotency-Key": "idem-1",
            },
        });
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe("confirmed");
    });

    it("POST /projectors/replay runs projector catch-up", async () => {
        const app = createApp(createDbMock());

        const res = await app.request("/api/dashboard/fnb/projectors/replay", {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                batchSize: 50,
                maxBatches: 2,
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.totalProcessed).toBe(2);
    });

    it("GET /ws/orders requires websocket upgrade header", async () => {
        const app = createApp(createDbMock());

        const res = await app.request("/api/dashboard/fnb/ws/orders");
        const body = await res.json() as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });
});
