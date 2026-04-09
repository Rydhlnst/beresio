import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

const getSessionMock = vi.fn();

vi.mock("better-auth", () => ({
    betterAuth: vi.fn(() => ({
        api: {
            getSession: getSessionMock,
        },
    })),
}));

vi.mock("better-auth/adapters/drizzle", () => ({
    drizzleAdapter: vi.fn(() => ({})),
}));

vi.mock("better-auth/plugins", () => ({
    organization: vi.fn(() => ({})),
}));

vi.mock("@beresio/db", () => ({
    user: {},
    session: {},
    account: {},
    verification: {},
    organization: {},
    member: {},
    invitation: {},
    team: {},
    teamMember: {},
}));

import { authMiddleware } from "./auth";

function createAuthTestApp() {
    const app = new Hono();
    app.use("*", async (c: any, next) => {
        c.set("db", {});
        await next();
    });
    app.get("/protected", authMiddleware, (c: any) => {
        return c.json({
            user: c.get("user"),
            session: c.get("session"),
        });
    });
    return app;
}

const authEnv = {
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_URL: "http://localhost:8787",
} as any;

describe("authMiddleware", () => {
    it("returns standardized unauthorized response when no session", async () => {
        getSessionMock.mockResolvedValueOnce(null);
        const app = createAuthTestApp();

        const res = await app.request("/protected", undefined, authEnv);
        const body = await res.json() as any;

        expect(res.status).toBe(401);
        expect(body).toEqual({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            },
        });
    });

    it("passes through and sets user/session context when session exists", async () => {
        getSessionMock.mockResolvedValueOnce({
            user: { id: "user-1" },
            session: { activeOrganizationId: "org-1" },
        });
        const app = createAuthTestApp();

        const res = await app.request("/protected", undefined, authEnv);
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.user.id).toBe("user-1");
        expect(body.session.activeOrganizationId).toBe("org-1");
    });

    it("normalizes activeOrganizationId from top-level payload", async () => {
        getSessionMock.mockResolvedValueOnce({
            user: { id: "user-1" },
            session: {},
            activeOrganizationId: "org-top-level",
        });
        const app = createAuthTestApp();

        const res = await app.request("/protected", undefined, authEnv);
        const body = await res.json() as any;

        expect(res.status).toBe(200);
        expect(body.session.activeOrganizationId).toBe("org-top-level");
    });
});
