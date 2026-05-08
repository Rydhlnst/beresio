import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { requireBranchContext } from "./branch-context";

vi.mock("../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
}));

vi.mock("../lib/branch-access", () => ({
    getAccessibleBranchIds: vi.fn(async () => ["br-1"]),
}));

function createApp(db: any) {
    const app = new Hono<{ Variables: { db: any } }>();
    app.use("*", async (c, next) => {
        c.set("db", db);
        await next();
    });
    app.post("/test", requireBranchContext(), async (c) => c.json({ ok: true }));
    return app;
}

describe("requireBranchContext middleware", () => {
    it("rejects write request without branch context", async () => {
        const app = createApp({
            select: () => ({
                from: () => ({
                    where: () => ({
                        limit: async () => [],
                    }),
                }),
            }),
        });

        const res = await app.request("/test", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ note: "no branch" }),
        });

        const body = await res.json();
        expect(res.status).toBe(400);
        expect((body as any).error?.message).toContain("Branch context is required");
    });

    it("accepts payload branchId and passes middleware", async () => {
        const app = createApp({
            select: () => ({
                from: () => ({
                    where: () => ({
                        limit: async () => [{ id: "br-1" }],
                    }),
                }),
            }),
        });

        const res = await app.request("/test", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ branchId: "br-1" }),
        });

        const body = await res.json();
        expect(res.status).toBe(200);
        expect((body as any).ok).toBe(true);
    });
});
