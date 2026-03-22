"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

export type UpdateCustomerInput = {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
};

export async function updateCustomerAction(customerId: string, input: UpdateCustomerInput) {
    const cookie = (await cookies()).toString();
    const res = await (apiClient as any).api.dashboard.customers[":id"].$patch(
        { param: { id: customerId }, json: input },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}
