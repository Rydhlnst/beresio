import { apiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import { RevenueTrendLazyClient } from "./revenue-trend-lazy-client";
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

export async function RevenueTrendChart() {
    const cookie = (await headers()).get("cookie") || "";

    // Fetch both 7D and 30D data
    const [res7d, res30d] = await Promise.all([
        apiClient.api.dashboard.performance.trend.$get({ query: { timeRange: "7d" } }, {
            headers: { cookie }
        }),
        apiClient.api.dashboard.performance.trend.$get({ query: { timeRange: "30d" } }, {
            headers: { cookie }
        })
    ]);

    const [{ data: data7d, rawText: raw7d }, { data: data30d, rawText: raw30d }] = await Promise.all([
        readJsonBodySafe<{ data?: unknown }>(res7d),
        readJsonBodySafe<{ data?: unknown }>(res30d),
    ]);

    const invalid7d = !res7d.ok || !data7d;
    const invalid30d = !res30d.ok || !data30d;

    if (invalid7d || invalid30d) {
        if (invalid7d) {
            const contentType = res7d.headers.get("content-type");
            const hint = detectHtmlInterception(contentType, raw7d);
            console.error(
                "Failed to fetch revenue trend (7d):",
                `status=${res7d.status}`,
                `contentType=${contentType ?? "unknown"}`,
                hint ? `hint=${hint}` : "",
                raw7d.slice(0, 280)
            );
        }

        if (invalid30d) {
            const contentType = res30d.headers.get("content-type");
            const hint = detectHtmlInterception(contentType, raw30d);
            console.error(
                "Failed to fetch revenue trend (30d):",
                `status=${res30d.status}`,
                `contentType=${contentType ?? "unknown"}`,
                hint ? `hint=${hint}` : "",
                raw30d.slice(0, 280)
            );
        }

        return (
            <SectionCard title="Tren Revenue" className="h-auto min-h-[320px]">
                <ErrorToast
                    id="dashboard-revenue-trend-error"
                    title="Gagal memuat data revenue"
                    description="Coba muat ulang halaman atau periksa koneksi."
                />
                <CardErrorState
                    title="Gagal memuat data revenue"
                    description="Coba muat ulang halaman atau periksa koneksi."
                    action={<ErrorRetryAction />}
                />
            </SectionCard>
        );
    }

    return (
        <RevenueTrendLazyClient
            initialData7d={(data7d as any)?.data || []}
            initialData30d={(data30d as any)?.data || []}
        />
    );
}
