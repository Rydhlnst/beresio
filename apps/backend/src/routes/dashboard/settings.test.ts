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

import { settingsRouter } from "./settings";

const createSettingsApp = (db: any) =>
    createTestApp(settingsRouter, "/api/dashboard/settings", db);

describe("settings routes", () => {
    it("PATCH /profile updates user profile", async () => {
        const db = createDbMock({
            updateResults: [[{ id: "user-1", name: "Budi", image: null }]],
        });
        const app = createSettingsApp(db);

        const res = await app.request("/api/dashboard/settings/profile", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name: "Budi" }),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data).toMatchObject({ id: "user-1", name: "Budi" });
    });

    it("PATCH /notifications rejects invalid payload", async () => {
        const app = createSettingsApp(createDbMock());

        const res = await app.request("/api/dashboard/settings/notifications", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: "null",
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.3: PATCH /profile rejects empty payload", async () => {
        const app = createSettingsApp(createDbMock());

        const res = await app.request("/api/dashboard/settings/profile", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("BAD_REQUEST");
    });

    it("phase 2.3: PATCH /security hides internal error details", async () => {
        const app = createSettingsApp({
            select: () => {
                throw new Error("sensitive-db-error");
            },
        });

        const res = await app.request("/api/dashboard/settings/security", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ twoFactor: { enabled: true } }),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(500);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe("INTERNAL_ERROR");
        expect(body.error.message).toBe("Internal server error");
    });

    it("PATCH /notifications tolerates malformed existing metadata and keeps valid JSON response", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "org-1", metadata: "{invalid-json" }]],
            updateResults: [[{ id: "org-1", metadata: "{\"settings\":{\"notifications\":{\"email\":true}}}" }]],
        });
        const app = createSettingsApp(db);

        const res = await app.request("/api/dashboard/settings/notifications", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: true }),
        });
        const body = (await res.json()) as any;

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.id).toBe("org-1");
    });
});

