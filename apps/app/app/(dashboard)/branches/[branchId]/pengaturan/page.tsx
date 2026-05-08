import { redirect } from "next/navigation";
import { resolveCanonicalBranchPathByBranchId, resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

type BranchLegacySettingsPageProps = {
    params: Promise<{ branchId: string }>;
};

export async function generateMetadata({ params }: BranchLegacySettingsPageProps) {
    const { branchId } = await params;
    return {
        title: `Pengaturan Cabang ${branchId}`,
        description: "Legacy route redirect ke branch dashboard canonical.",
    };
}

export default async function BranchLegacySettingsPage({ params }: BranchLegacySettingsPageProps) {
    const { branchId } = await params;
    const canonicalPath = await resolveCanonicalBranchPathByBranchId(branchId);
    if (!canonicalPath) {
        const routing = await resolveDashboardRoutingTarget();
        if (!routing) {
            redirect("/login");
        }
        redirect(routing.targetPath);
    }

    redirect(canonicalPath);
}
