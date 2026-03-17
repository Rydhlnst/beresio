import { Metadata } from "next";
import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { TeamAccessPageClient } from "./_components/team-access-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { ErrorToast } from "@/components/dashboard/shared/error-toast";

export const metadata: Metadata = {
    title: "Tim & Akses | Beres",
    description: "Kelola user, role, dan undangan",
};

export default async function TimPage() {
    const cookie = (await headers()).get("cookie") || "";

    const [membersRes, rolesRes, invitesRes, branchesRes] = await Promise.all([
        apiClient.api.dashboard.team.members.$get(undefined, {
            headers: { cookie },
        }),
        apiClient.api.dashboard.team.roles.$get(undefined, {
            headers: { cookie },
        }),
        apiClient.api.dashboard.team.invitations.$get(undefined, {
            headers: { cookie },
        }),
        apiClient.api.dashboard.branches.$get(undefined, {
            headers: { cookie },
        }),
    ]);

    if (!membersRes.ok || !rolesRes.ok || !invitesRes.ok || !branchesRes.ok) {
        if (!membersRes.ok) console.error("Failed to fetch team members:", await membersRes.text());
        if (!rolesRes.ok) console.error("Failed to fetch team roles:", await rolesRes.text());
        if (!invitesRes.ok) console.error("Failed to fetch team invites:", await invitesRes.text());
        if (!branchesRes.ok) console.error("Failed to fetch branches:", await branchesRes.text());

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Tim & Akses</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kelola user, role, dan undangan dalam satu tempat.
                    </p>
                </div>
                <ErrorToast
                    id="page-team-error"
                    title="Gagal memuat data tim"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <PageErrorState
                    title="Gagal memuat data tim"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const membersBody = membersRes.ok ? await membersRes.json() : null;
    const rolesBody = rolesRes.ok ? await rolesRes.json() : null;
    const invitesBody = invitesRes.ok ? await invitesRes.json() : null;
    const branchesBody = branchesRes.ok ? await branchesRes.json() : null;

    return (
        <TeamAccessPageClient
            members={(membersBody as any)?.data || []}
            roles={(rolesBody as any)?.data || []}
            invites={(invitesBody as any)?.data || []}
            branches={(branchesBody as any)?.data || []}
        />
    );
}
