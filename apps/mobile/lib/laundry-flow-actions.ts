const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787";

type Primitive = string | number | boolean | null | undefined;

export type LaundryOrderStatus =
  | "received"
  | "processing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export type LaundryOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string | null;
  remainingAmount: number;
  assignedDriverId: string | null;
  assignedDriverName: string | null;
};

export type LaundryDriverOption = {
  id: string;
  name: string;
  email: string | null;
  role: string;
};

export const LAUNDRY_STATUS_OPTIONS: LaundryOrderStatus[] = [
  "processing",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
];

function trimTrailingSlash(input: string) {
  return input.replace(/\/+$/, "");
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text };
  }
}

function resolveErrorMessage(body: Record<string, unknown> | null, fallback: string) {
  if (!body) return fallback;
  const messageFromError =
    body.error && typeof body.error === "object"
      ? (body.error as { message?: string }).message
      : undefined;
  if (messageFromError) return messageFromError;
  if (typeof body.message === "string" && body.message.trim().length > 0) return body.message;
  return fallback;
}

async function callLaundryApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${trimTrailingSlash(API_BASE_URL)}${path}`, {
    credentials: "include",
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(resolveErrorMessage(body, `HTTP ${response.status}`));
  }
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

function normalizeNumber(value: Primitive) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchRecentLaundryOrders(
  limit = 5,
  orderType?: "walk_in" | "pickup" | "drop_off"
) {
  const query = new URLSearchParams({
    limit: String(Math.max(1, Math.min(limit, 20))),
  });
  if (orderType) query.set("orderType", orderType);
  const rows = await callLaundryApi<Record<string, Primitive>[]>(
    `/api/dashboard/laundry/orders?${query.toString()}`
  );
  return rows.map((row) => ({
    id: String(row.id ?? ""),
    orderNumber: String(row.orderNumber ?? "-"),
    status: String(row.status ?? "-"),
    customerName: row.customerName ? String(row.customerName) : null,
    remainingAmount: normalizeNumber(row.remainingAmount),
    assignedDriverId: row.assignedDriverId ? String(row.assignedDriverId) : null,
    assignedDriverName: row.assignedDriverName ? String(row.assignedDriverName) : null,
  }));
}

export async function fetchLaundryDrivers(limit = 100): Promise<LaundryDriverOption[]> {
  const query = new URLSearchParams({
    limit: String(Math.max(1, Math.min(limit, 100))),
  });
  const rows = await callLaundryApi<Record<string, Primitive>[]>(
    `/api/dashboard/team/members?${query.toString()}`
  );

  return rows
    .filter((row) => String(row.status ?? "active").toLowerCase() === "active")
    .filter((row) => String(row.role ?? "").toLowerCase() === "driver")
    .map((row) => ({
      id: String(row.id ?? ""),
      name: row.name ? String(row.name) : String(row.email ?? row.id ?? "Driver"),
      email: row.email ? String(row.email) : null,
      role: String(row.role ?? "driver"),
    }))
    .filter((driver) => driver.id.length > 0);
}

export async function updateLaundryOrderStatus(input: {
  orderId: string;
  status: LaundryOrderStatus;
  note?: string;
}) {
  if (!input.orderId.trim()) throw new Error("orderId is required");
  return callLaundryApi<Record<string, Primitive>>(
    `/api/dashboard/laundry/orders/${encodeURIComponent(input.orderId.trim())}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status,
        note: input.note?.trim() ? input.note.trim() : null,
      }),
    }
  );
}

export async function recordLaundryPayment(input: {
  orderId: string;
  amount: number;
  paymentMethod?: string;
  note?: string;
}) {
  if (!input.orderId.trim()) throw new Error("orderId is required");
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("amount must be > 0");
  }
  return callLaundryApi<{
    payment: Record<string, Primitive>;
    order: Record<string, Primitive>;
  }>(`/api/dashboard/laundry/orders/${encodeURIComponent(input.orderId.trim())}/payments`, {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(input.amount),
      paymentMethod: input.paymentMethod?.trim() ? input.paymentMethod.trim() : "cash",
      note: input.note?.trim() ? input.note.trim() : null,
    }),
  });
}

export async function assignLaundryOrderDriver(input: {
  orderId: string;
  driverId: string | null;
}) {
  if (!input.orderId.trim()) throw new Error("orderId is required");
  return callLaundryApi<Record<string, Primitive>>(
    `/api/dashboard/laundry/orders/${encodeURIComponent(input.orderId.trim())}/driver`,
    {
      method: "PATCH",
      body: JSON.stringify({
        driverId: input.driverId && input.driverId.trim().length > 0 ? input.driverId.trim() : null,
      }),
    }
  );
}
