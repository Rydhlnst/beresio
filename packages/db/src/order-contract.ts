export const CANONICAL_ORDER_STATUSES = [
    "pending",
    "processing",
    "completed",
    "cancelled",
] as const;

export type CanonicalOrderStatus = (typeof CANONICAL_ORDER_STATUSES)[number];

export const LEGACY_ORDER_STATUS_MAP = {
    created: "pending",
    confirmed: "pending",
    pickup_requested: "processing",
    picked_up: "processing",
    washing: "processing",
    drying: "processing",
    ready: "processing",
    received: "pending",
    in_process: "processing",
    done: "processing",
    ready_pickup: "processing",
    out_for_delivery: "processing",
} as const satisfies Record<string, CanonicalOrderStatus>;

export type LegacyOrderStatus = keyof typeof LEGACY_ORDER_STATUS_MAP;
export type OrderStatusInput = CanonicalOrderStatus | LegacyOrderStatus;

export const CANONICAL_ORDER_TYPES = [
    "walk_in",
    "pickup",
    "delivery",
] as const;

export type CanonicalOrderType = (typeof CANONICAL_ORDER_TYPES)[number];

export const LEGACY_ORDER_TYPE_MAP = {
    walkin: "walk_in",
    pickup_delivery: "pickup",
} as const satisfies Record<string, CanonicalOrderType>;

export type LegacyOrderType = keyof typeof LEGACY_ORDER_TYPE_MAP;
export type OrderTypeInput = CanonicalOrderType | LegacyOrderType;

export function normalizeOrderStatusInput(input: unknown): string {
    if (typeof input !== "string") return "";
    const normalized = input.trim().toLowerCase();
    if (!normalized) return "";
    return LEGACY_ORDER_STATUS_MAP[normalized as LegacyOrderStatus] ?? normalized;
}

export function normalizeOrderTypeInput(input: unknown): string {
    if (typeof input !== "string") return "";
    const normalized = input.trim().toLowerCase();
    if (!normalized) return "";
    return LEGACY_ORDER_TYPE_MAP[normalized as LegacyOrderType] ?? normalized;
}
