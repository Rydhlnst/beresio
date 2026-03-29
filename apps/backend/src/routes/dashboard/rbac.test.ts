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

const { getMemberRoleSlugsMock } = vi.hoisted(() => ({
    getMemberRoleSlugsMock: vi.fn(async () => ["owner"]),
}));
vi.mock("../../lib/branch-access", () => ({
    getMemberRoleSlugs: getMemberRoleSlugsMock,
    hasOrgWideRoleSlug: (roleSlug: string) =>
        new Set([
            "owner",
            "admin",
            "administrator",
            "super_admin",
            "superadmin",
            "org_admin",
            "organization_admin",
        ]).has(roleSlug),
}));

import { rbacRouter } from "./rbac";
const createRbacApp = (db: any) => createTestApp(rbacRouter, "/api/dashboard/rbac", db);

describe("rbac routes", () => {
    it("POST /bootstrap rejects non-admin role", async () => {
        getMemberRoleSlugsMock.mockResolvedValueOnce(["cashier"]);
        const app = createRbacApp(createDbMock());
        const res = await app.request("/api/dashboard/rbac/bootstrap", { method: "POST" });
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.success).toBe(false);
        expect(body.error.message).toBe("insufficient role/permission");
    });

    it("POST /bootstrap seeds roles and updates member roleId", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "mem-1", role: "owner", roleId: null }],
                [],
                [{ id: "role-owner" }],
            ],
            insertResults: [[]],
            updateResults: [[{ id: "mem-1", roleId: "role-owner" }]],
        });

        const app = createRbacApp(db);
        const res = await app.request("/api/dashboard/rbac/bootstrap", { method: "POST" });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            rolesInserted: 5,
            memberUpdated: true,
            roleSlug: "owner",
        });
    });

    it("POST /bootstrap returns forbidden when membership missing", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });

        const app = createRbacApp(db);
        const res = await app.request("/api/dashboard/rbac/bootstrap", { method: "POST" });
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.success).toBe(false);
    });

    it("POST /bootstrap skips update when member already has roleId", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "mem-1", role: "owner", roleId: "role-1" }],
                [{ id: "role-1", slug: "owner" }],
            ],
        });

        const app = createRbacApp(db);
        const res = await app.request("/api/dashboard/rbac/bootstrap", { method: "POST" });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            rolesInserted: 4,
            memberUpdated: false,
            roleSlug: "owner",
        });
    });
});
