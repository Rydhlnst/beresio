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

import { teamRouter } from "./team";
const createTeamApp = (db: any) => createTestApp(teamRouter, "/api/dashboard/team", db);

describe("team routes", () => {
    it("GET /members maps member response", async () => {
        const db = createDbMock({
            selectResults: [[
                {
                    id: "mem-1",
                    status: "active",
                    createdAt: new Date("2026-02-01T00:00:00.000Z"),
                    roleId: "role-1",
                    roleLegacy: "owner",
                    userName: "Rina",
                    userEmail: "rina@beres.io",
                    userImage: null,
                    roleName: "Owner",
                    roleSlug: "owner",
                    branchId: "br-1",
                    branchName: "Sudirman",
                },
            ]],
        });

        const app = createTeamApp(db);
        const res = await app.request("/api/dashboard/team/members");
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data[0]).toMatchObject({
            id: "mem-1",
            name: "Rina",
            email: "rina@beres.io",
            role: "owner",
            roleName: "Owner",
            primaryBranch: { id: "br-1", name: "Sudirman" },
            status: "active",
        });
    });

    it("PATCH /members/:id/role rejects missing roleId", async () => {
        const app = createTeamApp(createDbMock());
        const res = await app.request("/api/dashboard/team/members/mem-1/role", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("PATCH /members/:id/role updates role", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "role-1", slug: "owner", name: "Owner" }]],
            updateResults: [[{ id: "mem-1", roleId: "role-1" }]],
        });

        const app = createTeamApp(db);
        const res = await app.request("/api/dashboard/team/members/mem-1/role", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roleId: "role-1" }),
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });

    it("PATCH /members/:id/role returns 404 when role not found", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });

        const app = createTeamApp(db);
        const res = await app.request("/api/dashboard/team/members/mem-1/role", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roleId: "role-missing" }),
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
    });

    it("PATCH /members/:id/role returns 404 when member not found", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "role-1", slug: "owner", name: "Owner" }]],
            updateResults: [[]],
        });

        const app = createTeamApp(db);
        const res = await app.request("/api/dashboard/team/members/mem-1/role", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roleId: "role-1" }),
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
    });

    it("PATCH /members/:id/status rejects invalid status", async () => {
        const app = createTeamApp(createDbMock());
        const res = await app.request("/api/dashboard/team/members/mem-1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "paused" }),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("PATCH /members/:id/status returns 404 when member not found", async () => {
        const db = createDbMock({
            updateResults: [[]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/members/mem-1/status", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ status: "inactive" }),
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
    });

    it("POST /members/:id/branches rejects missing branchId", async () => {
        const app = createTeamApp(createDbMock());

        const res = await app.request("/api/dashboard/team/members/mem-1/branches", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("POST /members/:id/branches returns 404 when branch not found", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/members/mem-1/branches", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ branchId: "br-missing" }),
        });

        expect(res.status).toBe(404);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("POST /members/:id/branches returns 404 when member not found", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "br-1" }], []],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/members/mem-1/branches", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ branchId: "br-1" }),
        });

        expect(res.status).toBe(404);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("POST /invitations creates invite", async () => {
        const db = createDbMock({
            insertResults: [[{ id: "inv-1", email: "new@beres.io", status: "pending" }]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/invitations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "new@beres.io" }),
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.email).toBe("new@beres.io");
    });

    it("POST /invitations rejects missing email", async () => {
        const app = createTeamApp(createDbMock());

        const res = await app.request("/api/dashboard/team/invitations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ roleId: "role-1" }),
        });

        expect(res.status).toBe(400);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("POST /invitations rejects invalid branchId", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/invitations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "new@beres.io", branchId: "br-x" }),
        });

        expect(res.status).toBe(404);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("POST /invitations rejects invalid roleId", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/invitations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: "new@beres.io", roleId: "role-x" }),
        });

        expect(res.status).toBe(404);
        const body = (await res.json()) as any;
        expect(body.success).toBe(false);
    });

    it("POST /invitations/:id/resend returns ok", async () => {
        const db = createDbMock({
            updateResults: [[{ id: "inv-1", status: "pending" }]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/invitations/inv-1/resend", {
            method: "POST",
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });

    it("POST /invitations/:id/resend returns 404 when invite not found", async () => {
        const db = createDbMock({
            updateResults: [[]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/invitations/inv-1/resend", {
            method: "POST",
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
    });

    it("POST /invitations/:id/cancel returns ok", async () => {
        const db = createDbMock({
            updateResults: [[{ id: "inv-1", status: "cancelled" }]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/invitations/inv-1/cancel", {
            method: "POST",
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });

    it("POST /invitations/:id/cancel returns 404 when invite not found", async () => {
        const db = createDbMock({
            updateResults: [[]],
        });
        const app = createTeamApp(db);

        const res = await app.request("/api/dashboard/team/invitations/inv-1/cancel", {
            method: "POST",
        });

        const body = (await res.json()) as any;
        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
    });
});

