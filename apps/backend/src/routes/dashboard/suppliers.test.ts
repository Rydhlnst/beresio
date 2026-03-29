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

import { suppliersRouter } from "./suppliers";

const createSuppliersApp = (db: any) =>
    createTestApp(suppliersRouter, "/api/dashboard/suppliers", db);

describe("suppliers routes", () => {
    it("GET /cities returns unique city list", async () => {
        const db = createDbMock({
            selectResults: [[
                { city: "Bandung" },
                { city: "Jakarta" },
                { city: null },
            ]],
        });

        const app = createSuppliersApp(db);
        const res = await app.request("/api/dashboard/suppliers/cities");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.data).toEqual(["Bandung", "Jakarta"]);
    });
});
