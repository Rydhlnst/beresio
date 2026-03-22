import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { OrgOnboardingForm } from "./_components/org-onboarding-form";

export const metadata = {
    title: "Daftarkan Usaha | Beres",
    description: "Lengkapi data usaha utama kamu untuk mulai menggunakan Beres",
};

/**
 * Onboarding Organization Page
 * 
 * STRICT RULE: This page is ONLY for users who have NO organizations.
 * If user has any organization, they are redirected to dashboard.
 * For creating additional organizations after the first one, use /dashboard/organizations/new
 */
export default async function OnboardingOrgPage() {
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);

    const session = await authInstance.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    const orgData = await authInstance.api.listOrganizations({
        headers: await headers(),
    });

    const hasOrg = orgData && orgData.length > 0;

    // STRICT: If user has ANY organization, redirect to dashboard immediately
    // They cannot create first org via this page
    if (hasOrg) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6 w-full px-4">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Daftarkan Usaha Utama</h1>
                <p className="text-muted-foreground">
                    Tulis nama usaha utama kamu sebelum menambahkan cabang
                </p>
            </div>
            <OrgOnboardingForm />
        </div>
    );
}
