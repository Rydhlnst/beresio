import { Hono } from "hono";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { fnbDomainEvents } from "@beresio/db";
import { runFnbProjectorUntilCaughtUp } from "../../lib/fnb-domain";
import { errors, ok } from "../../lib/errors";
import { internalAuthMiddleware } from "../../middleware/internal-auth";

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    INTERNAL_API_SECRET?: string;
};
type Variables = { db: any; user: any; session: any };

const runProjectorSchema = z.object({
    organizationId: z.string().trim().min(1).optional(),
    projectorName: z.string().trim().min(1).max(100).optional().default("fnb-core-projector"),
    batchSize: z.coerce.number().int().min(1).max(1000).optional().default(100),
    maxBatches: z.coerce.number().int().min(1).max(200).optional().default(10),
    maxOrganizations: z.coerce.number().int().min(1).max(200).optional().default(20),
});

export const internalFnbWorkersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

internalFnbWorkersRouter.use("*", internalAuthMiddleware);

async function resolveOrganizations(db: any, maxOrganizations: number) {
    const rows = await db
        .select({ organizationId: fnbDomainEvents.organizationId })
        .from(fnbDomainEvents)
        .orderBy(desc(fnbDomainEvents.sequence))
        .limit(Math.max(50, maxOrganizations * 20));

    const seen = new Set<string>();
    const orgIds: string[] = [];
    for (const row of rows) {
        const orgId = String(row.organizationId ?? "").trim();
        if (!orgId || seen.has(orgId)) continue;
        seen.add(orgId);
        orgIds.push(orgId);
        if (orgIds.length >= maxOrganizations) break;
    }
    return orgIds;
}

async function runCatchUp(c: any, payload: unknown) {
    const parsed = runProjectorSchema.safeParse(payload ?? {});
    if (!parsed.success) {
        return errors.badRequest(c, parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const db = c.get("db");
    const orgIds = parsed.data.organizationId
        ? [parsed.data.organizationId]
        : await resolveOrganizations(db, parsed.data.maxOrganizations);

    const results: Array<{
        organizationId: string;
        totalProcessed: number;
        lastSequence: number;
        batches: number;
    }> = [];

    for (const organizationId of orgIds) {
        const replay = await runFnbProjectorUntilCaughtUp(db, {
            organizationId,
            projectorName: parsed.data.projectorName,
            batchSize: parsed.data.batchSize,
            maxBatches: parsed.data.maxBatches,
        });
        results.push({
            organizationId,
            totalProcessed: replay.totalProcessed,
            lastSequence: replay.lastSequence,
            batches: replay.batches,
        });
    }

    const totalProcessed = results.reduce((sum, item) => sum + item.totalProcessed, 0);
    return ok(c, {
        projectorName: parsed.data.projectorName,
        organizationIds: orgIds,
        organizationsProcessed: results.length,
        totalProcessed,
        results,
    });
}

internalFnbWorkersRouter.post("/projectors/catch-up", async (c) => {
    const payload = await c.req.json().catch(() => ({}));
    return runCatchUp(c, payload);
});

internalFnbWorkersRouter.get("/projectors/catch-up", async (c) => {
    const payload = {
        organizationId: c.req.query("organizationId") ?? undefined,
        projectorName: c.req.query("projectorName") ?? undefined,
        batchSize: c.req.query("batchSize") ?? undefined,
        maxBatches: c.req.query("maxBatches") ?? undefined,
        maxOrganizations: c.req.query("maxOrganizations") ?? undefined,
    };
    return runCatchUp(c, payload);
});
