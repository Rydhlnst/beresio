import { and, eq } from "drizzle-orm";
import { fnbCommandIdempotency } from "@beresio/db";
import { errors } from "./errors";

type IdempotentResponse = {
    status: number;
    body: Record<string, unknown>;
};

export function getRequiredIdempotencyKey(c: any): string | null {
    const key = c.req.header("Idempotency-Key");
    if (!key || typeof key !== "string") return null;
    const normalized = key.trim();
    return normalized.length > 0 ? normalized : null;
}

export async function runIdempotentCommand(
    c: any,
    input: {
        orgId: string;
        scope: string;
        idempotencyKey: string;
        requestHash?: string | null;
        execute: () => Promise<IdempotentResponse>;
    }
) {
    const db = c.get("db");

    const [existing] = await db
        .select({
            responseStatus: fnbCommandIdempotency.responseStatus,
            responseBody: fnbCommandIdempotency.responseBody,
        })
        .from(fnbCommandIdempotency)
        .where(and(
            eq(fnbCommandIdempotency.organizationId, input.orgId),
            eq(fnbCommandIdempotency.scope, input.scope),
            eq(fnbCommandIdempotency.idempotencyKey, input.idempotencyKey)
        ))
        .limit(1);

    if (existing) {
        return c.json(existing.responseBody, Number(existing.responseStatus));
    }

    const response = await input.execute();

    try {
        await db.insert(fnbCommandIdempotency).values({
            organizationId: input.orgId,
            scope: input.scope,
            idempotencyKey: input.idempotencyKey,
            requestHash: input.requestHash ?? null,
            responseStatus: response.status,
            responseBody: response.body,
        });
    } catch {
        // In case of race, fetch the winner response and return it.
        const [winner] = await db
            .select({
                responseStatus: fnbCommandIdempotency.responseStatus,
                responseBody: fnbCommandIdempotency.responseBody,
            })
            .from(fnbCommandIdempotency)
            .where(and(
                eq(fnbCommandIdempotency.organizationId, input.orgId),
                eq(fnbCommandIdempotency.scope, input.scope),
                eq(fnbCommandIdempotency.idempotencyKey, input.idempotencyKey)
            ))
            .limit(1);
        if (winner) {
            return c.json(winner.responseBody, Number(winner.responseStatus));
        }
    }

    return c.json(response.body, response.status);
}

export function ensureIdempotencyKeyOrError(c: any) {
    const key = getRequiredIdempotencyKey(c);
    if (!key) {
        return { key: null, response: errors.badRequest(c, "Idempotency-Key header is required") };
    }
    return { key, response: null };
}
