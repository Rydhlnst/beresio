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

import { kpisRouter } from "./kpis";
const createKpisApp = (db: any) =>
    createTestApp(kpisRouter, "/api/dashboard/kpis", db);

describe("kpis routes", () => {
    describe("GET /", () => {
        it("returns KPIs for today", async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const db = createDbMock({
                selectResults: [
                    // Revenue result
                    [{ total: 2500000 }],
                    // Orders result
                    [{ total: 15 }],
                    // Customers result
                    [{ total: 3 }],
                    // Branches result
                    [{ active: 3, total: 4 }],
                ],
            });
            const app = createKpisApp(db);

            const res = await app.request("/api/dashboard/kpis");
            const body = await readJson<any>(res);

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
            const db = createDbMock({
                selectResults: [
                    [{ total: 0 }],
                    [{ total: 0 }],
                    [{ total: 0 }],
                    [{ active: 0, total: 0 }],
                ],
            });
            const app = createKpisApp(db);

            const res = await app.request("/api/dashboard/kpis");
            const body = await readJson<any>(res);

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
            const body = await readJson<any>(res);

            expect(res.status).toBe(500);
            expect(body.success).toBe(false);
        });
    });
});
