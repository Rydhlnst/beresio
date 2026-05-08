import { Hono } from "hono";
import { publicFnbRouter } from "./fnb";
import { publicLaundryRouter } from "./laundry";
import type { AppRoute } from "../../types/app";

export const publicRouter = new Hono<AppRoute>();

publicRouter.route("/fnb", publicFnbRouter);
publicRouter.route("/laundry", publicLaundryRouter);
