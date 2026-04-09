import type { Metadata } from "next";
import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";
import { BranchCreateWizardClient } from "./_components/branch-create-wizard-client";

export const metadata: Metadata = {
    title: "Tambah Cabang",
    description: "Buat cabang baru untuk organisasi.",
};

export default async function CabangNewPage() {
    const cookie = (await headers()).get("cookie") || "";
    const membersRes = await apiClient.api.dashboard.team.members.$get(undefined, {
        headers: { cookie },
    });

    let members: any[] = [];
    if (membersRes.ok) {
        const body = await membersRes.json().catch(() => null);
        const raw = (body as any)?.data ?? [];
        members = Array.isArray(raw) ? raw : raw?.data ?? [];
    } else {
        console.error("Failed to fetch team members:", await membersRes.text());
    }

    return <BranchCreateWizardClient members={members} />;
}
