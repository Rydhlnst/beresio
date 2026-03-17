import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createDbNextjs, team } from "@beresio/db";
import { TeamOnboardingForm } from "./_components/team-onboarding-form";
import { eq, sql } from "drizzle-orm";

export const metadata = {
    title: "Daftarkan Cabang Pertama | Beres",
    description: "Tambahkan cabang usaha pertama untuk mulai mengelola operasional",
};

export default async function OnboardingTeamPage() {
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

    if (!hasOrg) {
        redirect("/onboarding/org");
    }

    const organizationId =
        (session as any)?.activeOrganizationId ?? orgData?.[0]?.id;

    const teamCountRows = organizationId
        ? await db
            .select({ count: sql<number>`count(*)` })
            .from(team)
            .where(eq(team.organizationId, organizationId))
        : [{ count: 0 }];

    const hasTeam = Number(teamCountRows[0]?.count ?? 0) > 0;

    if (hasTeam) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6 w-full px-4">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Daftarkan Cabang Pertama</h1>
                <p className="text-muted-foreground">
                    Contoh: Indomaret Setia Budi Medan (bukan nama usaha utama)
                </p>
            </div>
            <TeamOnboardingForm organizationId={organizationId} />
        </div>
    );
}
