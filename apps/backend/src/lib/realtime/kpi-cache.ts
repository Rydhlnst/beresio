import { createUpstashClient } from "./upstash";

const KPI_CACHE_TTL_SECONDS = 20;
const KPI_INVALIDATION_TTL_SECONDS = 24 * 60 * 60;

type CachedKpi<T> = {
    cachedAt: number;
    data: T;
};

function normalizeScope(branchIds: string[]) {
    if (!Array.isArray(branchIds) || branchIds.length === 0) return "none";
    return Array.from(new Set(branchIds)).sort().join("|");
}

function kpiDataKey(orgId: string, branchIds: string[]) {
    return `kpi:data:${orgId}:${normalizeScope(branchIds)}`;
}

function kpiInvalidationKey(orgId: string) {
    return `kpi:invalidate:${orgId}`;
}

export async function readKpiCache<T>(
    c: any,
    options: { orgId: string; branchIds: string[] }
): Promise<T | null> {
    const redis = createUpstashClient(c?.env);
    if (!redis.enabled) return null;

    const [cachedRaw, invalidRaw] = await Promise.all([
        redis.get(kpiDataKey(options.orgId, options.branchIds)),
        redis.get(kpiInvalidationKey(options.orgId)),
    ]);

    if (!cachedRaw) return null;

    const cached = JSON.parse(cachedRaw) as CachedKpi<T>;
    if (!cached || typeof cached.cachedAt !== "number") return null;

    const invalidSince = Number(invalidRaw ?? 0);
    if (Number.isFinite(invalidSince) && invalidSince > 0 && cached.cachedAt < invalidSince) {
        return null;
    }

    return cached.data;
}

export async function writeKpiCache<T>(
    c: any,
    options: { orgId: string; branchIds: string[]; data: T }
) {
    const redis = createUpstashClient(c?.env);
    if (!redis.enabled) return;

    const payload: CachedKpi<T> = {
        cachedAt: Date.now(),
        data: options.data,
    };

    await redis.set(
        kpiDataKey(options.orgId, options.branchIds),
        JSON.stringify(payload),
        KPI_CACHE_TTL_SECONDS
    );
}

export async function invalidateKpiCache(c: any, orgId: string) {
    const redis = createUpstashClient(c?.env);
    if (!redis.enabled) return;

    await redis.set(kpiInvalidationKey(orgId), String(Date.now()), KPI_INVALIDATION_TTL_SECONDS);
}
