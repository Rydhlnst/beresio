import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { RevenueBranchLazyClient } from "./revenue-branch-lazy-client";
import { SectionCard } from "../shared/section-card";
import { CardErrorState } from "../shared/card-error-state";
import { ErrorRetryAction } from "../shared/error-retry-action";
import { ErrorToast } from "../shared/error-toast";

async function readJsonBodySafe<T>(response: Response): Promise<{ data: T | null; rawText: string }> {
    const rawText = await response.text();
    if (!rawText) return { data: null, rawText: "" };

    try {
        return { data: JSON.parse(rawText) as T, rawText };
    } catch {
        return { data: null, rawText };
    }
}

function detectHtmlInterception(contentType: string | null, rawText: string): string | null {
    const sample = `${contentType ?? ""}\n${rawText.slice(0, 600)}`.toLowerCase();
    const looksLikeHtml = sample.includes("text/html") || sample.includes("<!doctype html");
    if (!looksLikeHtml) return null;
    if (sample.includes("malwarebytes")) return "Likely intercepted by Malwarebytes Web Protection";
    return "Expected JSON API response but received HTML";
}

export async function RevenueBranchChart() {
    const cookie = (await headers()).get("cookie") || "";

    const res = await apiClient.api.dashboard.performance.branches.$get(undefined, {
        headers: { cookie }
    });

    const { data: body, rawText } = await readJsonBodySafe<{ data?: unknown }>(res);
    const invalidBody = !res.ok || !body;

    if (invalidBody) {
        const contentType = res.headers.get("content-type");
        const hint = detectHtmlInterception(contentType, rawText);
        console.error(
            "Failed to fetch revenue per branch:",
            `status=${res.status}`,
            `contentType=${contentType ?? "unknown"}`,
            hint ? `hint=${hint}` : "",
            rawText.slice(0, 280)
        );
        return (
            <SectionCard title="Revenue per Cabang" className="h-auto min-h-[320px]">
                <ErrorToast
                    id="dashboard-revenue-branch-error"
                    title="Gagal memuat data cabang"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <CardErrorState
                    title="Gagal memuat data cabang"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </SectionCard>
        );
    }

    return <RevenueBranchLazyClient data={(body as any)?.data || []} />;
}
