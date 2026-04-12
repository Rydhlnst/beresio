"use client";

import { useState } from "react";
import { SidebarProvider, SidebarInset } from "@repo/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { UpgradeBanner } from "./upgrade-banner";
import { FnbLiveRefreshClient } from "../realtime/fnb-live-refresh-client";
import type { OrgSwitcherItem } from "./org-switcher";
import type { BusinessNavItem } from "./nav-config";

interface DashboardShellProps {
    children: React.ReactNode;
    organizationName: string;
    roleName?: string | null;
    permissions?: string[];
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
    roleName,
    permissions,
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
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);
    
    // Banner is shown only for starter plan and if not dismissed
    const showBanner = plan === "starter" && !isBannerDismissed;
    const bannerHeight = showBanner ? "40px" : "0px";

    return (
        <div 
            className="min-h-screen flex flex-col bg-secondary/30"
            style={{ "--banner-height": bannerHeight } as React.CSSProperties}
        >
            {/* Banner at the very top */}
            <UpgradeBanner 
                plan={plan} 
                onDismiss={() => setIsBannerDismissed(true)} 
            />
            
            {/* Main layout with sidebar below banner */}
            <div className="flex-1 flex overflow-hidden">
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
                    <SidebarInset className="flex-1 overflow-hidden bg-secondary/25">
                        <FnbLiveRefreshClient businessType={businessType} />
                        <DashboardHeader
                            organizationName={organizationName}
                            roleName={roleName ?? null}
                            user={user}
                            navItems={navItems}
                            navBaseItems={navBaseItems}
                            navVerticalItems={navVerticalItems}
                            permissions={permissions}
                        />
                        <main
                            className="overflow-y-auto bg-transparent"
                            style={{ minHeight: `calc(100vh - ${bannerHeight} - 64px)` }}
                        >
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
