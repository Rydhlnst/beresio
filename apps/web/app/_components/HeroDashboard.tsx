import {
    DashboardAppMockup,
    type DashboardAppMockupProps,
    type DashboardBranch,
    type DashboardNavIconKey,
    type DashboardNavItem,
    type DashboardOpsItem,
    type DashboardOrder,
    type DashboardOrderStatus,
    type DashboardPreviewMode,
    type DashboardStat,
    type DashboardStatIconKey,
    type DashboardTrend,
    type DashboardAttentionItem,
} from "./DashboardAppMockup";

export type {
    DashboardTrend,
    DashboardPreviewMode,
    DashboardStatIconKey,
    DashboardOrderStatus,
    DashboardNavIconKey,
    DashboardStat,
    DashboardOrder,
    DashboardBranch,
    DashboardNavItem,
    DashboardAttentionItem,
    DashboardOpsItem,
};

export type HeroDashboardMockupProps = DashboardAppMockupProps;

export function HeroDashboardMockup(props: HeroDashboardMockupProps) {
    return <DashboardAppMockup {...props} />;
}

export function HeroDashboard() {
    return (
        <div className="pb-0">
            <DashboardAppMockup />
        </div>
    );
}
