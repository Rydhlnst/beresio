import { createUpstashClient } from "./upstash";

export type LaundryRealtimeEnvelope = {
    channel: "laundry";
    orgId: string;
    branchId: string | null;
    eventId: string;
    sequence: number;
    eventType: string;
    occurredAt: string;
    payload: Record<string, unknown>;
};

function buildRoomName(orgId: string, branchId?: string | null) {
    if (branchId) return `laundry:org:${orgId}:branch:${branchId}`;
    return `laundry:org:${orgId}:all`;
}

export async function publishLaundryRealtime(
    c: any,
    event: LaundryRealtimeEnvelope
) {
    const serialized = JSON.stringify(event);

    const redis = createUpstashClient(c?.env);
    if (redis.enabled) {
        const branchChannel = event.branchId
            ? `realtime:laundry:${event.orgId}:branch:${event.branchId}`
            : null;

        const tasks: Array<Promise<void>> = [
            redis.publish(`realtime:laundry:${event.orgId}:all`, serialized),
        ];
        if (branchChannel) tasks.push(redis.publish(branchChannel, serialized));

        await Promise.all(tasks).catch(() => undefined);
    }

    const namespace = c?.env?.LAUNDRY_REALTIME_HUB;
    if (!namespace?.idFromName || !namespace?.get) return;

    const targets = [buildRoomName(event.orgId), buildRoomName(event.orgId, event.branchId)];
    const uniqueTargets = Array.from(new Set(targets));
    await Promise.all(uniqueTargets.map(async (target) => {
        const id = namespace.idFromName(target);
        const stub = namespace.get(id);
        await stub.fetch("https://laundry-realtime-hub/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: serialized,
        }).catch(() => undefined);
    }));
}

export async function connectLaundryWebSocket(c: any, options: { orgId: string; branchId?: string | null }) {
    const upgrade = c.req.header("upgrade") ?? c.req.header("Upgrade");
    if (!upgrade || upgrade.toLowerCase() !== "websocket") {
        return c.json({
            success: false,
            error: {
                code: "BAD_REQUEST",
                message: "Expected Upgrade: websocket",
            },
        }, 400);
    }

    const namespace = c?.env?.LAUNDRY_REALTIME_HUB;
    if (!namespace?.idFromName || !namespace?.get) {
        return c.json({
            success: false,
            error: {
                code: "NOT_IMPLEMENTED",
                message: "WebSocket hub is not configured",
            },
        }, 501);
    }

    const room = buildRoomName(options.orgId, options.branchId ?? null);
    const id = namespace.idFromName(room);
    const stub = namespace.get(id);

    return stub.fetch(c.req.raw);
}

export class LaundryRealtimeHub {
    private readonly sockets = new Set<any>();

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const isWebSocketUpgrade = (request.headers.get("Upgrade") ?? "").toLowerCase() === "websocket";

        if (isWebSocketUpgrade) {

            const pair = new (globalThis as any).WebSocketPair();
            const client = pair[0];
            const server = pair[1];

            server.accept();
            this.sockets.add(server);

            server.addEventListener("close", () => {
                this.sockets.delete(server);
            });
            server.addEventListener("error", () => {
                this.sockets.delete(server);
            });
            server.addEventListener("message", (event: any) => {
                if (event?.data === "ping") {
                    try {
                        server.send("pong");
                    } catch {
                        this.sockets.delete(server);
                    }
                }
            });

            server.send(JSON.stringify({ type: "connected", ts: Date.now() }));
            return new Response(null, { status: 101, webSocket: client } as any);
        }

        if (url.pathname === "/broadcast" && request.method === "POST") {
            const payload = await request.text();
            const staleSockets: any[] = [];

            for (const socket of this.sockets) {
                try {
                    socket.send(payload);
                } catch {
                    staleSockets.push(socket);
                }
            }

            for (const socket of staleSockets) {
                this.sockets.delete(socket);
            }

            return new Response("ok");
        }

        return new Response("Not Found", { status: 404 });
    }
}
