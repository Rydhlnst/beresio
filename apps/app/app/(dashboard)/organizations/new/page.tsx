import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { CreateOrgForm } from "./_components/create-org-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tambah Organisasi Baru",
    description: "Buat organisasi baru untuk bisnis tambahan kamu",
};

/**
 * Create Additional Organization Page
 * 
 * This page is for users who already have at least one organization
 * and want to create additional organizations.
 * 
 * Access rules:
 * - Must be authenticated
 * - Must have at least one existing organization
 * - If no organization exists, redirect to /onboarding/org (first org flow)
 */
export default async function CreateOrganizationPage() {
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

    // If user has NO organization, they must use the onboarding flow first
    if (!hasOrg) {
        redirect("/onboarding/org");
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <div className="space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight">Tambah Organisasi Baru</h1>
                    <p className="text-muted-foreground">
                        Buat organisasi baru untuk mengelola bisnis tambahan kamu
                    </p>
                </div>
                <CreateOrgForm />
            </div>
        </div>
    );
}
