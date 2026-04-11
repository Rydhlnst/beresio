import { redirect } from "next/navigation";
import { resolveCanonicalBranchPathByBranchId, resolveDashboardRoutingTarget } from "@/lib/dashboard-routing.server";

type BranchLegacyDetailPageProps = {
    params: Promise<{ branchId: string }>;
};

export async function generateMetadata({ params }: BranchLegacyDetailPageProps) {
    const { branchId } = await params;
    return {
        title: `Branch ${branchId}`,
        description: "Legacy route redirect ke branch dashboard canonical.",
    };
}

export default async function BranchLegacyDetailPage({ params }: BranchLegacyDetailPageProps) {
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
