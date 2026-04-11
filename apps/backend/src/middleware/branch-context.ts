import type { Context, MiddlewareHandler } from "hono";
import { and, eq } from "drizzle-orm";
import { branches } from "@beresio/db";
import { getOrgId } from "../lib/auth-context";
import { getAccessibleBranchIds } from "../lib/branch-access";
import { errors } from "../lib/errors";

type RequireBranchContextOptions = {
    payloadKeys?: string[];
    pathParamKeys?: string[];
    headerName?: string;
};

type BranchContextResolved = {
    branchId: string;
    orgId: string;
    source: "path" | "payload" | "header";
};

function extractStringValue(input: unknown): string | null {
    if (typeof input !== "string") return null;
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
}

async function readJsonBodySafe(c: Context): Promise<Record<string, unknown> | null> {
    try {
        const parsed = await c.req.raw.clone().json();
        if (parsed && typeof parsed === "object") {
            return parsed as Record<string, unknown>;
        }
        return null;
    } catch {
        return null;
    }
}

async function resolveBranchId(
    c: Context,
    options: RequireBranchContextOptions
): Promise<{ branchId: string | null; source: BranchContextResolved["source"] | null }> {
    const pathKeys = options.pathParamKeys ?? ["branchId"];
    for (const key of pathKeys) {
        const value = extractStringValue(c.req.param(key));
        if (value) return { branchId: value, source: "path" };
    }

    const payload = await readJsonBodySafe(c);
    const payloadKeys = options.payloadKeys ?? ["branchId"];
    for (const key of payloadKeys) {
        const value = extractStringValue(payload?.[key]);
        if (value) return { branchId: value, source: "payload" };
    }

    const headerName = options.headerName ?? "x-branch-id";
    const headerValue = extractStringValue(c.req.header(headerName));
    if (headerValue) return { branchId: headerValue, source: "header" };

    return { branchId: null, source: null };
}

export async function resolveRequiredBranchContext(
    c: Context,
    options: RequireBranchContextOptions = {}
): Promise<{ ok: true; value: BranchContextResolved } | { ok: false; response: Response }> {
    let orgId: string;
    try {
        orgId = await getOrgId(c);
    } catch {
        return { ok: false, response: errors.unauthorized(c, "No organization context") };
    }

    const { branchId, source } = await resolveBranchId(c, options);
    if (!branchId || !source) {
        return { ok: false, response: errors.badRequest(c, "Branch context is required") };
    }

    const db = c.get("db");
    const [branchRow] = await db
        .select({ id: branches.id })
        .from(branches)
        .where(and(eq(branches.id, branchId), eq(branches.organizationId, orgId)))
        .limit(1);

    if (!branchRow) {
        return { ok: false, response: errors.badRequest(c, "Branch context is invalid") };
    }

    const accessibleBranchIds = await getAccessibleBranchIds(c, orgId);
    if (!accessibleBranchIds.includes(branchId)) {
        return { ok: false, response: errors.forbidden(c, "No access to branch context") };
    }

    return {
        ok: true,
        value: {
            orgId,
            branchId,
            source,
        },
    };
}

export function requireBranchContext(
    options: RequireBranchContextOptions = {}
): MiddlewareHandler {
    return async (c, next) => {
        const resolved = await resolveRequiredBranchContext(c, options);
        if (!resolved.ok) return resolved.response;

        c.set("branchContext", resolved.value);
        await next();
    };
}
