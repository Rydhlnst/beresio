import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (_c: any, next: any) => {
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
}));

import { organizationRouter } from "./organization";

const createOrganizationApp = (db: any) =>
    createTestApp(organizationRouter, "/api/dashboard/organization", db);

describe("organization routes", () => {
    it("GET / returns organization profile with parsed metadata", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "org-1",
                name: "Beresio",
                slug: "beresio",
                businessType: "retail",
                subscriptionPlan: "starter",
                logoUrl: null,
                metadata: "{\"timezone\":\"Asia/Jakarta\"}",
                createdAt: new Date("2026-04-01T00:00:00.000Z"),
            }]],
        });
        const app = createOrganizationApp(db);

        const res = await app.request("/api/dashboard/organization");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            id: "org-1",
            name: "Beresio",
            slug: "beresio",
        });
        expect(body.data.metadata.timezone).toBe("Asia/Jakarta");
    });

    it("PATCH / returns 404 when organization not found", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });
        const app = createOrganizationApp(db);

        const res = await app.request("/api/dashboard/organization", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "New Name" }),
        });
        const body = await res.json();

        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("NOT_FOUND");
    });

    it("phase 2.3: PATCH / rejects empty payload", async () => {
        const app = createOrganizationApp(createDbMock());

        const res = await app.request("/api/dashboard/organization", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.3: GET / hides internal error details", async () => {
        const app = createOrganizationApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/organization");
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });
});
