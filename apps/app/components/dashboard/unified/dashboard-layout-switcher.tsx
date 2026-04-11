import { BranchDashboardContent } from "./branch-dashboard-content";
import { OrgDashboardContent } from "./org-dashboard-content";

type BranchContext = {
    branchId: string;
    branchCode: string;
    branchName: string;
    roleSlug: string | null;
    mode: "single" | "multi";
};

type OrgContext = {
    orgSlug: string;
    mode: "single" | "multi";
    isOrgLevelRole: boolean;
};

type DashboardLayoutSwitcherProps = {
    orgContext: OrgContext;
    branchContext?: BranchContext;
};

export function DashboardLayoutSwitcher({ orgContext, branchContext }: DashboardLayoutSwitcherProps) {
    const isOrgDashboard = orgContext.mode === "multi" && orgContext.isOrgLevelRole && !branchContext;

    if (isOrgDashboard) {
        return <OrgDashboardContent orgSlug={orgContext.orgSlug} />;
    }

    if (!branchContext) {
        return null;
    }

    return (
        <BranchDashboardContent
            branchId={branchContext.branchId}
            branchCode={branchContext.branchCode}
            branchName={branchContext.branchName}
            roleSlug={branchContext.roleSlug}
            mode={branchContext.mode}
        />
    );
}
