export const LAUNDRY_ORDER_STATUSES = [
    "created",
    "confirmed",
    "pickup_requested",
    "picked_up",
    "washing",
    "drying",
    "ready",
    "out_for_delivery",
    "completed",
    "cancelled",
] as const;

export type LaundryOrderStatus = (typeof LAUNDRY_ORDER_STATUSES)[number];

export const LAUNDRY_ORDER_TRANSITIONS: Record<LaundryOrderStatus, LaundryOrderStatus[]> = {
    created: ["confirmed", "cancelled"],
    confirmed: ["pickup_requested", "picked_up", "washing", "cancelled"],
    pickup_requested: ["picked_up", "cancelled"],
    picked_up: ["washing", "cancelled"],
    washing: ["drying", "cancelled"],
    drying: ["ready", "cancelled"],
    ready: ["out_for_delivery", "completed", "cancelled"],
    out_for_delivery: ["completed"],
    completed: [],
    cancelled: [],
};

export const LAUNDRY_FINAL_STATUSES = ["completed", "cancelled"] as const;

export function isLaundryFinalStatus(value: unknown): value is (typeof LAUNDRY_FINAL_STATUSES)[number] {
    if (typeof value !== "string") return false;
    return LAUNDRY_FINAL_STATUSES.includes(value as (typeof LAUNDRY_FINAL_STATUSES)[number]);
}

export function isLaundryOrderStatus(value: unknown): value is LaundryOrderStatus {
    if (typeof value !== "string") return false;
    return LAUNDRY_ORDER_STATUSES.includes(value as LaundryOrderStatus);
}

export function canTransitionLaundryOrderStatus(
    fromStatus: LaundryOrderStatus,
    toStatus: LaundryOrderStatus
) {
    if (fromStatus === toStatus) return true;
    return LAUNDRY_ORDER_TRANSITIONS[fromStatus].includes(toStatus);
}

export function assertLaundryOrderTransition(
    fromStatus: LaundryOrderStatus,
    toStatus: LaundryOrderStatus
) {
    return canTransitionLaundryOrderStatus(fromStatus, toStatus);
}
