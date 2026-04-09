"use client";

import Link from "next/link";
import { Button } from "@repo/ui/button";
import { useSession } from "@/lib/auth-client";
import ProfileDropdown from "./ProfileDropdown";

type NavbarAuthIslandProps = {
    mobile?: boolean;
};

export function NavbarAuthIsland({ mobile = false }: NavbarAuthIslandProps) {
    const { data: session, isPending } = useSession();

    if (mobile) {
        if (isPending) {
            return <div className="h-20 animate-pulse rounded-lg bg-secondary/70" />;
        }

        if (session) {
            return (
                <div className="mt-8 grid gap-2.5">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                    </Button>
                </div>
            );
        }

        return (
            <div className="mt-8 grid gap-2.5">
                <Button variant="outline" asChild>
                    <Link href="/sign-in">Masuk</Link>
                </Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href="/wishlist">Coba Gratis</Link>
                </Button>
            </div>
        );
    }

    if (isPending) {
        return <div className="hidden h-10 w-24 animate-pulse bg-secondary md:block" />;
    }

    if (session) {
        return (
            <ProfileDropdown
                data={{
                    name: session.user.name,
                    email: session.user.email,
                    avatar: session.user.image || "",
                }}
            />
        );
    }

    return (
        <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
                <Link href="/sign-in">Masuk</Link>
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/wishlist">Coba Gratis</Link>
            </Button>
        </div>
    );
}
