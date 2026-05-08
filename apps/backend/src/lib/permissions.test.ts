import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import { createDbMock } from "../routes/dashboard/test-utils";
import { requireBranchAccess, requireOrganization, requirePermission, resolveAccessScope } from "./permissions";

vi.mock("./branch-access", () => ({
    getBranchAccessContext: async () => ({ branchIds: ["br-1"], isOrgWide: false }),
    hasBranchAccess: (branchIds: string[], branchId?: string | null) => !!branchId && branchIds.includes(branchId),
}));

function createApp(db: any) {
    const app = new Hono();
    app.use("*", async (c, next) => {
        (c as any).set("db", db);
        (c as any).set("user", { id: "user-1" });
        (c as any).set("session", { activeOrganizationId: "org-1" });
        await next();
    });
    app.get(
        "/allowed",
        requireOrganization,
        requirePermission("tables.read"),
        (c) => c.json({ ok: true })
    );
    app.get(
        "/forbidden",
        requireOrganization,
        requirePermission("tables.manage"),
        (c) => c.json({ ok: true })
    );
    app.get(
        "/branch-allowed",
        requireOrganization,
        requireBranchAccess((c) => c.req.query("branchId")),
        (c) => c.json({ ok: true })
    );
    app.get(
        "/branch-forbidden",
        requireOrganization,
        requireBranchAccess((c) => c.req.query("branchId")),
        (c) => c.json({ ok: true })
    );
    app.get(
        "/branch-list",
        requireOrganization,
        requireBranchAccess(() => null, { allowMissing: true }),
        (c) => c.json({ ok: true })
    );
    app.get("/scope", async (c) => {
        const resolved = await resolveAccessScope(c, {
            requestedBranchId: c.req.query("branchId") ?? null,
            requireBranchAccess: true,
        });
        if (!resolved.ok) return resolved.response;
        return c.json({ ok: true, scope: resolved.value });
    });
    app.get("/scope-open", async (c) => {
        const resolved = await resolveAccessScope(c, {
            requireBranchAccess: false,
        });
        if (!resolved.ok) return resolved.response;
        return c.json({ ok: true, scope: resolved.value });
    });
    return app;
}

describe("permission middleware", () => {
    it("allows when role has required permission", async () => {
        const db = createDbMock({
            selectResults: [
                [{ roleId: "role-1", roleLegacy: "cashier", roleSlug: "cashier", roleName: "Cashier" }],
                [{ permission: "tables.read" }],
            ],
        });
        const app = createApp(db);
        const res = await app.request("/allowed");
        expect(res.status).toBe(200);
    });

    it("rejects when permission is missing", async () => {
        const db = createDbMock({
            selectResults: [
                [{ roleId: "role-1", roleLegacy: "cashier", roleSlug: "cashier", roleName: "Cashier" }],
                [{ permission: "tables.read" }],
            ],
        });
        const app = createApp(db);
        const res = await app.request("/forbidden");
        expect(res.status).toBe(403);
    });

    it("allows when branch is in accessible scope", async () => {
        const db = createDbMock();
        const app = createApp(db);
        const res = await app.request("/branch-allowed?branchId=br-1");
        expect(res.status).toBe(200);
    });

    it("rejects when branch is outside accessible scope", async () => {
        const db = createDbMock();
        const app = createApp(db);
        const res = await app.request("/branch-forbidden?branchId=br-2");
        expect(res.status).toBe(403);
    });

    it("allows list mode with allowMissing", async () => {
        const db = createDbMock();
        const app = createApp(db);
        const res = await app.request("/branch-list");
        expect(res.status).toBe(200);
    });

    it("resolves scope when branch is accessible", async () => {
        const db = createDbMock();
        const app = createApp(db);
        const res = await app.request("/scope?branchId=br-1");
        const body = await res.json() as any;
        expect(res.status).toBe(200);
        expect(body.scope.orgId).toBe("org-1");
        expect(body.scope.requestedBranchId).toBe("br-1");
    });

    it("rejects scope when branch is not accessible", async () => {
        const db = createDbMock();
        const app = createApp(db);
        const res = await app.request("/scope?branchId=br-2");
        expect(res.status).toBe(403);
    });

    it("allows empty branch scope when configured", async () => {
        const db = createDbMock();
        const app = createApp(db);
        const res = await app.request("/scope-open");
        expect(res.status).toBe(200);
    });
});
