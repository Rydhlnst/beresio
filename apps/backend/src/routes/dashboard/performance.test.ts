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

import { performanceRouter } from "./performance";

const createPerformanceApp = (db: any) =>
    createTestApp(performanceRouter, "/api/dashboard/performance", db);

describe("performance routes", () => {
    it("GET /trend returns revenue points", async () => {
        const db = createDbMock({
            selectResults: [[
                { date: "2026-03-31", revenue: "5000" },
                { date: "2026-04-01", revenue: "7500" },
            ]],
        });
        const app = createPerformanceApp(db);

        const res = await app.request("/api/dashboard/performance/trend?timeRange=30d");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.meta.timeRange).toBe("30d");
        expect(body.data[0]).toMatchObject({ date: "2026-03-31", revenue: 5000 });
    });

    it("GET /branches handles database errors", async () => {
        const db = {
            select: () => {
                throw new Error("Query failed");
            },
        };
        const app = createPerformanceApp(db);

        const res = await app.request("/api/dashboard/performance/branches");
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
    });
});
