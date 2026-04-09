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

import { highlightsRouter } from "./highlights";

const createHighlightsApp = (db: any) =>
    createTestApp(highlightsRouter, "/api/dashboard/highlights", db);

describe("highlights routes", () => {
    it("POST / creates a highlight", async () => {
        const db = createDbMock({
            insertResults: [[{
                id: "hl-1",
                organizationId: "org-1",
                title: "Top Seller",
                description: null,
                orderIndex: 0,
                isArchived: false,
            }]],
        });
        const app = createHighlightsApp(db);

        const res = await app.request("/api/dashboard/highlights", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title: "Top Seller" }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({
            id: "hl-1",
            title: "Top Seller",
        });
    });

    it("POST / rejects missing title", async () => {
        const app = createHighlightsApp(createDbMock());

        const res = await app.request("/api/dashboard/highlights", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ description: "No title" }),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.4: PATCH /:id rejects empty payload", async () => {
        const app = createHighlightsApp(createDbMock());

        const res = await app.request("/api/dashboard/highlights/hl-1", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.4: GET / hides internal error details", async () => {
        const app = createHighlightsApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/highlights");
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });
});
