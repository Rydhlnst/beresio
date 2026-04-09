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

import { customersRouter } from "./customers";

const createCustomersApp = (db: any) =>
    createTestApp(customersRouter, "/api/dashboard/customers", db);

describe("customers routes", () => {
    it("GET / returns customer list", async () => {
        const db = createDbMock({
            selectResults: [[
                {
                    id: "cus-1",
                    name: "Ann",
                    phone: "0812",
                    email: "ann@beres.io",
                    address: "Jakarta",
                    loyaltyPoints: 100,
                    loyaltyTier: "regular",
                    totalSpentRp: 250000,
                    createdAt: new Date("2026-04-01T00:00:00.000Z"),
                },
            ]],
        });
        const app = createCustomersApp(db);

        const res = await app.request("/api/dashboard/customers?q=ann");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0]).toMatchObject({
            id: "cus-1",
            name: "Ann",
            phone: "0812",
        });
    });

    it("POST / rejects missing required fields", async () => {
        const app = createCustomersApp(createDbMock());

        const res = await app.request("/api/dashboard/customers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Only Name" }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
    });

    it("GET /:id returns 404 when customer not found", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });
        const app = createCustomersApp(db);

        const res = await app.request("/api/dashboard/customers/cus-missing");
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("NOT_FOUND");
    });

    it("phase 2.3: PATCH /:id rejects empty payload", async () => {
        const app = createCustomersApp(createDbMock({}));

        const res = await app.request("/api/dashboard/customers/cus-1", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.3: GET / hides internal error details", async () => {
        const app = createCustomersApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/customers");
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });
});
