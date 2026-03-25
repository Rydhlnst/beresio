import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { Metadata } from "next";
import { KPIStrip } from "@/components/dashboard/kpi-strip/kpi-strip";
import { RevenueTrendChart } from "@/components/dashboard/performance/revenue-trend-chart";
import { RevenueBranchChart } from "@/components/dashboard/performance/revenue-branch-chart";
import { RecentOrdersPanel } from "@/components/dashboard/operations/recent-orders-panel";
import { AlertsPanel } from "@/components/dashboard/operations/alerts-panel";
import { OperationsStatusCard } from "@/components/dashboard/operations/operations-status-card";
import { RBACOverviewCard } from "@/components/dashboard/rbac-overview/rbac-overview-card";

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
        <div className="space-y-6">
            <DashboardGreeting name={userName} />
            
            {/* Row 1: KPI Cards */}
            <div className="w-full">
                <KPIStrip />
            </div>

            {/* Row 2: Charts Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2">
                    <RevenueTrendChart />
                </div>
                <div>
                    <RevenueBranchChart />
                </div>
            </div>

            {/* Row 3: Operational Panel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2">
                    <RecentOrdersPanel />
                </div>
                <div className="space-y-6">
                    <AlertsPanel />
                    <OperationsStatusCard organizationId={activeOrganizationId} />
                </div>
            </div>
        </div>
    );
}
