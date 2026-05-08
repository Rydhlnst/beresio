import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { branches, createDbNextjs, organization } from "@beresio/db";
import { ModeOnboardingForm } from "./_components/mode-onboarding-form";

export const metadata = {
    title: "Pilih Mode Bisnis",
    description: "Tentukan apakah bisnis berjalan single branch atau multi branch.",
};

function parseOnboardingMetadata(raw: string | null | undefined) {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return parsed.onboarding && typeof parsed.onboarding === "object"
            ? (parsed.onboarding as Record<string, unknown>)
            : {};
    } catch {
        return {};
    }
}

export default async function OnboardingModePage() {
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

    const activeOrgId = (session as any)?.activeOrganizationId ?? orgData[0]?.id;
    if (!activeOrgId) {
        redirect("/onboarding/org");
    }

    const [orgRow] = await db
        .select({
            id: organization.id,
            mode: organization.mode,
            metadata: organization.metadata,
        })
        .from(organization)
        .where(eq(organization.id, activeOrgId))
        .limit(1);

    const branchCountRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(branches)
        .where(eq(branches.organizationId, activeOrgId));
    const hasBranch = Number(branchCountRows[0]?.count ?? 0) > 0;
    if (hasBranch) {
        redirect("/");
    }

    const onboardingMeta = parseOnboardingMetadata(orgRow?.metadata ?? null);
    if (onboardingMeta.modeSelected === true) {
        redirect("/onboarding/branch");
    }

    return (
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <section className="w-full max-w-[760px] rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Step 2</p>
                    <h2 className="text-2xl font-semibold leading-tight text-foreground">Pilih mode operasional bisnis</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Mode ini menentukan alur dashboard, routing login, dan struktur navigasi tim.
                    </p>
                </div>

                <div className="mt-6">
                    <ModeOnboardingForm initialMode={orgRow?.mode ?? "single"} />
                </div>
            </section>
        </div>
    );
}
