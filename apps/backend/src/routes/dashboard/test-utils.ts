import { Hono } from "hono";

export type DbMockCalls = {
    onConflictDoNothing: Array<{ table: unknown; args: unknown }>;
};

export class QueryMock<T> implements PromiseLike<T> {
    constructor(
        private readonly result: T,
        private readonly meta?: { table?: unknown; calls?: DbMockCalls }
    ) {}
    from() { return this; }
    innerJoin() { return this; }
    leftJoin() { return this; }
    where() { return this; }
    orderBy() { return this; }
    groupBy() { return this; }
    limit() { return this; }
    offset() { return this; }
    values() { return this; }
    set() { return this; }
    returning() { return this; }
    onConflictDoUpdate() { return this; }
    onConflictDoNothing(args?: unknown) {
        this.meta?.calls?.onConflictDoNothing.push({ table: this.meta?.table, args });
        return this;
    }
    as() { return this; }
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return Promise.resolve(this.result).then(onfulfilled, onrejected);
    }
}

export function createDbMock(options?: {
    selectResults?: unknown[];
    insertResults?: unknown[];
    updateResults?: unknown[];
    deleteResults?: unknown[];
}) {
    const selectQueue = [...(options?.selectResults ?? [])];
    const insertQueue = [...(options?.insertResults ?? [])];
    const updateQueue = [...(options?.updateResults ?? [])];
    const deleteQueue = [...(options?.deleteResults ?? [])];

    const calls: DbMockCalls = {
        onConflictDoNothing: [],
    };

    const makeQuery = <T>(queue: unknown[], table?: unknown) =>
        new QueryMock(queue.shift() as T ?? ([] as unknown as T), { table, calls });

    return {
        __calls: calls,
        select: () => makeQuery(selectQueue),
        insert: (table?: unknown) => makeQuery(insertQueue, table),
        update: () => makeQuery(updateQueue),
        delete: () => makeQuery(deleteQueue),
        transaction: async (fn: (tx: any) => Promise<unknown>) => {
            return fn({
                __calls: calls,
                select: () => makeQuery(selectQueue),
                insert: (table?: unknown) => makeQuery(insertQueue, table),
                update: () => makeQuery(updateQueue),
                delete: () => makeQuery(deleteQueue),
            });
        },
    };
}

export function createTestApp(router: any, basePath: string, db: any) {
    const app = new Hono<{ Variables: { db: any } }>();
    app.use("*", async (c, next) => {
        c.set("db", db);
        await next();
    });
    app.route(basePath, router);
    return app;
}
