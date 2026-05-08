type UpstashResponse<T = unknown> = {
    result?: T;
    error?: string;
};

const UPSTASH_REQUEST_TIMEOUT_MS = 350;

export type UpstashRedisConfig = {
    url?: string;
    token?: string;
};

export class UpstashRedisClient {
    private readonly url?: string;
    private readonly token?: string;

    constructor(config: UpstashRedisConfig) {
        this.url = config.url?.trim();
        this.token = config.token?.trim();
    }

    get enabled() {
        return Boolean(this.url && this.token);
    }

    private async command<T = unknown>(args: Array<string | number>): Promise<T | null> {
        if (!this.enabled) return null;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), UPSTASH_REQUEST_TIMEOUT_MS);
        let response: Response;
        try {
            response = await fetch(this.url!, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.token!}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(args),
                signal: controller.signal,
            });
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new Error(`Upstash request timeout (${UPSTASH_REQUEST_TIMEOUT_MS}ms)`);
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }

        const payload = await response.json().catch(() => null) as UpstashResponse<T> | null;
        if (!response.ok) {
            throw new Error(payload?.error ?? `Upstash request failed (${response.status})`);
        }

        return payload?.result ?? null;
    }

    async get(key: string): Promise<string | null> {
        const result = await this.command<string>(["GET", key]);
        return typeof result === "string" ? result : null;
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        const args: Array<string | number> = ["SET", key, value];
        if (typeof ttlSeconds === "number" && Number.isFinite(ttlSeconds) && ttlSeconds > 0) {
            args.push("EX", Math.floor(ttlSeconds));
        }
        await this.command(args);
    }

    async publish(channel: string, value: string): Promise<void> {
        await this.command(["PUBLISH", channel, value]);
    }
}

export function createUpstashClient(env: any) {
    return new UpstashRedisClient({
        url: env?.UPSTASH_REDIS_REST_URL,
        token: env?.UPSTASH_REDIS_REST_TOKEN,
    });
}
