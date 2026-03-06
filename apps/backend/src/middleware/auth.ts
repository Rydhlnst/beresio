import { createMiddleware } from "hono/factory";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@beresio/db";

export const authMiddleware = createMiddleware(async (c, next) => {
    const db = c.get('db' as any); // Assuming db is injected into context

    const auth = betterAuth({
        database: drizzleAdapter(db, {
            provider: "pg",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
            }
        }),
        secret: c.env.BETTER_AUTH_SECRET,
        baseURL: c.env.BETTER_AUTH_URL,
    });


    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    c.set('user' as any, session.user);
    c.set('session' as any, session.session);

    await next();
});
