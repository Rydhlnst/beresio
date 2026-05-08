import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { branches, createDbNextjs, organization } from "@beresio/db";
import { WelcomeView } from "./_components/welcome-view";
import { eq, sql } from "drizzle-orm";
import { resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

export const metadata = {
    title: "Selamat Datang",
    description: "Pilih tujuan kamu menggunakan Beres",
};

export default async function WelcomePage() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);

    const session = await authInstance.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const orgData = await authInstance.api.listOrganizations({
        headers: await headers(),
    });

    const hasOrg = orgData && orgData.length > 0;

    if (hasOrg) {
        const routing = await resolveDashboardRoutingTarget();
        if (!routing) {
            redirect("/login");
        }

        const organizationId =
            (session as any)?.activeOrganizationId ?? orgData?.[0]?.id;
        const [orgMeta] = organizationId
            ? await db
                .select({ metadata: organization.metadata })
                .from(organization)
                .where(eq(organization.id, organizationId))
                .limit(1)
            : [{ metadata: null }];

        let metadata: Record<string, unknown> = {};
        if (orgMeta?.metadata) {
            try {
                metadata = JSON.parse(orgMeta.metadata);
            } catch {
                metadata = {};
            }
        }
        const onboardingMeta =
            metadata.onboarding && typeof metadata.onboarding === "object"
                ? (metadata.onboarding as Record<string, unknown>)
                : {};
        const modeSelected = onboardingMeta.modeSelected === true;

        const branchCountRows = organizationId
            ? await db
                .select({ count: sql<number>`count(*)` })
                .from(branches)
                .where(eq(branches.organizationId, organizationId))
            : [{ count: 0 }];

        const hasBranch = Number(branchCountRows[0]?.count ?? 0) > 0;

        if (!hasBranch) {
            if (!modeSelected) {
                redirect("/onboarding/mode");
            }
            redirect("/onboarding/branch");
        }

        redirect(routing.targetPath);
    }

    return (
        <div className="w-full max-w-2xl px-4 py-12 mx-auto">
            <WelcomeView userName={session.user.name} />
        </div>
    );
}
