"use server";

import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";

type BootstrapResult =
    | { ok: true; data: unknown }
    | { ok: false; error: string };

export async function bootstrapRbacForActiveOrg(): Promise<BootstrapResult> {
    const res = await apiClient.api.dashboard.rbac.bootstrap.$post(undefined, {
        headers: {
            cookie: (await headers()).get("cookie") || "",
        },
    });

    if (!res.ok) {
        const message = await res.text().catch(() => "");
        return { ok: false, error: message || "RBAC bootstrap failed" };
    }

    const body = await res.json().catch(() => null);
    return { ok: true, data: (body as any)?.data ?? null };
}
