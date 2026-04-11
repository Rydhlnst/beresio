"use server";

import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function getCookieHeader() {
    return (await headers()).get("cookie") || "";
}

async function fetchOrganization() {
    const cookie = await getCookieHeader();
    const res = await (apiClient as any).api.dashboard.organization.$get(undefined, {
        headers: { cookie },
    });

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json().catch(() => null);
    return { ok: true as const, data: (body as any)?.data };
}

export async function updateOrganizationModeAction(mode: "single" | "multi"): Promise<ActionResult<any>> {
    const cookie = await getCookieHeader();
    const res = await (apiClient as any).api.dashboard.organization.$patch(
        { json: { mode } },
        { headers: { cookie } }
    );

    const body = await res.json().catch(() => null);
    if (!res.ok || !(body as any)?.success) {
        return {
            ok: false,
            error: (body as any)?.error?.message || "Gagal memperbarui mode organisasi.",
        };
    }

    return { ok: true, data: (body as any)?.data };
}

export async function updateOnboardingMetadataAction(
    patch: Record<string, unknown>
): Promise<ActionResult<any>> {
    const orgResult = await fetchOrganization();
    if (!orgResult.ok) {
        return { ok: false, error: "Gagal mengambil data organisasi." };
    }

    const currentMetadata =
        orgResult.data?.metadata && typeof orgResult.data.metadata === "object"
            ? (orgResult.data.metadata as Record<string, unknown>)
            : {};
    const currentOnboarding =
        currentMetadata.onboarding && typeof currentMetadata.onboarding === "object"
            ? (currentMetadata.onboarding as Record<string, unknown>)
            : {};

    const cookie = await getCookieHeader();
    const res = await (apiClient as any).api.dashboard.organization.$patch(
        {
            json: {
                metadata: {
                    ...currentMetadata,
                    onboarding: {
                        ...currentOnboarding,
                        ...patch,
                    },
                },
            },
        },
        { headers: { cookie } }
    );

    const body = await res.json().catch(() => null);
    if (!res.ok || !(body as any)?.success) {
        return {
            ok: false,
            error: (body as any)?.error?.message || "Gagal memperbarui metadata onboarding.",
        };
    }

    return { ok: true, data: (body as any)?.data };
}
