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

import { activitiesRouter } from "./activities";

const createActivitiesApp = (db: any) =>
    createTestApp(activitiesRouter, "/api/dashboard/activities", db);

describe("activities routes", () => {
    it("GET / returns paginated activity list", async () => {
        const db = createDbMock({
            selectResults: [[
                {
                    id: "act-2",
                    type: "SYSTEM",
                    level: "info",
                    description: "Updated plan",
                    actorId: "user-1",
                    actorName: "Admin",
                    entityType: "organization",
                    entityId: "org-1",
                    metadata: null,
                    createdAt: new Date("2026-04-01T00:00:00.000Z"),
                },
                {
                    id: "act-1",
                    type: "AUTH",
                    level: "info",
                    description: "Login",
                    actorId: "user-2",
                    actorName: "Cashier",
                    entityType: "session",
                    entityId: "sess-1",
                    metadata: null,
                    createdAt: new Date("2026-03-31T00:00:00.000Z"),
                },
            ]],
        });
        const app = createActivitiesApp(db);

        const res = await app.request("/api/dashboard/activities?limit=1");
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(1);
        expect(body.data[0].id).toBe("act-2");
        expect(body.meta.pagination).toMatchObject({
            limit: 1,
            hasMore: true,
            nextCursor: "act-2",
        });
    });

    it("GET / handles database errors", async () => {
        const db = {
            select: () => {
                throw new Error("Query failed");
            },
        };
        const app = createActivitiesApp(db);

        const res = await app.request("/api/dashboard/activities");
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });

    it("phase 2.5: GET / rejects invalid type filter", async () => {
        const app = createActivitiesApp(createDbMock());

        const res = await app.request("/api/dashboard/activities?type=UNKNOWN");
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });
});
