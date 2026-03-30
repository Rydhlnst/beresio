"use server";

import { headers } from "next/headers";
import { apiClient } from "@/lib/api-client";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
type MemberMutationPayload = {
    id: string;
    roleId?: string | null;
    role?: string | null;
    roleName?: string | null;
    status?: string | null;
};

type InviteMutationPayload = {
    id: string;
    email: string;
    status?: string | null;
    sentAt?: string | Date | null;
    role?: string | null;
    roleName?: string | null;
    branch?: { id: string; name: string } | null;
};

async function getCookieHeader() {
    return (await headers()).get("cookie") || "";
}

async function parseResult<T>(res: Response): Promise<ActionResult<T>> {
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.success) {
        return {
            ok: false,
            error: body?.error?.message || "Permintaan gagal. Coba lagi.",
        };
    }
    return { ok: true, data: body.data as T };
}

export async function updateMemberRoleAction(memberId: string, roleId: string) {
    const cookie = await getCookieHeader();
    const res = await apiClient.api.dashboard.team.members[":id"].role.$patch(
        {
            param: { id: memberId },
            json: { roleId },
        },
        {
            headers: { cookie },
        }
    );

    return parseResult<MemberMutationPayload>(res);
}

// ============================================
// ROLE ACTIONS
// ============================================

export async function createRoleAction(input: {
    name: string;
    slug?: string;
    description?: string;
    permissions?: string[];
}) {
    const cookie = await getCookieHeader();
    const res = await apiClient.api.dashboard.team.roles.$post(
        {
            json: {
                name: input.name,
                slug: input.slug,
                description: input.description,
                permissions: input.permissions || [],
            },
        },
        {
            headers: { cookie },
        }
    );

    return parseResult<Record<string, unknown>>(res);
}

export async function updateMemberStatusAction(memberId: string, status: "active" | "inactive") {
    const cookie = await getCookieHeader();
    const res = await apiClient.api.dashboard.team.members[":id"].status.$patch(
        {
            param: { id: memberId },
            json: { status },
        },
        {
            headers: { cookie },
        }
    );

    return parseResult<MemberMutationPayload>(res);
}

export async function resendInviteAction(inviteId: string) {
    const cookie = await getCookieHeader();
    const res = await apiClient.api.dashboard.team.invitations[":id"].resend.$post(
        {
            param: { id: inviteId },
        },
        {
            headers: { cookie },
        }
    );

    return parseResult<InviteMutationPayload>(res);
}

export async function cancelInviteAction(inviteId: string) {
    const cookie = await getCookieHeader();
    const res = await apiClient.api.dashboard.team.invitations[":id"].cancel.$post(
        {
            param: { id: inviteId },
        },
        {
            headers: { cookie },
        }
    );

    return parseResult<InviteMutationPayload>(res);
}

export async function createInviteAction(input: {
    email: string;
    roleId?: string;
    branchId?: string;
}) {
    const cookie = await getCookieHeader();
    const res = await apiClient.api.dashboard.team.invitations.$post(
        {
            json: {
                email: input.email,
                roleId: input.roleId || undefined,
                branchId: input.branchId || undefined,
            },
        },
        {
            headers: { cookie },
        }
    );

    return parseResult<InviteMutationPayload>(res);
}

export async function assignMemberToBranchAction(input: {
    memberId: string;
    branchId: string;
    isPrimary?: boolean;
    remove?: boolean;
}) {
    const cookie = await getCookieHeader();
    const res = await apiClient.api.dashboard.team.members[":id"].branches.$post(
        {
            param: { id: input.memberId },
            json: {
                branchId: input.branchId,
                isPrimary: input.isPrimary ?? false,
                remove: input.remove ?? false,
            },
        },
        {
            headers: { cookie },
        }
    );

    return parseResult<Record<string, unknown>>(res);
}
