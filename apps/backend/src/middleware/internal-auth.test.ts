import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { internalAuthMiddleware } from "./internal-auth";

function createApp() {
    const app = new Hono();
    app.get("/internal", internalAuthMiddleware, (c) => c.json({ ok: true }));
    return app;
}

describe("internalAuthMiddleware", () => {
    it("returns 503 when secret is not configured", async () => {
        const app = createApp();
        const res = await app.request("/internal", { method: "GET" }, {} as any);
        const body = await res.json() as any;

        expect(res.status).toBe(503);
        expect(body.error.code).toBe("INTERNAL_NOT_CONFIGURED");
    });

    it("returns 401 for invalid key", async () => {
        const app = createApp();
        const res = await app.request("/internal", {
            method: "GET",
            headers: { "x-internal-api-key": "wrong" },
        }, { INTERNAL_API_SECRET: "secret-123" } as any);

        expect(res.status).toBe(401);
    });

    it("allows request with matching x-internal-api-key", async () => {
        const app = createApp();
        const res = await app.request("/internal", {
            method: "GET",
            headers: { "x-internal-api-key": "secret-123" },
        }, { INTERNAL_API_SECRET: "secret-123" } as any);

        expect(res.status).toBe(200);
    });

    it("allows request with bearer token", async () => {
        const app = createApp();
        const res = await app.request("/internal", {
            method: "GET",
            headers: { Authorization: "Bearer secret-123" },
        }, { INTERNAL_API_SECRET: "secret-123" } as any);

        expect(res.status).toBe(200);
    });
});
