import { auth } from "@/lib/auth";
import { normalizeBusinessType, type NormalizedBusinessType } from "@/lib/business-type";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";

type OrgRecord = {
    id: string;
    name: string;
    businessType?: string | null;
};

export type ActiveOrganizationContext = {
    id: string;
    name: string;
    businessType: NormalizedBusinessType;
};

export async function getActiveOrganizationContext(): Promise<ActiveOrganizationContext | null> {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();
    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) return null;

    const orgData = await authInstance.api.listOrganizations({ headers: reqHeaders });
    const organizations = (orgData ?? []) as OrgRecord[];
    if (organizations.length === 0) return null;

    const activeOrganizationId =
        (session as any)?.activeOrganizationId ?? organizations[0]?.id;
    const activeOrganization =
        organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0];

    return {
        id: activeOrganization.id,
        name: activeOrganization.name,
        businessType: normalizeBusinessType(activeOrganization.businessType ?? "retail"),
    };
}
