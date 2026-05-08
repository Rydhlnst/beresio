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
    getBranchAccessContext: vi.fn(async () => ({ branchIds: ["br-1"], isOrgWide: false })),
    getAccessibleBranchIds: vi.fn(async () => ["br-1"]),
    hasBranchAccess: vi.fn((branchIds: string[], branchId?: string | null) => !!branchId && branchIds.includes(branchId)),
}));

import { reportsRouter } from "./reports";

const createReportsApp = (db: any) =>
    createTestApp(reportsRouter, "/api/dashboard/reports", db);

describe("reports routes", () => {
    it("GET /catalog returns report catalog", async () => {
        const app = createReportsApp(createDbMock());

        const res = await app.request("/api/dashboard/reports/catalog");
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(4);
        expect(body.data[0]).toMatchObject({ id: "sales" });
    });

    it("GET /summary rejects invalid date range", async () => {
        const app = createReportsApp(createDbMock());

        const res = await app.request(
            "/api/dashboard/reports/summary?range=custom&dateFrom=invalid-date&dateTo=2026-04-01"
        );
        const body = (await res.json()) as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });
});

