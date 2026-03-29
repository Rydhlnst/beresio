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
    hasBranchAccess: vi.fn((branchIds: string[], branchId?: string | null) => Boolean(branchId && branchIds.includes(branchId))),
}));

vi.mock("../../lib/stock", () => ({
    adjustStockQuantity: vi.fn(async () => undefined),
    recordStockMovement: vi.fn(async () => undefined),
    resolveInventoryBySku: vi.fn(async () => new Map<string, string>()),
}));

vi.mock("../../lib/order-number", () => ({
    generateOrderNumber: vi.fn(async () => "ORD-001"),
}));

import { ordersRouter } from "./orders";

const createOrdersApp = (db: any) => createTestApp(ordersRouter, "/api/dashboard/orders", db);

describe("orders FnB routes", () => {
    it("PATCH /:id/hold updates hold state", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "ord-1",
                branchId: "br-1",
                tableId: null,
                serviceMode: "walk_in",
                status: "pending",
            }]],
            updateResults: [[{
                id: "ord-1",
                status: "pending",
                holdState: "held",
            }]],
            insertResults: [[]],
        });
        const app = createOrdersApp(db);

        const res = await app.request("/api/dashboard/orders/ord-1/hold", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ holdState: "held", note: "Customer break" }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.holdState).toBe("held");
    });

    it("POST /:id/split rejects mismatch total", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "ord-1",
                branchId: "br-1",
                status: "pending",
                totalAmount: 100000,
            }]],
        });
        const app = createOrdersApp(db);

        const res = await app.request("/api/dashboard/orders/ord-1/split", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                parts: [
                    { label: "Porsi A", amount: 40000 },
                    { label: "Porsi B", amount: 50000 },
                ],
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
    });

    it("POST /merge merges source orders into target", async () => {
        const db = createDbMock({
            selectResults: [
                [{
                    id: "ord-target",
                    branchId: "br-1",
                    status: "pending",
                    subtotalAmount: 100000,
                    discountAmount: 0,
                    taxAmount: 10000,
                    totalAmount: 110000,
                }],
                [{
                    id: "ord-source",
                    branchId: "br-1",
                    status: "pending",
                    subtotalAmount: 50000,
                    discountAmount: 0,
                    taxAmount: 5000,
                    totalAmount: 55000,
                }],
            ],
            updateResults: [
                [],
                [{
                    id: "ord-target",
                    status: "pending",
                    subtotalAmount: 150000,
                    discountAmount: 0,
                    taxAmount: 15000,
                    totalAmount: 165000,
                }],
                [],
            ],
            insertResults: [[]],
        });
        const app = createOrdersApp(db);

        const res = await app.request("/api/dashboard/orders/merge", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                targetOrderId: "ord-target",
                sourceOrderIds: ["ord-source"],
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.id).toBe("ord-target");
    });
});
