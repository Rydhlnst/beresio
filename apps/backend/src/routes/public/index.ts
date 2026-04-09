import { Hono } from "hono";
import { publicFnbRouter } from "./fnb";

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string };
type Variables = { db: any; user: any; session: any };

export const publicRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>();

publicRouter.route("/fnb", publicFnbRouter);
