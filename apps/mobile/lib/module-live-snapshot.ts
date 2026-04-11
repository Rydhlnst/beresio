import type { BusinessType } from "@/lib/business-navigation";

type Primitive = string | number | boolean | null | undefined;

export type SnapshotRow = {
  label: string;
  value: string;
};

export type ModuleLiveSnapshot = {
  endpoint: string;
  rows: SnapshotRow[];
  fetchedAt: string;
  previewText: string;
};

type SnapshotInput = {
  businessType: BusinessType;
  moduleId: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787";

function trimTrailingSlash(input: string) {
  return input.replace(/\/+$/, "");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatCurrency(value: number) {
  return `Rp ${formatNumber(value)}`;
}

function toPreviewText(value: unknown) {
  try {
    const text = JSON.stringify(value, null, 2);
    return text.length > 420 ? `${text.slice(0, 420)}...` : text;
  } catch {
    return String(value);
  }
}

function getSnapshotEndpoint({ businessType, moduleId }: SnapshotInput) {
  switch (moduleId) {
    case "dashboard":
      return businessType === "laundry"
        ? "/api/dashboard/laundry/reports/summary"
        : "/api/dashboard/kpis";
    case "crm":
      return "/api/dashboard/customers?limit=5";
    case "order":
      return businessType === "laundry"
        ? "/api/dashboard/laundry/orders?limit=5"
        : "/api/dashboard/orders?limit=5";
    case "inventory":
      return "/api/dashboard/inventory/products?limit=5";
    case "laporan":
      return businessType === "laundry"
        ? "/api/dashboard/laundry/reports/summary"
        : "/api/dashboard/reports/summary?range=7d";
    case "pickup":
      return "/api/dashboard/laundry/orders?orderType=pickup&limit=5";
    case "meja":
      return "/api/dashboard/fnb/tables";
    case "menu":
      return "/api/dashboard/fnb/table-sessions";
    case "products":
      return "/api/dashboard/products?limit=5";
    case "suppliers":
      return "/api/dashboard/suppliers?limit=5";
    case "cabang":
      return "/api/dashboard/branches?limit=5";
    case "tim":
      return "/api/dashboard/team/members?limit=5";
    case "pengaturan":
      return "/api/dashboard/organization";
    default:
      return "/api/dashboard/highlights";
  }
}

function toSafeNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function resolveCancellationRate(value: Record<string, unknown>) {
  if (value.cancellationRate !== undefined) {
    return toSafeNumber(value.cancellationRate);
  }
  const total = toSafeNumber(value.totalOrders);
  const cancelled = toSafeNumber(value.cancelledOrders);
  if (total <= 0) return 0;
  return Math.round((cancelled / total) * 1000) / 10;
}

function toRowsFromObject(data: Record<string, unknown>) {
  const rows: SnapshotRow[] = [];
  for (const [key, raw] of Object.entries(data)) {
    if (rows.length >= 5) break;
    if (typeof raw === "number") {
      rows.push({ label: key, value: formatNumber(raw) });
      continue;
    }
    if (typeof raw === "string") {
      rows.push({ label: key, value: raw });
      continue;
    }
    if (typeof raw === "boolean") {
      rows.push({ label: key, value: raw ? "true" : "false" });
      continue;
    }
  }
  return rows;
}

function summarizeSnapshot(moduleId: string, payload: unknown): SnapshotRow[] {
  if (moduleId === "dashboard" && payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const usesLaundrySummary =
      value.totalRevenue !== undefined
      || value.totalOrders !== undefined
      || value.outstandingAmount !== undefined;

    if (usesLaundrySummary) {
      return [
        {
          label: "Omzet Hari Ini",
          value: formatCurrency(toSafeNumber(value.totalRevenue)),
        },
        {
          label: "Total Order",
          value: formatNumber(toSafeNumber(value.totalOrders)),
        },
        {
          label: "Order Selesai",
          value: formatNumber(toSafeNumber(value.completedOrders)),
        },
        {
          label: "Outstanding",
          value: formatCurrency(toSafeNumber(value.outstandingAmount)),
        },
      ];
    }

    return [
      {
        label: "Omzet Hari Ini",
        value: formatCurrency(toSafeNumber(value.omzetHariIni)),
      },
      {
        label: "Pesanan Hari Ini",
        value: formatNumber(toSafeNumber(value.pesananHariIni)),
      },
      {
        label: "Pelanggan Baru",
        value: formatNumber(toSafeNumber(value.pelangganBaru)),
      },
      {
        label: "Cabang Aktif",
        value: `${toSafeNumber(value.activeBranches)}/${toSafeNumber(value.totalBranches)}`,
      },
    ];
  }

  if (moduleId === "laporan" && payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const revenue = value.totalRevenue ?? value.revenueTotal;
    const completed = value.completedOrders;
    const outstanding = value.outstandingAmount;

    return [
      {
        label: "Revenue Total",
        value: formatCurrency(toSafeNumber(revenue)),
      },
      {
        label: "Completed Orders",
        value: formatNumber(toSafeNumber(completed)),
      },
      {
        label: "Cancellation Rate",
        value: `${resolveCancellationRate(value)}%`,
      },
      {
        label: "Outstanding",
        value: formatCurrency(toSafeNumber(outstanding)),
      },
    ];
  }

  if (Array.isArray(payload)) {
    return [
      { label: "Total Records", value: formatNumber(payload.length) },
      { label: "Preview Item 1", value: toPreviewText(payload[0] ?? "-") },
    ];
  }

  if (payload && typeof payload === "object") {
    const objectValue = payload as Record<string, unknown>;
    if (Array.isArray(objectValue.data)) {
      const totalFromMeta =
        objectValue.meta && typeof objectValue.meta === "object"
          ? (objectValue.meta as Record<string, Primitive>).total
          : undefined;
      return [
        {
          label: "Total Records",
          value: formatNumber(
            Number(totalFromMeta ?? objectValue.data.length ?? 0)
          ),
        },
        { label: "Batch Size", value: formatNumber(objectValue.data.length) },
        {
          label: "Preview Item 1",
          value: toPreviewText(objectValue.data[0] ?? "-"),
        },
      ];
    }
    return toRowsFromObject(objectValue);
  }

  return [{ label: "Snapshot", value: toPreviewText(payload) }];
}

export async function fetchModuleLiveSnapshot(input: SnapshotInput): Promise<ModuleLiveSnapshot> {
  const endpoint = getSnapshotEndpoint(input);
  const url = `${trimTrailingSlash(API_BASE_URL)}${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "include",
  });

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object"
        ? ((body as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  const payload =
    body && typeof body === "object" && "data" in (body as Record<string, unknown>)
      ? (body as Record<string, unknown>).data
      : body;

  return {
    endpoint,
    rows: summarizeSnapshot(input.moduleId, payload),
    fetchedAt: new Date().toISOString(),
    previewText: toPreviewText(payload),
  };
}
