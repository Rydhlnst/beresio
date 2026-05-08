import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (_c: any, next: any) => {
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
    getUserId: vi.fn(() => "user-1"),
}));

import { organizationRouter } from "./organization";

const createOrganizationApp = (db: any) =>
    createTestApp(organizationRouter, "/api/dashboard/organization", db);

describe("organization routes", () => {
    it("[OK] [AC-ORG-MODE-01] GET / returns organization profile with mode + parsed metadata", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "org-1",
                name: "Beresio",
                slug: "beresio",
                businessType: "retail",
                mode: "single",
                subscriptionPlan: "starter",
                logoUrl: null,
                metadata: "{\"timezone\":\"Asia/Jakarta\"}",
                createdAt: new Date("2026-04-01T00:00:00.000Z"),
            }]],
        });
        const app = createOrganizationApp(db);

        const res = await app.request("/api/dashboard/organization");
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            id: "org-1",
            name: "Beresio",
            slug: "beresio",
            mode: "single",
        });
        expect(body.data.metadata.timezone).toBe("Asia/Jakarta");
    });

    it("[ERR] [AC-ORG-MODE-02] PATCH / returns 404 when organization not found", async () => {
        const db = createDbMock({
            selectResults: [[]],
        });
        const app = createOrganizationApp(db);

        const res = await app.request("/api/dashboard/organization", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "New Name" }),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("NOT_FOUND");
    });

    it("[ERR] [AC-ORG-MODE-03] PATCH / rejects empty payload", async () => {
        const app = createOrganizationApp(createDbMock());

        const res = await app.request("/api/dashboard/organization", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("[OK] [AC-ORG-MODE-04] PATCH / allows owner to upgrade single -> multi", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "org-1", metadata: "{}", mode: "single" }],
                [{ roleLegacy: null, roleSlug: "owner" }],
            ],
            updateResults: [[{
                id: "org-1",
                name: "Beresio",
                mode: "multi",
            }]],
        });
        const app = createOrganizationApp(db);

        const res = await app.request("/api/dashboard/organization", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mode: "multi" }),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.mode).toBe("multi");
    });

    it("[ERR] [AC-ORG-MODE-05] PATCH / blocks non-owner mode update", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "org-1", metadata: "{}", mode: "single" }],
                [{ roleLegacy: null, roleSlug: "cashier" }],
            ],
        });
        const app = createOrganizationApp(db);

        const res = await app.request("/api/dashboard/organization", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mode: "multi" }),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(403);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("FORBIDDEN");
    });

    it("[ERR] [AC-ORG-MODE-06] PATCH / rejects downgrade multi -> single", async () => {
        const db = createDbMock({
            selectResults: [
                [{ id: "org-1", metadata: "{}", mode: "multi" }],
                [{ roleLegacy: null, roleSlug: "owner" }],
            ],
        });
        const app = createOrganizationApp(db);

        const res = await app.request("/api/dashboard/organization", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mode: "single" }),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("[ERR] [AC-ORG-MODE-07] GET / hides internal error details", async () => {
        const app = createOrganizationApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/organization");
        const body = (await res.json()) as any;

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });

    it("[OK] [AC-ORG-MODE-08] GET / returns empty metadata object when stored JSON is malformed", async () => {
        const db = createDbMock({
            selectResults: [[{
                id: "org-1",
                name: "Beresio",
                slug: "beresio",
                businessType: "retail",
                mode: "single",
                subscriptionPlan: "starter",
                logoUrl: null,
                metadata: "{broken-json",
                createdAt: new Date("2026-04-01T00:00:00.000Z"),
            }]],
        });
        const app = createOrganizationApp(db);

        const res = await app.request("/api/dashboard/organization");
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.metadata).toEqual({});
    });
});

