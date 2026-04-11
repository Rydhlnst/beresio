import {
    ACTIVE_BRANCH_COOKIE_KEY,
    ACTIVE_BRANCH_STORAGE_KEY,
} from "./active-branch-constants";

function normalizeBranchId(value?: string | null) {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function getActiveBranchClient() {
    if (typeof window === "undefined") return null;
    const stored = normalizeBranchId(window.localStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY));
    if (stored) return stored;

    const cookieValue = document.cookie
        .split(";")
        .map((chunk) => chunk.trim())
        .find((chunk) => chunk.startsWith(`${ACTIVE_BRANCH_COOKIE_KEY}=`))
        ?.split("=")[1];

    return normalizeBranchId(cookieValue ? decodeURIComponent(cookieValue) : null);
}

export function setActiveBranchClient(branchId?: string | null) {
    if (typeof window === "undefined") return;
    const normalized = normalizeBranchId(branchId);
    if (!normalized) return;

    window.localStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, normalized);
    document.cookie = `${ACTIVE_BRANCH_COOKIE_KEY}=${encodeURIComponent(normalized)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}
