import { AuthLayoutShell } from "@/components/auth/auth-layout-shell";

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutShell maxWidth="max-w-2xl">
            {children}
        </AuthLayoutShell>
    );
}
