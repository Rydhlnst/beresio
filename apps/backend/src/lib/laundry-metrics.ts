type LaundryRuntimeMetrics = {
    deprecatedPickupHits: number;
    validationRejects: number;
    createOrderAttempts: number;
};

const metrics: LaundryRuntimeMetrics = {
    deprecatedPickupHits: 0,
    validationRejects: 0,
    createOrderAttempts: 0,
};

export function incrementDeprecatedPickupHits() {
    metrics.deprecatedPickupHits += 1;
}

export function incrementLaundryValidationRejects() {
    metrics.validationRejects += 1;
}

export function incrementLaundryOrderCreateAttempts() {
    metrics.createOrderAttempts += 1;
}

export function getLaundryRuntimeMetrics() {
    return { ...metrics };
}

export function resetLaundryRuntimeMetrics() {
    metrics.deprecatedPickupHits = 0;
    metrics.validationRejects = 0;
    metrics.createOrderAttempts = 0;
}
