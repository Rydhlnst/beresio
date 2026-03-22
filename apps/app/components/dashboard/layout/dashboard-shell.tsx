import { SidebarProvider, SidebarInset } from "@repo/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { UpgradeBanner } from "./upgrade-banner";
import type { OrgSwitcherItem } from "./org-switcher";
import type { BusinessNavItem } from "./nav-config";

interface DashboardShellProps {
    children: React.ReactNode;
    organizationName: string;
    user: {
        name: string;
        email: string;
        avatar?: string | null;
    };
    plan: string;
    organizations: OrgSwitcherItem[];
    activeOrganizationId?: string | null;
    navItems: BusinessNavItem[];
    navBaseItems?: BusinessNavItem[];
    navVerticalItems?: BusinessNavItem[];
    isNavLoading?: boolean;
    businessName?: string | null;
    businessType?: string | null;
}

export function DashboardShell({
    children,
    organizationName,
    user,
    plan,
    organizations,
    activeOrganizationId,
    navItems,
    navBaseItems,
    navVerticalItems,
    isNavLoading,
    businessName,
    businessType,
}: DashboardShellProps) {
    return (
        <div className="min-h-screen">
            {/* Banner at the very top */}
            <UpgradeBanner plan={plan} />
            
            {/* Main layout with sidebar below banner */}
            <div className="flex">
                <SidebarProvider className="flex w-full">
                    <AppSidebar
                        organizations={organizations}
                        activeOrganizationId={activeOrganizationId}
                        navItems={navItems}
                        navBaseItems={navBaseItems}
                        navVerticalItems={navVerticalItems}
                        isNavLoading={isNavLoading}
                        businessName={businessName}
                        businessType={businessType}
                    />
                    <SidebarInset className="flex-1 overflow-hidden bg-background/50">
                        <DashboardHeader
                            organizationName={organizationName}
                            user={user}
                        />
                        <main className="overflow-y-auto bg-background" style={{ minHeight: 'calc(100vh - 40px - 64px)' }}>
                            <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1400px] p-4 lg:p-6">
                                {children}
                            </div>
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </div>
        </div>
    );
}
