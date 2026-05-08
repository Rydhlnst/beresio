import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";
import { Hono } from "hono";

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
    hasBranchAccess: vi.fn((branchIds: string[], branchId?: string | null) => !!branchId && branchIds.includes(branchId)),
}));
vi.mock("../../lib/permissions", () => ({
    requireOrganization: async (_c: any, next: any) => { await next(); },
    requirePermission: () => async (_c: any, next: any) => { await next(); },
    requireBranchAccess: () => async (c: any, next: any) => {
        c.set("branchScope", {
            isOrgWide: false,
            accessibleBranchIds: ["br-1"],
            requestedBranchIds: null,
            effectiveBranchIds: ["br-1"],
        });
        await next();
    },
    getBranchScope: (c: any) => c.get("branchScope"),
    ensureBranchAccessible: async () => null,
}));
vi.mock("../../lib/fnb-domain", () => ({
    appendDomainEvent: vi.fn(async () => ({ eventId: "evt-1", sequence: 1 })),
    projectDomainEvent: vi.fn(async () => undefined),
}));
vi.mock("./fnb-commands", () => ({
    fnbCommandRouter: new Hono(),
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
                    branchName: "Jakarta",
                    code: "A1",
                    name: "Meja A1",
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

    it("POST /tables rejects duplicate table code", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "tbl-dup" }]],
        });
        const app = createFnbApp(db);

        const res = await app.request("/api/dashboard/fnb/tables", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                code: "A1",
                name: "Meja A1",
            }),
        });

        expect(res.status).toBe(400);
    });

    it("POST /table-sessions rejects active existing session", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "tbl-1", branchId: "br-1", isActive: true }],
                [{ id: "session-1" }],
            ],
        });
        const app = createFnbApp(db);

        const res = await app.request("/api/dashboard/fnb/table-sessions", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tableId: "tbl-1" }),
        });

        expect(res.status).toBe(400);
    });

    it("PATCH /table-sessions can close session", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "sess-1", tableId: "tbl-1", branchId: "br-1" }]],
            updateResults: [[{ id: "sess-1", status: "closed", tableId: "tbl-1", branchId: "br-1" }], []],
        });
        const app = createFnbApp(db);

        const res = await app.request("/api/dashboard/fnb/table-sessions", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: "sess-1", status: "closed" }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.status).toBe("closed");
    });

    it("phase 2.2: POST /tables rejects invalid status payload", async () => {
        const app = createFnbApp(createDbMock({}));

        const res = await app.request("/api/dashboard/fnb/tables", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                branchId: "br-1",
                code: "A2",
                name: "Meja A2",
                status: "invalid-status",
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.2: PATCH /table-sessions rejects invalid status payload", async () => {
        const app = createFnbApp(createDbMock({}));

        const res = await app.request("/api/dashboard/fnb/table-sessions", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                id: "sess-1",
                status: "opened",
            }),
        });
        const body = await res.json() as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.2: GET /tables hides internal error details", async () => {
        const app = createFnbApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/fnb/tables");
        const body = await res.json() as any;

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });
});
