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
    getOrgId: vi.fn(async () => "org-1"),
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

import { ordersRouter } from "./orders";

const createOrdersApp = (db: any) => createTestApp(ordersRouter, "/api/dashboard/orders", db);

describe("orders FnB routes", () => {
    it("POST / rejects dine_in without tableId", async () => {
        const app = createOrdersApp(createDbMock());
        const res = await app.request("/api/dashboard/orders", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                serviceMode: "dine_in",
                items: [{ name: "Nasi Goreng", quantity: 1, unitPrice: 25000 }],
            }),
        });

        expect(res.status).toBe(400);
    });

    it("PATCH /:id blocks updates outside branch access", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "ord-1",
                branchId: "br-2",
                status: "pending",
                type: "walk_in",
                paymentStatus: "pending",
                serviceMode: "walk_in",
                tableId: null,
                guestCount: 1,
                holdState: "none",
            }]],
        });
        const app = createOrdersApp(db);

        const res = await app.request("/api/dashboard/orders/ord-1", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ notes: "update note" }),
        });

        expect(res.status).toBe(403);
    });

    it("PATCH /:id/hold updates hold state", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "ord-1",
                branchId: "br-1",
                status: "pending",
                serviceMode: "walk_in",
                tableId: null,
            }]],
            updateResults: [[{
                id: "ord-1",
                branchId: "br-1",
                status: "pending",
                serviceMode: "walk_in",
                tableId: null,
                holdState: "held",
                guestCount: 1,
            }]],
            insertResults: [[]],
        });
        const app = createOrdersApp(db);

        const res = await app.request("/api/dashboard/orders/ord-1/hold", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ action: "hold" }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.holdState).toBe("held");
    });

    it("POST /:id/split validates parts", async () => {
        const app = createOrdersApp(createDbMock());

        const res = await app.request("/api/dashboard/orders/ord-1/split", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ parts: [] }),
        });

        expect(res.status).toBe(400);
    });

    it("POST /:id/split creates bill parts", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-1",
                    branchId: "br-1",
                    totalAmount: 50000,
                    paymentStatus: "pending",
                    status: "pending",
                }],
                [],
            ],
            insertResults: [[{
                id: "part-1",
                amount: 25000,
                paymentStatus: "pending",
            }], []],
        });
        const app = createOrdersApp(db);

        const res = await app.request("/api/dashboard/orders/ord-1/split", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                parts: [{ label: "Guest 1", amount: 25000, paymentStatus: "pending" }],
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.allocatedAmount).toBe(25000);
        expect(body.data.remainingAmount).toBe(25000);
    });

    it("POST /merge rejects target included in source list", async () => {
        const app = createOrdersApp(createDbMock());

        const res = await app.request("/api/dashboard/orders/merge", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                targetOrderId: "ord-1",
                sourceOrderIds: ["ord-1", "ord-2"],
            }),
        });

        expect(res.status).toBe(400);
    });
});
