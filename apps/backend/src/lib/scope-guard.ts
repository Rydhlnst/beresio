import type { Context } from "hono";
import { activityLogs } from "@beresio/db";
import { getOrgId, getUserId } from "./auth-context";

type OrganizationWriteAuditInput = {
    description: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
};

export async function markOrganizationWriteDiscouraged(
    c: Context,
    input: OrganizationWriteAuditInput
) {
    c.header("x-scope-warning", "organization-level-write-discouraged");

    try {
        const db = c.get("db");
        const orgId = await getOrgId(c);
        let actorId: string | null = null;
        try {
            actorId = getUserId(c);
        } catch {
            actorId = null;
        }

        await db.insert(activityLogs).values({
            organizationId: orgId,
            type: "SYSTEM",
            level: "warning",
            description: input.description,
            actorId,
            entityType: input.entityType ?? "organization",
            entityId: input.entityId ?? orgId,
            metadata: JSON.stringify({
                scope: "organization",
                discouraged: true,
                ...(input.metadata ?? {}),
            }),
        });
    } catch (error) {
        console.error("[scope-guard/organization-write]", error);
    }
}
