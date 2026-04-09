import { createMiddleware } from "hono/factory";
import { errors } from "../lib/errors";

function safeEqual(a: string, b: string) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i += 1) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

export const internalAuthMiddleware = createMiddleware(async (c, next) => {
    const expected = (c.env as any)?.INTERNAL_API_SECRET as string | undefined;
    if (!expected || expected.trim().length === 0) {
        return c.json({
            success: false,
            error: { code: "INTERNAL_NOT_CONFIGURED", message: "Internal API secret is not configured" },
        }, 503);
    }

    const headerKey = c.req.header("x-internal-api-key");
    const bearer = c.req.header("authorization");
    const bearerToken = typeof bearer === "string" && bearer.startsWith("Bearer ")
        ? bearer.slice("Bearer ".length).trim()
        : null;
    const provided = (headerKey ?? bearerToken ?? "").trim();

    if (!provided || !safeEqual(provided, expected.trim())) {
        return errors.unauthorized(c, "Invalid internal API key");
    }

    await next();
});
