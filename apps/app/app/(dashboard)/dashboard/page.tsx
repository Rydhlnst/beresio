import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { Metadata } from "next";
import { KPIStrip } from "@/components/dashboard/kpi-strip/kpi-strip";
import { RevenueTrendChart } from "@/components/dashboard/performance/revenue-trend-chart";
import { RevenueBranchChart } from "@/components/dashboard/performance/revenue-branch-chart";
import { RBACOverviewCard } from "@/components/dashboard/rbac-overview/rbac-overview-card";
import { BillingPanelCard } from "@/components/dashboard/billing/billing-panel-card";
import { ActivityFeedCard } from "@/components/dashboard/activity-feed/activity-feed-card";
import { DashboardHighlightCard } from "@/components/dashboard/overview/dashboard-highlight-card";
import { OperationsStatusCard } from "@/components/dashboard/operations/operations-status-card";

export const metadata: Metadata = {
    title: "Dashboard | Beres",
    description: "Pantau bisnis laundry kamu secara real-time",
};

function DashboardGreeting({ name }: { name: string }) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Selamat pagi" : hour < 18 ? "Selamat siang" : "Selamat malam";

    return (
        <div className="flex items-end justify-between mb-4 gap-4">
            <div>
                <h1 className="text-xl font-semibold text-foreground tracking-tight">
                    {greeting}, {name.split(" ")[0]}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Ini ringkasan bisnis kamu hari ini.
                </p>
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL is missing from environment");
    
    const db = createDbNextjs(dbUrl);
    const session = await auth(db).api.getSession({ 
        headers: await headers() 
    });
    
    const userName = session?.user?.name ?? "Owner";
    const activeOrganizationId = (session as any)?.activeOrganizationId ?? null;

    return (
        <div className="space-y-4">
            <DashboardGreeting name={userName} />
            <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
                <div className="min-w-0 lg:col-span-2 h-full">
                    <KPIStrip />
                </div>
                <div className="h-full">
                    <DashboardHighlightCard />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch">
                <div className="grid gap-4 lg:col-span-2 lg:auto-rows-fr">
                    <div className="h-full">
                        <RevenueTrendChart />
                    </div>
                    <div className="h-full">
                        <RevenueBranchChart />
                    </div>
                    <div className="h-full">
                        <ActivityFeedCard />
                    </div>
                </div>
                <div className="grid gap-4 lg:auto-rows-fr">
                    <div className="h-full">
                        <OperationsStatusCard organizationId={activeOrganizationId} />
                    </div>
                    <div className="h-full">
                        <RBACOverviewCard />
                    </div>
                    <div className="h-full">
                        <BillingPanelCard />
                    </div>
                </div>
            </div>
        </div>
    );
}
