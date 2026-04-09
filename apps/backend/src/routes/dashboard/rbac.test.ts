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

import { rbacRouter } from "./rbac";
const createRbacApp = (db: any) => createTestApp(rbacRouter, "/api/dashboard/rbac", db);

describe("rbac routes", () => {
    it("POST /bootstrap seeds roles and updates member roleId", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "mem-1", role: "owner", roleId: null }],
                [],
                [{ id: "role-owner", slug: "owner" }],
                [],
            ],
            insertResults: [[], []],
            updateResults: [[{ id: "mem-1", roleId: "role-owner" }]],
        });

        const app = createRbacApp(db);
        const res = await app.request("/api/dashboard/rbac/bootstrap", { method: "POST" });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            rolesInserted: 7,
            permissionsInserted: 13,
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
                [
                    { id: "role-1", slug: "owner" },
                    { id: "role-2", slug: "admin" },
                    { id: "role-3", slug: "branch_manager" },
                    { id: "role-4", slug: "cashier" },
                    { id: "role-5", slug: "laundry_worker" },
                    { id: "role-6", slug: "driver" },
                    { id: "role-7", slug: "staff" },
                ],
                [
                    { id: "role-1", slug: "owner" },
                    { id: "role-2", slug: "admin" },
                    { id: "role-3", slug: "branch_manager" },
                    { id: "role-4", slug: "cashier" },
                    { id: "role-5", slug: "laundry_worker" },
                    { id: "role-6", slug: "driver" },
                    { id: "role-7", slug: "staff" },
                ],
                [
                    { roleId: "role-1", permission: "dashboard.read" },
                    { roleId: "role-1", permission: "branch.read" },
                    { roleId: "role-1", permission: "team.read" },
                    { roleId: "role-1", permission: "settings.read" },
                    { roleId: "role-1", permission: "order.read" },
                    { roleId: "role-1", permission: "order.create" },
                    { roleId: "role-1", permission: "laundry.status.update" },
                    { roleId: "role-1", permission: "laundry.payment.record" },
                    { roleId: "role-1", permission: "laundry.service.manage" },
                    { roleId: "role-1", permission: "pickup.read" },
                    { roleId: "role-1", permission: "pickup.manage" },
                    { roleId: "role-1", permission: "laundry.driver.assign" },
                    { roleId: "role-1", permission: "report.read" },
                ],
            ],
        });

        const app = createRbacApp(db);
        const res = await app.request("/api/dashboard/rbac/bootstrap", { method: "POST" });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            rolesInserted: 0,
            permissionsInserted: 39,
            memberUpdated: false,
            roleSlug: "owner",
        });
    });
});
