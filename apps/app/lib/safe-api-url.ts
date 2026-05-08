const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:8787";

const LOCAL_HOST_RULES = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];

const warnedMessages = new Set<string>();

function warnOnce(message: string) {
    if (warnedMessages.has(message)) return;
    warnedMessages.add(message);
    console.warn(message);
}

function normalizeBaseUrl(value: string): string {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}

function parseAllowedHostRules(rawRules: string | undefined): string[] {
    if (!rawRules) return [];
    return rawRules
        .split(",")
        .map((rule) => rule.trim().toLowerCase())
        .filter((rule) => rule.length > 0);
}

function isPrivateIpv4(hostname: string): boolean {
    const parts = hostname.split(".");
    if (parts.length !== 4) return false;
    const nums = parts.map((part) => Number(part));
    if (nums.some((num) => Number.isNaN(num) || num < 0 || num > 255)) return false;

    const first = nums[0];
    const second = nums[1];
    if (first === undefined || second === undefined) return false;

    if (first === 10) return true;
    if (first === 127) return true;
    if (first === 192 && second === 168) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    return false;
}

function hostMatchesRule(hostname: string, rule: string): boolean {
    if (!rule) return false;
    if (rule.startsWith("*.")) {
        const suffix = rule.slice(2);
        return hostname === suffix || hostname.endsWith(`.${suffix}`);
    }
    if (rule.startsWith(".")) {
        const suffix = rule.slice(1);
        return hostname === suffix || hostname.endsWith(`.${suffix}`);
    }
    return hostname === rule;
}

function getCurrentBrowserOrigin(): string | null {
    if (typeof window === "undefined") return null;
    return window.location.origin;
}

function getCurrentBrowserHostname(): string | null {
    if (typeof window === "undefined") return null;
    return window.location.hostname.toLowerCase();
}

function resolveFromConfigured(
    configuredBaseUrl: string | null | undefined,
    allowedHostRules: string[],
    allowUnlistedPublicHost: boolean
): string | null {
    const raw = configuredBaseUrl?.trim();
    if (!raw) return null;

    let parsed: URL;
    try {
        parsed = new URL(raw);
    } catch {
        warnOnce(`[safe-api-url] Ignoring invalid NEXT_PUBLIC_API_URL: ${raw}`);
        return null;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        warnOnce(`[safe-api-url] Ignoring NEXT_PUBLIC_API_URL with unsupported protocol: ${parsed.protocol}`);
        return null;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (hostname.endsWith("malwarebytes.com")) {
        warnOnce(`[safe-api-url] Ignoring NEXT_PUBLIC_API_URL intercepted by security filter host: ${hostname}`);
        return null;
    }

    const hasExplicitMatch = allowedHostRules.some((rule) => hostMatchesRule(hostname, rule));
    const isLocalHost = LOCAL_HOST_RULES.includes(hostname) || isPrivateIpv4(hostname);
    if (!hasExplicitMatch && !isLocalHost) {
        if (allowUnlistedPublicHost) {
            warnOnce(
                `[safe-api-url] Allowing unlisted public API host on server production mode: ${hostname}. ` +
                "Set NEXT_PUBLIC_ALLOWED_API_HOSTS to enforce explicit host allowlisting."
            );
            return normalizeBaseUrl(`${parsed.origin}${parsed.pathname}`);
        }
        warnOnce(
            `[safe-api-url] Ignoring NEXT_PUBLIC_API_URL host not in allowlist: ${hostname}. ` +
            "Set NEXT_PUBLIC_ALLOWED_API_HOSTS to explicitly allow public API domains."
        );
        return null;
    }

    return normalizeBaseUrl(`${parsed.origin}${parsed.pathname}`);
}

export function getSafeApiBaseUrl(): string {
    const isServerRuntime = typeof window === "undefined";
    const allowUnlistedPublicHost = isServerRuntime && process.env.NODE_ENV === "production";
    const allowedHostRules = [
        ...LOCAL_HOST_RULES,
        ...parseAllowedHostRules(process.env.NEXT_PUBLIC_ALLOWED_API_HOSTS),
    ];

    const browserHostname = getCurrentBrowserHostname();
    if (browserHostname) {
        allowedHostRules.push(browserHostname);
    }

    const configured = resolveFromConfigured(
        process.env.NEXT_PUBLIC_API_URL,
        allowedHostRules,
        allowUnlistedPublicHost
    );
    if (configured) return configured;

    const browserOrigin = getCurrentBrowserOrigin();
    const browserFallback = resolveFromConfigured(browserOrigin, allowedHostRules, false);
    if (browserFallback) return browserFallback;

    return DEFAULT_LOCAL_API_BASE_URL;
}

export function buildSafeApiUrl(path: string): string {
    const base = getSafeApiBaseUrl();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${normalizedPath}`;
}

export function buildSafeWebSocketUrl(path: string): string {
    const base = getSafeApiBaseUrl();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (base.startsWith("https://")) {
        return `wss://${base.slice("https://".length)}${normalizedPath}`;
    }
    if (base.startsWith("http://")) {
        return `ws://${base.slice("http://".length)}${normalizedPath}`;
    }
    return `${base}${normalizedPath}`;
}
