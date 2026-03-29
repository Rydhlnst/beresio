import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
    getUserId: vi.fn(() => "user-1"),
}));

vi.mock("../../lib/branch-access", () => ({
    getBranchAccessContext: vi.fn(async () => ({ branchIds: ["br-1"], isOrgWide: false })),
    hasBranchAccess: vi.fn((branchIds: string[], branchId?: string | null) => Boolean(branchId && branchIds.includes(branchId))),
}));

import { fnbRouter } from "./fnb";

const createFnbApp = (db: any) => createTestApp(fnbRouter, "/api/dashboard/fnb", db);

describe("fnb routes", () => {
    it("GET /tables returns table list", async () => {
        const db = createDbMock({
            selectResults: [[
                {
                    id: "tbl-1",
                    branchId: "br-1",
                    branchName: "Main Branch",
                    code: "A1",
                    name: "Table A1",
                    area: "Indoor",
                    capacity: 4,
                    status: "available",
                    isActive: true,
                },
            ]],
        });
        const app = createFnbApp(db);

        const res = await app.request("/api/dashboard/fnb/tables");
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data[0]).toMatchObject({
            id: "tbl-1",
            code: "A1",
            status: "available",
        });
    });

    it("POST /tables creates table", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "br-1" }], []],
            insertResults: [[{
                id: "tbl-2",
                organizationId: "org-1",
                branchId: "br-1",
                code: "B1",
                name: "Table B1",
                capacity: 4,
                status: "available",
                isActive: true,
            }]],
        });
        const app = createFnbApp(db);

        const res = await app.request("/api/dashboard/fnb/tables", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                code: "B1",
                name: "Table B1",
                capacity: 4,
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.id).toBe("tbl-2");
    });

    it("POST /table-sessions rejects when table already has active session", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "tbl-1", branchId: "br-1", status: "available", isActive: true }],
                [{ id: "sess-1" }],
            ],
        });
        const app = createFnbApp(db);

        const res = await app.request("/api/dashboard/fnb/table-sessions", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tableId: "tbl-1", guestCount: 2 }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
    });
});
