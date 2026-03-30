import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp, readJson } from "./test-utils";

// Mock auth middleware
vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
}));

import { alertsRouter } from "./alerts";
const createAlertsApp = (db: any) =>
    createTestApp(alertsRouter, "/api/dashboard/alerts", db);

describe("alerts routes", () => {
    describe("GET /", () => {
        it("returns stale orders alert", async () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            
            const db = createDbMock({
                selectResults: [
                    [{ count: 5 }], // 5 stale orders
                ],
            });
            const app = createAlertsApp(db);

            const res = await app.request("/api/dashboard/alerts");
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data).toHaveLength(1);
            expect(body.data[0]).toMatchObject({
                id: "stale-orders",
                type: "warning",
                title: "Pesanan Tertunda",
            });
            expect(body.data[0].description).toContain("5 pesanan");
        });

        it("returns empty array when no alerts", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ count: 0 }], // No stale orders
                ],
            });
            const app = createAlertsApp(db);

            const res = await app.request("/api/dashboard/alerts");
            const body = await readJson<any>(res);

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data).toHaveLength(0);
        });

        it("includes action URL for alerts", async () => {
            const db = createDbMock({
                selectResults: [
                    [{ count: 3 }],
                ],
            });
            const app = createAlertsApp(db);

            const res = await app.request("/api/dashboard/alerts");
            const body = await readJson<any>(res);

            expect(body.data[0].actionUrl).toBe("/dashboard/orders?status=pending");
            expect(body.data[0].actionLabel).toBe("Lihat Pesanan");
        });

        it("handles database errors", async () => {
            const db = {
                select: () => {
                    throw new Error("Query failed");
                },
            };
            const app = createAlertsApp(db);

            const res = await app.request("/api/dashboard/alerts");
            const body = await readJson<any>(res);

            expect(res.status).toBe(500);
            expect(body.success).toBe(false);
        });
    });
});
