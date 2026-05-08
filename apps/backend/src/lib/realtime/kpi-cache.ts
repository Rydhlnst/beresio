import { createUpstashClient } from "./upstash";
import { isJsonRecord, parseJsonWithGuard } from "../safe-json";

const KPI_CACHE_TTL_SECONDS = 20;
const KPI_INVALIDATION_TTL_SECONDS = 24 * 60 * 60;

type CachedKpi<T> = {
    cachedAt: number;
    data: T;
};

function isCachedKpi<T>(value: unknown): value is CachedKpi<T> {
    return isJsonRecord(value) && typeof value.cachedAt === "number" && "data" in value;
}

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

    let cachedRaw: string | null = null;
    let invalidRaw: string | null = null;
    try {
        [cachedRaw, invalidRaw] = await Promise.all([
            redis.get(kpiDataKey(options.orgId, options.branchIds)),
            redis.get(kpiInvalidationKey(options.orgId)),
        ]);
    } catch (error) {
        console.warn("[kpi-cache/read] cache unavailable, fallback to db", {
            message: error instanceof Error ? error.message : String(error),
            orgId: options.orgId,
        });
        return null;
    }

    if (!cachedRaw) return null;

    const cached = parseJsonWithGuard<CachedKpi<T>>(cachedRaw, isCachedKpi);
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

    try {
        await redis.set(
            kpiDataKey(options.orgId, options.branchIds),
            JSON.stringify(payload),
            KPI_CACHE_TTL_SECONDS
        );
    } catch (error) {
        console.warn("[kpi-cache/write] cache unavailable, skip write", {
            message: error instanceof Error ? error.message : String(error),
            orgId: options.orgId,
        });
    }
}

export async function invalidateKpiCache(c: any, orgId: string) {
    const redis = createUpstashClient(c?.env);
    if (!redis.enabled) return;

    try {
        await redis.set(kpiInvalidationKey(orgId), String(Date.now()), KPI_INVALIDATION_TTL_SECONDS);
    } catch (error) {
        console.warn("[kpi-cache/invalidate] cache unavailable, skip invalidate", {
            message: error instanceof Error ? error.message : String(error),
            orgId,
        });
    }
}
