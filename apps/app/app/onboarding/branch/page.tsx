import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { Clock3, MapPinned, PhoneCall } from "lucide-react";

import { auth } from "@/lib/auth";
import { branches, createDbNextjs, organization } from "@beresio/db";
import { BranchOnboardingForm } from "./_components/branch-onboarding-form";

export const metadata = {
    title: "Setup Cabang Pertama",
    description: "Lengkapi data cabang pertama dan jam operasional dasar.",
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

export default async function OnboardingBranchPage() {
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

    const [orgRow] = await db
        .select({
            id: organization.id,
            mode: organization.mode,
            metadata: organization.metadata,
        })
        .from(organization)
        .where(eq(organization.id, orgId))
        .limit(1);

    const onboardingMeta = parseOnboardingMetadata(orgRow?.metadata ?? null);
    if (onboardingMeta.modeSelected !== true) {
        redirect("/onboarding/mode");
    }

    const branchCountRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(branches)
        .where(eq(branches.organizationId, orgId));

    const hasBranch = Number(branchCountRows[0]?.count ?? 0) > 0;
    if (hasBranch) {
        redirect("/onboarding/team");
    }

    return (
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <section className="w-full max-w-[860px] max-h-full overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Step 3</p>
                    <h2 className="text-2xl font-semibold leading-tight text-foreground">Setup cabang operasional pertama</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Lengkapi alamat, kontak, dan jam operasional cabang pertama.
                    </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <MapPinned className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Alamat lengkap</p>
                        <p className="text-xs text-muted-foreground">Digunakan untuk konteks operasional cabang.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <PhoneCall className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Kontak cabang</p>
                        <p className="text-xs text-muted-foreground">Nomor utama untuk koordinasi tim.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <Clock3 className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Operating hours</p>
                        <p className="text-xs text-muted-foreground">Disimpan untuk baseline onboarding.</p>
                    </div>
                </div>

                <div className="mt-6">
                    <BranchOnboardingForm
                        organizationId={orgId}
                        mode={orgRow?.mode ?? "single"}
                    />
                </div>
            </section>
        </div>
    );
}
