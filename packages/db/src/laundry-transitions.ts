export const LAUNDRY_ORDER_STATUSES = [
    "received",
    "processing",
    "ready_for_pickup",
    "out_for_delivery",
    "completed",
    "cancelled",
] as const;

export type LaundryOrderStatus = (typeof LAUNDRY_ORDER_STATUSES)[number];

export const LAUNDRY_ORDER_TRANSITIONS: Record<LaundryOrderStatus, LaundryOrderStatus[]> = {
    received: ["processing", "cancelled"],
    processing: ["ready_for_pickup", "out_for_delivery", "cancelled"],
    ready_for_pickup: ["out_for_delivery", "completed"],
    out_for_delivery: ["completed"],
    completed: [],
    cancelled: [],
};

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
