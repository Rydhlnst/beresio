export type BusinessType = "laundry" | "fnb" | "retail";

export type BusinessNavItem = {
    id: string;
    label: string;
    icon: string;
    path: string;
    badge?: string | null;
    submenu?: BusinessNavItem[];
};

export type BusinessNavResponse = {
    business: {
        id: string;
        name: string;
        type: BusinessType;
        config: Record<string, unknown>;
    };
    role?: {
        id: string;
        slug: string;
        name: string;
    } | null;
    navigationBase?: BusinessNavItem[];
    navigationVertical?: BusinessNavItem[];
    navigation: BusinessNavItem[];
    permissions: string[];
};

export type PrimaryModule = Pick<BusinessNavItem, "id" | "label" | "path">;

export type OrganizationSummary = {
    id: string;
    name: string;
    businessType?: string | null;
};

const BUSINESS_TYPE_ALIASES: Record<string, BusinessType> = {
    caffe: "fnb",
    food: "fnb",
    service: "retail",
    other: "retail",
};

const KNOWN_BUSINESS_TYPES: BusinessType[] = ["laundry", "fnb", "retail"];

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787";

function trimTrailingSlash(input: string) {
    return input.replace(/\/+$/, "");
}

async function readJsonBodySafe<T>(response: Response): Promise<{ data: T | null; rawText: string }> {
    const rawText = await response.text();
    if (!rawText) return { data: null, rawText: "" };

    try {
        return { data: JSON.parse(rawText) as T, rawText };
    } catch {
        return { data: null, rawText };
    }
}

export function normalizeBusinessType(input: string | null | undefined): BusinessType {
    if (input === "laundry" || input === "fnb" || input === "retail") return input;
    if (!input) return "retail";
    return BUSINESS_TYPE_ALIASES[input] ?? "retail";
}

export function isBusinessType(input: string | null | undefined): input is BusinessType {
    if (!input) return false;
    return KNOWN_BUSINESS_TYPES.includes(input as BusinessType);
}

export function pickActiveOrganization(
    organizations: OrganizationSummary[],
    activeOrganizationId: string | null | undefined
) {
    if (organizations.length === 0) return null;
    if (!activeOrganizationId) return organizations[0] ?? null;
    return organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0] ?? null;
}

export async function fetchBusinessNavigation(businessId: string) {
    const url = `${trimTrailingSlash(API_BASE_URL)}/api/businesses/${businessId}/navigation`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                accept: "application/json",
            },
            credentials: "include",
        });

        const { data: body, rawText } = await readJsonBodySafe<{
            data?: BusinessNavResponse;
            error?: { message?: string };
        }>(response);

        if (response.ok && body?.data) {
            return {
                data: body.data,
                status: response.status,
                errorMessage: null as string | null,
            };
        }

        const fallbackMessage = body?.error?.message
            || rawText.slice(0, 240)
            || `Request failed with status ${response.status}`;

        return {
            data: null as BusinessNavResponse | null,
            status: response.status,
            errorMessage: fallbackMessage,
        };
    } catch (error) {
        return {
            data: null as BusinessNavResponse | null,
            status: 0,
            errorMessage: error instanceof Error ? error.message : "Failed to reach backend API",
        };
    }
}

export function pickPrimaryModule(navData: BusinessNavResponse | null | undefined): PrimaryModule | null {
    if (!navData) return null;
    const fromVertical = navData.navigationVertical?.[0];
    if (fromVertical) return { id: fromVertical.id, label: fromVertical.label, path: fromVertical.path };

    const fromAll = navData.navigation?.[0];
    if (fromAll) return { id: fromAll.id, label: fromAll.label, path: fromAll.path };

    return null;
}
