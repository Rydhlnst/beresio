import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { Mail, Shield, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { branches, createDbNextjs } from "@beresio/db";
import { apiClient } from "@/lib/api-client";
import { TeamOnboardingForm } from "./_components/team-onboarding-form";

export const metadata = {
    title: "Invite Team",
    description: "Undang anggota tim (opsional) sebelum masuk dashboard.",
};

export default async function OnboardingTeamPage() {
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

    const branchCountRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(branches)
        .where(eq(branches.organizationId, orgId));

    const hasBranch = Number(branchCountRows[0]?.count ?? 0) > 0;
    if (!hasBranch) {
        redirect("/onboarding/branch");
    }

    const cookie = reqHeaders.get("cookie") || "";
    const [rolesRes, branchesRes] = await Promise.all([
        (apiClient as any).api.dashboard.team.roles.$get(undefined, { headers: { cookie } }),
        (apiClient as any).api.dashboard.branches.$get(undefined, { headers: { cookie } }),
    ]);

    const rolesBody = rolesRes.ok ? await rolesRes.json().catch(() => null) : null;
    const branchesBody = branchesRes.ok ? await branchesRes.json().catch(() => null) : null;
    const roles = ((rolesBody as any)?.data ?? []) as Array<{ id: string; name: string; slug: string }>;
    const branchItems = Array.isArray((branchesBody as any)?.data)
        ? ((branchesBody as any)?.data as Array<{ id: string; name: string; code: string }>)
        : ((((branchesBody as any)?.data?.data ?? []) as Array<{ id: string; name: string; code: string }>));

    return (
        <div className="flex h-full w-full items-center justify-center overflow-hidden">
            <section className="w-full max-w-[760px] rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Step 4</p>
                    <h2 className="text-2xl font-semibold leading-tight text-foreground">Undang tim (opsional)</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        Undang anggota tim sekarang, atau lewati dan tambahkan nanti dari menu Tim.
                    </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <Mail className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Undangan email</p>
                        <p className="text-xs text-muted-foreground">Kirim invite ke anggota tim inti.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <Shield className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Role-based access</p>
                        <p className="text-xs text-muted-foreground">Pilih role akses saat invite.</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <Users className="h-4 w-4 text-primary" />
                        <p className="mt-2 text-sm font-semibold text-foreground">Bisa skip</p>
                        <p className="text-xs text-muted-foreground">Masuk dashboard sekarang dan lanjut nanti.</p>
                    </div>
                </div>

                <div className="mt-6">
                    <TeamOnboardingForm roles={roles} branches={branchItems} />
                </div>
            </section>
        </div>
    );
}
