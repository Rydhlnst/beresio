import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

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

vi.mock("../../lib/organization-aggregates", () => ({
    getOrganizationBranchAggregate: vi.fn(async () => ({
        totalBranches: 4,
        activeBranches: 3,
        activeStaff: 8,
        revenueTotal: 2500000,
        totalOrders: 15,
        completedOrders: 12,
        cancelledOrders: 1,
    })),
    resolveScopedBranchIds: vi.fn(async () => []),
}));

import { kpisRouter } from "./kpis";
const createKpisApp = (db: any) =>
    createTestApp(kpisRouter, "/api/dashboard/kpis", db);

describe("kpis routes", () => {
    describe("GET /", () => {
        it("returns KPIs for today", async () => {
            const db = createDbMock({
                selectResults: [
                    // Customers result
                    [{ total: 3 }],
                ],
            });
            const app = createKpisApp(db);

            const res = await app.request("/api/dashboard/kpis");
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data).toMatchObject({
                omzetHariIni: 2500000,
                pesananHariIni: 15,
                pelangganBaru: 3,
                activeBranches: 3,
                totalBranches: 4,
            });
        });

        it("returns zero values when no data", async () => {
            const { getOrganizationBranchAggregate } = await import("../../lib/organization-aggregates");
            vi.mocked(getOrganizationBranchAggregate).mockResolvedValueOnce({
                totalBranches: 0,
                activeBranches: 0,
                activeStaff: 0,
                revenueTotal: 0,
                totalOrders: 0,
                completedOrders: 0,
                cancelledOrders: 0,
            } as any);
            const db = createDbMock({
                selectResults: [
                    [{ total: 0 }],
                ],
            });
            const app = createKpisApp(db);

            const res = await app.request("/api/dashboard/kpis");
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.omzetHariIni).toBe(0);
            expect(body.data.pesananHariIni).toBe(0);
        });

        it("handles database errors gracefully", async () => {
            const db = {
                select: () => {
                    throw new Error("Database connection failed");
                },
            };
            const app = createKpisApp(db);

            const res = await app.request("/api/dashboard/kpis");
            const body = await res.json();

            expect(res.status).toBe(500);
            expect(body.success).toBe(false);
        });
    });
});
