import { describe, expect, it, vi } from "vitest";
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

import { businessesRouter } from "./businesses";

const createBusinessesApp = (db: any) => createTestApp(businessesRouter, "/api/businesses", db);

describe("businesses navigation", () => {
    it("returns only modules allowed by role permissions", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "member-1", roleId: "role-1", roleLegacy: null }],
                [{ id: "org-1", name: "FnB Demo", businessType: "fnb", metadata: "{}" }],
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
});
