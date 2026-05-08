import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (_c: any, next: any) => {
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
}));

import { billingRouter } from "./billing";

const createBillingApp = (db: any) =>
    createTestApp(billingRouter, "/api/dashboard/billing", db);

describe("billing routes", () => {
    it("GET /status returns plan, usage, and recent payments", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "org-1", name: "Beresio", subscriptionPlan: "growth" }],
                [{ total: 2 }],
                [{ total: 8 }],
                [{
                    id: "pay-1",
                    amount: "120000",
                    status: "SUCCESS",
                    reference: "INV-001",
                    createdAt: new Date("2026-04-01T00:00:00.000Z"),
                }],
            ],
        });
        const app = createBillingApp(db);

        const res = await app.request("/api/dashboard/billing/status");
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.plan).toBe("growth");
        expect(body.data.usage.branches).toMatchObject({ current: 2, limit: 5 });
        expect(body.data.usage.members).toMatchObject({ current: 8, limit: 15 });
        expect(body.data.recentPayments[0]).toMatchObject({
            id: "pay-1",
            amount: 120000,
            status: "SUCCESS",
        });
    });

    it("POST /upgrade rejects invalid plan", async () => {
        const app = createBillingApp(createDbMock());

        const res = await app.request("/api/dashboard/billing/upgrade", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ plan: "gold" }),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.4: POST /upgrade rejects empty payload", async () => {
        const app = createBillingApp(createDbMock());

        const res = await app.request("/api/dashboard/billing/upgrade", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.4: GET /status hides internal error details", async () => {
        const app = createBillingApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/billing/status");
        const body = (await res.json()) as any;

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });
});

