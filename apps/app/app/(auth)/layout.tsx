import type { Metadata } from "next";
import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutShell>
            {children}
        </AuthLayoutShell>
    );
}
