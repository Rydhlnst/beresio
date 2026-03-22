"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

type CreateBranchInput = {
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    isActive?: boolean;
};

export async function createBranchAction(input: CreateBranchInput) {
    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.branches.$post(
        { json: input },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}
