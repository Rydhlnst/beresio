import { Hono } from "hono";
import { internalFnbWorkersRouter } from "./fnb-workers";
import { internalLaundryWorkersRouter } from "./laundry-workers";

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    INTERNAL_API_SECRET?: string;
    LAUNDRY_WA_PROVIDER_URL?: string;
    LAUNDRY_WA_PROVIDER_TOKEN?: string;
    LAUNDRY_WA_TIMEOUT_MS?: string;
    LAUNDRY_WA_MAX_ATTEMPTS?: string;
    LAUNDRY_WA_RETRY_BASE_SECONDS?: string;
};
type Variables = { db: any; user: any; session: any };

export const internalRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

internalRouter.route("/fnb", internalFnbWorkersRouter);
internalRouter.route("/laundry", internalLaundryWorkersRouter);
