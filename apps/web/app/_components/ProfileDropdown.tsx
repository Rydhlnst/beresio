"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";
import { LogOut, User, LayoutDashboard, Building, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";

interface Profile {
    name: string;
    email: string;
    avatar?: string | null;
}

interface MenuItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    roles?: string[];
    showIf?: boolean;
}

interface ProfileDropdownProps extends React.HTMLAttributes<HTMLDivElement> {
    data: Profile;
}

export default function ProfileDropdown({
    data,
    className,
    ...props
}: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const { data: session } = useSession();
    const userSession = session?.user;

    const allMenuItems: MenuItem[] = [
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard className="w-4 h-4" />,
        },
        // === USER LEVEL ===
        {
            label: "Profile",
            href: "/profile",          // nama, password, 2FA, sessions
            icon: <User className="w-4 h-4" />,
        },
        {
            label: "Preferences",
            href: "/profile/preferences", // notif, tema, bahasa — bukan "/settings"
            icon: <SlidersHorizontal className="w-4 h-4" />,
        },

        {
            label: "Switch Organization",
            href: "/organizations",
            icon: <Building className="w-4 h-4" />,
            showIf: (userSession as any)?.orgCount > 1,  // hidden jika 1 org
        },
    ];

    // Filter items based on logic
    const menuItems = allMenuItems.filter(item => {
        // 1. Check showIf
        if (item.showIf === false) return false;

        // 2. Check Roles (if specified)
        // Note: For now, if roles are specified, we might need to check active member role
        // For simplicity in this fix, we'll allow them if the info is not available or if it matches
        // If we want to be strict, we'd need session.session.activeOrganizationId and then find role

        return true;
    });

    const getInitials = (name: string) => {
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className={cn("relative", className)} {...props}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex items-center gap-3 p-1.5 pl-4 rounded-xl bg-background border border-input hover:border-border hover:bg-muted/50 transition-all duration-200 focus:outline-none shadow-sm"
                    >
                        <div className="text-left hidden sm:block max-w-[180px]">
                            <div className="text-sm font-semibold text-foreground truncate">
                                {data.name}
                            </div>
                            <div className="text-xs font-medium text-muted-foreground truncate">
                                {data.email}
                            </div>
                        </div>
                        <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-primary/80 to-primary p-[2px]">
                            <div className="w-full h-full rounded-full overflow-hidden bg-background">
                                {data.avatar ? (
                                    <Image
                                        src={data.avatar}
                                        alt={data.name}
                                        width={36}
                                        height={36}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm font-bold">
                                        {getInitials(data.name)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-60 p-2 bg-background border border-border shadow-md rounded-xl"
                >
                    <div className="space-y-0.5">
                        {menuItems.map((item) => (
                            <DropdownMenuItem key={item.label} asChild className="p-2.5 rounded-lg cursor-pointer focus:bg-muted">
                                <Link
                                    href={item.href}
                                    className="flex items-center gap-3 w-full group"
                                >
                                    <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {item.label}
                                    </span>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>

                    <DropdownMenuSeparator className="my-2 bg-border/50" />

                    <div className="p-0.5">
                        <DropdownMenuItem asChild className="p-2.5 rounded-lg cursor-pointer bg-destructive/5 text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10">
                            <button
                                type="button"
                                onClick={async () => {
                                    await signOut({
                                        fetchOptions: {
                                            onSuccess: () => {
                                                window.location.href = "/sign-in";
                                            },
                                        },
                                    });
                                }}
                                className="w-full flex items-center gap-3"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-semibold">
                                    Sign Out
                                </span>
                            </button>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
