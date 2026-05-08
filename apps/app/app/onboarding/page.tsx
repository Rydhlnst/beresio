import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { branches, createDbNextjs, products } from "@beresio/db";

export default async function OnboardingEntryPage() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const reqHeaders = await headers();
    const session = await authInstance.api.getSession({ headers: reqHeaders });

    if (!session) {
        redirect("/login");
    }

    const orgData = await authInstance.api.listOrganizations({ headers: reqHeaders });
    if (!orgData || orgData.length === 0) {
        redirect("/onboarding/org");
    }

    const orgId = (session as any)?.activeOrganizationId ?? orgData[0]?.id;
    if (!orgId) {
        redirect("/onboarding/org");
    }

    const [branchCountRow, productCountRow] = await Promise.all([
        db
            .select({ count: sql<number>`count(*)` })
            .from(branches)
            .where(eq(branches.organizationId, orgId)),
        db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(eq(products.organizationId, orgId)),
    ]);

    if (Number(branchCountRow[0]?.count ?? 0) === 0) {
        redirect("/onboarding/branch");
    }

    if (Number(productCountRow[0]?.count ?? 0) === 0) {
        redirect("/onboarding/products");
    }

    redirect("/onboarding/team");
}
