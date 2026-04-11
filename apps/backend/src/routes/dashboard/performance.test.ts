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

vi.mock("../../lib/branch-access", () => ({
    getBranchAccessContext: vi.fn(async () => ({
        branchIds: ["branch-1", "branch-2"],
        isOrgWide: false,
    })),
    hasBranchAccess: vi.fn((branchIds: string[], branchId?: string | null) =>
        branchId ? branchIds.includes(branchId) : false
    ),
}));

import { performanceRouter } from "./performance";

const createPerformanceApp = (db: any) =>
    createTestApp(performanceRouter, "/api/dashboard/performance", db);

describe("performance routes", () => {
    it("[OK] [AC-PERF-MODE-01] GET /trend returns revenue points", async () => {
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

    it("[ERR] [AC-PERF-MODE-02] GET /trend returns 403 when member has no branch access", async () => {
        const { getBranchAccessContext } = await import("../../lib/branch-access");
        vi.mocked(getBranchAccessContext).mockResolvedValueOnce({
            branchIds: [],
            isOrgWide: false,
        } as any);
        const db = createDbMock();
        const app = createPerformanceApp(db);

        const res = await app.request("/api/dashboard/performance/trend");
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("FORBIDDEN");
    });

    it("[ERR] [AC-PERF-MODE-03] GET /trend returns 403 for inaccessible branchId", async () => {
        const { getBranchAccessContext } = await import("../../lib/branch-access");
        vi.mocked(getBranchAccessContext).mockResolvedValueOnce({
            branchIds: ["branch-1"],
            isOrgWide: false,
        } as any);
        const db = createDbMock();
        const app = createPerformanceApp(db);

        const res = await app.request("/api/dashboard/performance/trend?branchId=branch-2");
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("FORBIDDEN");
    });

    it("[ERR] [AC-PERF-MODE-04] GET /branches handles database errors", async () => {
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
