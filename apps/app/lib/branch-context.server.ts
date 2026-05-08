import "server-only";
import { cookies } from "next/headers";
import { ACTIVE_BRANCH_COOKIE_KEY } from "./active-branch-constants";

type HeaderOptions = {
    branchId?: string | null;
    cookieStore?: Awaited<ReturnType<typeof cookies>>;
};

function normalizeBranchId(value?: string | null) {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export async function persistActiveBranchId(branchId?: string | null) {
    const normalized = normalizeBranchId(branchId);
    if (!normalized) return;
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BRANCH_COOKIE_KEY, normalized, {
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
    });
}

export async function getActiveBranchId(cookieStore?: Awaited<ReturnType<typeof cookies>>) {
    const store = cookieStore ?? (await cookies());
    return normalizeBranchId(store.get(ACTIVE_BRANCH_COOKIE_KEY)?.value ?? null);
}

export async function buildBranchScopedHeaders(options?: HeaderOptions): Promise<Record<string, string>> {
    const cookieStore = options?.cookieStore ?? (await cookies());
    const explicitBranchId = normalizeBranchId(options?.branchId);
    const activeBranchId = explicitBranchId ?? (await getActiveBranchId(cookieStore));

    const headers: Record<string, string> = {
        cookie: cookieStore.toString(),
    };

    if (activeBranchId) {
        headers["x-branch-id"] = activeBranchId;
    }

    return headers;
}
