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
}));

import { branchesRouter } from "./branches";
const createBranchesApp = (db: any) =>
    createTestApp(branchesRouter, "/api/dashboard/branches", db);

describe("branches routes", () => {
    it("GET / returns branch list", async () => {
        const db = createDbMock({
            selectResults: [
                [{ count: 1 }],
                [],
                [],
                [{
                    id: "br-1",
                    name: "Sudirman",
                    code: "SDM",
                    address: "Jl. Sudirman",
                    phone: "0812",
                    isActive: true,
                    revenue: 1200000,
                    orders: 12,
                    staffCount: 4,
                }],
            ],
        });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches");
        const body = (await res.json()) as any;
        const rows = Array.isArray(body.data?.data) ? body.data.data : [];

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(rows[0]).toMatchObject({
            id: "br-1",
            name: "Sudirman",
            code: "SDM",
            isActive: true,
            revenue: 1200000,
            orders: 12,
            staffCount: 4,
        });
    });

    it("GET /:id returns 404 when missing", async () => {
        const db = createDbMock({ selectResults: [[]] });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches/br-x");
        const body = (await res.json()) as any;

        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
    });

    it("GET /:id returns branch detail", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "br-1", name: "Sudirman", code: "SDM", isActive: true }]],
        });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches/br-1");
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({ id: "br-1", name: "Sudirman", code: "SDM" });
    });

    it("POST / rejects missing name or code", async () => {
        const app = createBranchesApp(createDbMock());
        const res = await app.request("/api/dashboard/branches", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Cabang" }),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("POST / rejects duplicate code", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "br-1" }]],
        });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Cabang", code: "SDM" }),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("POST / creates branch", async () => {
        const db = createDbMock({
            selectResults: [[]],
            insertResults: [[{ id: "br-2", name: "Kemang", code: "KMG" }]],
        });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Kemang", code: "KMG" }),
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.id).toBe("br-2");
    });

    it("PATCH /:id/status rejects non-boolean", async () => {
        const app = createBranchesApp(createDbMock());
        const res = await app.request("/api/dashboard/branches/br-1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ isActive: "yes" }),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("PATCH /:id/status returns 404 when branch not found", async () => {
        const db = createDbMock({
            updateResults: [[]],
        });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches/br-1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ isActive: true }),
        });

        expect(res.status).toBe(404);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("PATCH /:id rejects duplicate code", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "br-1" }]],
        });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches/br-2", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ code: "SDM" }),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("PATCH /:id updates branch details", async () => {
        const db = createDbMock({
            selectResults: [[]],
            updateResults: [[{ id: "br-1", name: "Kemang", code: "KMG" }]],
        });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches/br-1", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Kemang", code: "KMG" }),
        });

        expect(res.status).toBe(200);
        const body = (await res.json()) as any;
        expect(body.success).toBe(true);
        expect(body.data.name).toBe("Kemang");
    });

    it("PATCH /:id returns 404 when branch not found", async () => {
        const db = createDbMock({
            selectResults: [[]],
            updateResults: [[]],
        });
        const app = createBranchesApp(db);

        const res = await app.request("/api/dashboard/branches/br-1", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Kemang", code: "KMG" }),
        });

        expect(res.status).toBe(404);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });
});

