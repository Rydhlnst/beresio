import { createMiddleware } from "hono/factory";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getSessionCookie } from "better-auth/cookies";
import { organization } from "better-auth/plugins";
import * as schema from "@beresio/db";
import { errors } from "../lib/errors";
import type { AppRoute, AppSession, AppUser } from "../types/app";

let cachedAuthInstance: any = null;
let cachedAuthKey: string | null = null;

function getAuthInstance(db: unknown, secret: string, baseURL: string) {
    const key = `${secret}::${baseURL}`;
    if (cachedAuthInstance && cachedAuthKey === key) {
        return cachedAuthInstance;
    }

    const instance = betterAuth({
        database: drizzleAdapter(db as any, {
            provider: "pg",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
                organization: schema.organization,
                member: schema.member,
                invitation: schema.invitation,
                team: schema.team,
                teamMember: schema.teamMember,
            }
        }),
        secret,
        baseURL,
        plugins: [
            organization({
                schema: {
                    organization: {
                        modelName: "organization",
                    },
                    member: {
                        modelName: "member",
                    },
                    invitation: {
                        modelName: "invitation",
                    },
                    team: {
                        modelName: "team",
                    },
                    teamMember: {
                        modelName: "teamMember",
                    },
                },
                teams: {
                    enabled: true
                }
            })
        ]
    });

    cachedAuthInstance = instance;
    cachedAuthKey = key;
    return instance;
}

function getBetterAuthRequestHeaders(rawHeaders: Headers): Headers | null {
    const headers = new Headers();
    const cookie = rawHeaders.get("cookie")?.trim();
    const authorization = rawHeaders.get("authorization")?.trim();
    const hasCookieSessionToken = Boolean(getSessionCookie(rawHeaders));
    const hasBearerToken = Boolean(authorization && /^Bearer\s+\S+$/i.test(authorization));

    if (!hasCookieSessionToken && !hasBearerToken) {
        return null;
    }

    if (cookie) {
        headers.set("cookie", cookie);
    }

    if (hasBearerToken && authorization) {
        headers.set("authorization", authorization);
    }

    return headers;
}

export const authMiddleware = createMiddleware<AppRoute>(async (c, next) => {
    const db = c.get('db');

    const auth = getAuthInstance(db, c.env.BETTER_AUTH_SECRET, c.env.BETTER_AUTH_URL);
    const authHeaders = getBetterAuthRequestHeaders(c.req.raw.headers);

    if (!authHeaders) {
        return errors.unauthorized(c);
    }

    let session: any = null;
    try {
        session = await auth.api.getSession({
            headers: authHeaders,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[auth/getSession] Failed to get session from Better Auth", { message });
        return errors.unauthorized(c, "Failed to get session");
    }

    if (!session?.user || !session?.session) {
        return errors.unauthorized(c);
    }

    const normalizedSession: AppSession = {
        ...(session.session as Record<string, unknown>),
        activeOrganizationId:
            (session.session as any)?.activeOrganizationId ??
            (session as any)?.activeOrganizationId ??
            (session.user as any)?.activeOrganizationId ??
            null,
        organizationId:
            (session.session as any)?.organizationId ??
            (session as any)?.organizationId ??
            (session.user as any)?.organizationId ??
            undefined,
    };

    c.set('user', session.user as AppUser);
    c.set('session', normalizedSession);

    await next();
});
