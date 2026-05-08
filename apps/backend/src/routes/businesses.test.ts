import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./dashboard/test-utils";

vi.mock("../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../lib/auth-context", () => ({
    getUserId: vi.fn(() => "user-1"),
}));

import { businessesRouter, clearNavigationCacheForTests } from "./businesses";

const createBusinessesApp = (db: any) => createTestApp(businessesRouter, "/api/businesses", db);

describe("businesses navigation", () => {
    beforeEach(() => {
        clearNavigationCacheForTests();
    });

    it("[OK] [AC-BIZ-MODE-01] returns organization mode in navigation payload", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "member-1", roleId: null, roleLegacy: "owner" }],
                [{ id: "org-1", name: "Retail Single", businessType: "retail", mode: "single", metadata: "{}" }],
                [{ id: "role-owner" }],
                [{ permission: "dashboard.read" }],
                [{ id: "role-owner", slug: "owner", name: "Owner" }],
            ],
        });
        const app = createBusinessesApp(db);

        const res = await app.request("/api/businesses/org-1/navigation");
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.business.mode).toBe("single");
        expect(body.data.navigation.map((item: { id: string }) => item.id)).toContain("dashboard");
    });

    it("[OK] [AC-BIZ-MODE-02] returns only modules allowed by role permissions", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "member-1", roleId: "role-1", roleLegacy: null }],
                [{ id: "org-1", name: "FnB Demo", businessType: "fnb", mode: "multi", metadata: "{}" }],
                [
                    { permission: "dashboard.read" },
                    { permission: "tables.read" },
                ],
            ],
        });
        const app = createBusinessesApp(db);

        const res = await app.request("/api/businesses/org-1/navigation");
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.permissions).toContain("tables.read");

        const navIds = (body.data.navigation as Array<{ id: string }>).map((item) => item.id);
        expect(navIds).toContain("dashboard");
        expect(navIds).toContain("meja");
        expect(navIds).not.toContain("menu");
        expect(navIds).not.toContain("order");
    });

    it("[OK] [AC-BIZ-MODE-03] keeps single-tenant laundry management modules visible for owner without explicit permissions", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "member-1", roleId: null, roleLegacy: "owner" }],
                [{ id: "org-1", name: "Laundry Single", businessType: "laundry", mode: "single", metadata: "{}" }],
                [{ id: "role-owner" }],
                [],
                [{ id: "role-owner", slug: "owner", name: "Owner" }],
            ],
        });
        const app = createBusinessesApp(db);

        const res = await app.request("/api/businesses/org-1/navigation");
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.business.mode).toBe("single");

        const navIds = (body.data.navigation as Array<{ id: string }>).map((item) => item.id);
        expect(navIds).toContain("dashboard");
        expect(navIds).toContain("crm");
        expect(navIds).toContain("order");
        expect(navIds).toContain("inventory");
        expect(navIds).toContain("laporan");
        expect(navIds).toContain("pickup");
    });

    it("[OK] [AC-BIZ-MODE-04] falls back to empty config when organization metadata is invalid JSON", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "member-1", roleId: null, roleLegacy: "owner" }],
                [{ id: "org-1", name: "Retail Broken Metadata", businessType: "retail", mode: "single", metadata: "{invalid-json" }],
                [{ id: "role-owner" }],
                [{ permission: "dashboard.read" }],
                [{ id: "role-owner", slug: "owner", name: "Owner" }],
            ],
        });
        const app = createBusinessesApp(db);

        const res = await app.request("/api/businesses/org-1/navigation");
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.business.config).toEqual({});
    });
});
