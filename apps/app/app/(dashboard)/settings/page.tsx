import { Metadata } from "next";
import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { SettingsPageClient } from "./_components/settings-page-client";
import { PageErrorState } from "@/components/dashboard/shared/page-error-state";
import { ErrorRetryAction } from "@/components/dashboard/shared/error-retry-action";
import { ErrorToast } from "@/components/dashboard/shared/error-toast";
import { auth } from "@/lib/auth";
import { createDbNextjs, member, roles } from "@beresio/db";
import { and, eq } from "drizzle-orm";

export const metadata: Metadata = {
    title: "Settings | Beres",
    description: "Konfigurasi organisasi dan integrasi",
};

type OrganizationData = {
    id: string;
    name: string;
    slug?: string | null;
    businessType?: string | null;
    subscriptionPlan?: string | null;
    logoUrl?: string | null;
    metadata?: unknown;
};

type BillingData = {
    plan?: string | null;
    usage?: {
        branches?: { current: number; limit: number | null };
        members?: { current: number; limit: number | null };
    };
};

export default async function SettingsPage() {
    const reqHeaders = await headers();
    const cookie = reqHeaders.get("cookie") || "";
    const db = createDbNextjs(process.env.DATABASE_URL!);
    const authInstance = auth(db);
    const session = await authInstance.api.getSession({ headers: reqHeaders });

    const [orgRes, billingRes] = await Promise.all([
        apiClient.api.dashboard.organization.$get(undefined, {
            headers: { cookie },
        }),
        apiClient.api.dashboard.billing.status.$get(undefined, {
            headers: { cookie },
        }),
    ]);

    if (!orgRes.ok || !billingRes.ok) {
        if (!orgRes.ok) console.error("Failed to fetch organization:", await orgRes.text());
        if (!billingRes.ok) console.error("Failed to fetch billing status:", await billingRes.text());
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Konfigurasi organisasi dan integrasi.
                    </p>
                </div>
                <ErrorToast
                    id="page-settings-error"
                    title="Gagal memuat pengaturan"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <PageErrorState
                    title="Gagal memuat pengaturan"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </div>
        );
    }

    const orgBody = (await orgRes.json()) as { data?: OrganizationData };
    const billingBody = (await billingRes.json()) as { data?: BillingData };

    const organization = orgBody?.data ?? null;
    const billing = billingBody?.data ?? null;

    let isOwner = false;
    if (session && organization?.id) {
        const [membership] = await db
            .select({
                role: member.role,
                roleSlug: roles.slug,
            })
            .from(member)
            .leftJoin(roles, eq(member.roleId, roles.id))
            .where(and(eq(member.organizationId, organization.id), eq(member.userId, session.user.id)))
            .limit(1);

        const roleLabel = (membership?.roleSlug ?? membership?.role ?? "").toLowerCase();
        isOwner = roleLabel === "owner";
    }

    return (
        <SettingsPageClient
            organization={organization}
            billing={billing}
            isOwner={isOwner}
        />
    );
}
