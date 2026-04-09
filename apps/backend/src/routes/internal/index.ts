import { Hono } from "hono";
import { internalFnbWorkersRouter } from "./fnb-workers";

type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    INTERNAL_API_SECRET?: string;
};
type Variables = { db: any; user: any; session: any };

export const internalRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

internalRouter.route("/fnb", internalFnbWorkersRouter);
