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

import { suppliersRouter } from "./suppliers";

const createSuppliersApp = (db: any) =>
    createTestApp(suppliersRouter, "/api/dashboard/suppliers", db);

describe("suppliers routes", () => {
    it("GET / returns suppliers with metadata", async () => {
        const db = createDbMock({
            selectResults: [
                [{ count: 1 }],
                [{
                    id: "sup-1",
                    name: "PT Supplier A",
                    code: "SUP-A",
                    contactName: "Rina",
                    email: "rina@supplier.com",
                    phone: "0812",
                    address: "Jakarta",
                    city: "Jakarta",
                    province: null,
                    postalCode: null,
                    bankName: null,
                    bankAccountNumber: null,
                    bankAccountName: null,
                    notes: null,
                    isActive: true,
                    createdAt: new Date("2026-04-01T00:00:00.000Z"),
                    updatedAt: new Date("2026-04-01T00:00:00.000Z"),
                }],
                [{ supplierId: "sup-1", count: 3 }],
            ],
        });
        const app = createSuppliersApp(db);

        const res = await app.request("/api/dashboard/suppliers?page=1&limit=20");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.meta).toMatchObject({ total: 1, page: 1, limit: 20 });
        expect(body.data.data[0]).toMatchObject({
            id: "sup-1",
            name: "PT Supplier A",
            productCount: 3,
        });
    });

    it("POST / rejects missing supplier name", async () => {
        const app = createSuppliersApp(createDbMock());

        const res = await app.request("/api/dashboard/suppliers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code: "SUP-X" }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.6: PATCH /:id rejects empty update payload", async () => {
        const app = createSuppliersApp(createDbMock());

        const res = await app.request("/api/dashboard/suppliers/sup-1", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.6: GET / hides internal error details", async () => {
        const app = createSuppliersApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/suppliers");
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });
});
