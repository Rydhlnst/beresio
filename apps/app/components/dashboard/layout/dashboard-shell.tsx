"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@repo/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { UpgradeBanner } from "./upgrade-banner";
import type { OrgSwitcherItem } from "./org-switcher";
import type { NavItem } from "./nav-config";

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
    navItems: NavItem[];
}

export function DashboardShell({
    children,
    organizationName,
    user,
    plan,
    organizations,
    activeOrganizationId,
    navItems,
}: DashboardShellProps) {
    const [isBannerVisible, setIsBannerVisible] = useState(plan === "starter");
    const bannerHeight = isBannerVisible ? 40 : 0;

    // Update CSS variable when banner visibility changes
    useEffect(() => {
        document.documentElement.style.setProperty('--banner-height', `${bannerHeight}px`);
        
        return () => {
            document.documentElement.style.setProperty('--banner-height', '0px');
        };
    }, [bannerHeight]);

    return (
        <div className="flex min-h-screen flex-col">
            {/* Banner at the very top */}
            <UpgradeBanner 
                plan={plan} 
                onDismiss={() => setIsBannerVisible(false)}
            />
            
            {/* Main layout */}
            <div className="flex flex-1">
                <SidebarProvider className="flex-1">
                    <AppSidebar
                        organizations={organizations}
                        activeOrganizationId={activeOrganizationId}
                        navItems={navItems}
                    />
                    <SidebarInset className="overflow-hidden bg-background/50">
                        <DashboardHeader
                            organizationName={organizationName}
                            user={user}
                        />
                        <main className="flex-1 overflow-y-auto bg-background">
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
