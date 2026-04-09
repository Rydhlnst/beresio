import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (_c: any, next: any) => {
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
    getUserId: vi.fn(() => "user-1"),
}));

vi.mock("../../lib/branch-access", () => ({
    getBranchAccessContext: vi.fn(async () => ({ branchIds: ["br-1"], isOrgWide: false })),
    getAccessibleBranchIds: vi.fn(async () => ["br-1"]),
    hasBranchAccess: vi.fn((branchIds: string[], branchId?: string | null) => !!branchId && branchIds.includes(branchId)),
}));

import { transactionsRouter } from "./transactions";

const createTransactionsApp = (db: any) =>
    createTestApp(transactionsRouter, "/api/dashboard/transactions", db);

describe("transactions routes", () => {
    it("GET / returns transaction list", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "trx-1",
                amount: "250000",
                discountAmount: "10000",
                taxAmount: "25000",
                status: "paid",
                type: "sale",
                paymentMethod: "cash",
                createdAt: new Date("2026-04-01T00:00:00.000Z"),
                branchId: "br-1",
                branchName: "Main Branch",
                customerId: "cus-1",
                customerName: "Rina",
            }]],
        });
        const app = createTransactionsApp(db);

        const res = await app.request("/api/dashboard/transactions");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).toMatchObject({
            id: "trx-1",
            amount: 250000,
            status: "paid",
            type: "sale",
        });
    });

    it("POST / rejects invalid status", async () => {
        const app = createTransactionsApp(createDbMock());

        const res = await app.request("/api/dashboard/transactions", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                status: "unknown",
                items: [{ productId: "prod-1", quantity: 1, unitPrice: 10000 }],
            }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.1: POST / rejects invalid item quantity", async () => {
        const app = createTransactionsApp(createDbMock());

        const res = await app.request("/api/dashboard/transactions", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                status: "paid",
                type: "sale",
                items: [{ productId: "prod-1", quantity: 0, unitPrice: 10000 }],
            }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.1: GET / hides internal error details", async () => {
        const app = createTransactionsApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/transactions");
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });
});
