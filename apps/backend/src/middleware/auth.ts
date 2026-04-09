import { createMiddleware } from "hono/factory";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import * as schema from "@beresio/db";
import { errors } from "../lib/errors";

export const authMiddleware = createMiddleware(async (c, next) => {
    const db = c.get('db' as any);

    const auth = betterAuth({
        database: drizzleAdapter(db, {
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
        secret: c.env.BETTER_AUTH_SECRET,
        baseURL: c.env.BETTER_AUTH_URL,
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


    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!session?.user || !session?.session) {
        return errors.unauthorized(c);
    }

    const normalizedSession = {
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

    c.set('user' as any, session.user);
    c.set('session' as any, normalizedSession);

    await next();
});
