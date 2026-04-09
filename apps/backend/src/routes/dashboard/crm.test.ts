import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
}));

import { crmRouter } from "./crm";

const createCrmApp = (db: any) =>
    createTestApp(crmRouter, "/api/dashboard/crm", db);

describe("crm routes", () => {
    it("GET /customers returns paginated customers with tags", async () => {
        const db = createDbMock({
            selectResults: [
                [{ count: 2 }],
                [
                    {
                        customer: {
                            id: "cus-1",
                            organizationId: "org-1",
                            name: "Rina",
                            phone: "0812",
                            email: "rina@beres.io",
                            status: "active",
                            createdAt: new Date("2026-04-01T00:00:00.000Z"),
                        },
                        analytics: {
                            totalOrders: 5,
                            totalSpent: 250000,
                            lastOrderAt: new Date("2026-04-01T00:00:00.000Z"),
                        },
                    },
                    {
                        customer: {
                            id: "cus-2",
                            organizationId: "org-1",
                            name: "Dian",
                            phone: "0821",
                            email: null,
                            status: "vip",
                            createdAt: new Date("2026-04-01T00:00:00.000Z"),
                        },
                        analytics: null,
                    },
                ],
                [
                    {
                        customerId: "cus-1",
                        tag: {
                            id: "tag-1",
                            name: "VIP",
                            slug: "vip",
                            color: "#ff0000",
                        },
                    },
                ],
            ],
        });
        const app = createCrmApp(db);

        const res = await app.request("/api/dashboard/crm/customers?page=1&limit=25");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.meta).toMatchObject({
            total: 2,
            page: 1,
            limit: 25,
            totalPages: 1,
        });
        expect(body.data.data[0]).toMatchObject({
            id: "cus-1",
            name: "Rina",
        });
        expect(body.data.data[0].tags).toHaveLength(1);
    });

    it("POST /customers rejects invalid payload", async () => {
        const app = createCrmApp(createDbMock());

        const res = await app.request("/api/dashboard/crm/customers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ phone: "0812" }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
    });

    it("GET /analytics/overview returns aggregated metrics", async () => {
        const db = createDbMock({
            selectResults: [
                [{ count: 10 }],
                [{ count: 3 }],
                [
                    { status: "active", count: 7 },
                    { status: "vip", count: 2 },
                    { status: "inactive", count: 1 },
                ],
                [{ avg: 50000 }],
                [{ id: "cus-1", name: "Top Customer", totalSpent: 300000, totalOrders: 8 }],
            ],
        });
        const app = createCrmApp(db);

        const res = await app.request("/api/dashboard/crm/analytics/overview?period=30d");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            totalCustomers: 10,
            newCustomersThisMonth: 3,
            activeCustomers: 7,
            vipCustomers: 2,
            inactiveCustomers: 1,
            averageLifetimeValue: 50000,
        });
        expect(body.data.topCustomers[0]).toMatchObject({
            id: "cus-1",
            totalSpent: 300000,
            totalOrders: 8,
        });
    });

    it("DELETE /customers/:id returns 404 when customer not found", async () => {
        const db = createDbMock({
            deleteResults: [[]],
        });
        const app = createCrmApp(db);

        const res = await app.request("/api/dashboard/crm/customers/cus-missing", {
            method: "DELETE",
        });
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("NOT_FOUND");
    });
});
