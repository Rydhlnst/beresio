"use server";

import { cookies } from "next/headers";
import { apiClient } from "@/lib/api-client";

type ReportRange = "today" | "7d" | "30d" | "month" | "custom";

export async function getReportCatalogAction() {
    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.reports.catalog.$get(undefined, {
        headers: { cookie },
    });

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}

export async function getReportSummaryAction(params: {
    range?: ReportRange;
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
}) {
    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.reports.summary.$get(
        {
            query: {
                range: params.range,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
                branchId: params.branchId,
            },
        },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}

export async function getReportTableAction(params: {
    range?: ReportRange;
    dateFrom?: string;
    dateTo?: string;
}) {
    const cookie = cookies().toString();
    const res = await apiClient.api.dashboard.reports.table.$get(
        {
            query: {
                range: params.range,
                dateFrom: params.dateFrom,
                dateTo: params.dateTo,
            },
        },
        { headers: { cookie } }
    );

    if (!res.ok) {
        const message = await res.text();
        return { ok: false as const, error: message };
    }

    const body = await res.json();
    return { ok: true as const, data: (body as any).data };
}
