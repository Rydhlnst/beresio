import { Hono } from "hono";

export class QueryMock<T> implements PromiseLike<T> {
    constructor(private readonly result: T) {}
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

    return {
        select: () => new QueryMock(selectQueue.shift() ?? []),
        selectDistinct: () => new QueryMock(selectQueue.shift() ?? []),
        insert: () => new QueryMock(insertQueue.shift() ?? []),
        update: () => new QueryMock(updateQueue.shift() ?? []),
        delete: () => new QueryMock(deleteQueue.shift() ?? []),
        transaction: async (fn: (tx: any) => Promise<unknown>) => {
            return fn({
                select: () => new QueryMock(selectQueue.shift() ?? []),
                selectDistinct: () => new QueryMock(selectQueue.shift() ?? []),
                insert: () => new QueryMock(insertQueue.shift() ?? []),
                update: () => new QueryMock(updateQueue.shift() ?? []),
                delete: () => new QueryMock(deleteQueue.shift() ?? []),
            });
        },
    };
}

export function createTestApp(router: any, basePath: string, db: any, env: Record<string, unknown> = {}) {
    const app = new Hono();
    app.use("*", async (c, next) => {
        if (Object.keys(env).length > 0) {
            if (!(c as any).env) {
                (c as any).env = {};
            }
            Object.assign((c as any).env, env);
        }
        (c as any).set("db", db);
        await next();
    });
    app.route(basePath, router);
    return app;
}
