import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createDbNextjs, team } from "@beresio/db";
import { WelcomeView } from "./_components/welcome-view";
import { eq, sql } from "drizzle-orm";

export const metadata = {
    title: "Selamat Datang | Beres",
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
        const organizationId =
            (session as any)?.activeOrganizationId ?? orgData?.[0]?.id;

        const teamCountRows = organizationId
            ? await db
                .select({ count: sql<number>`count(*)` })
                .from(team)
                .where(eq(team.organizationId, organizationId))
            : [{ count: 0 }];

        const hasTeam = Number(teamCountRows[0]?.count ?? 0) > 0;

        if (!hasTeam) {
            redirect("/onboarding/team");
        }

        redirect("/dashboard");
    }

    return (
        <div className="w-full max-w-2xl px-4 py-12 mx-auto">
            <WelcomeView userName={session.user.name} />
        </div>
    );
}
