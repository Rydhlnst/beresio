import { Hono } from "hono";
import { internalFnbWorkersRouter } from "./fnb-workers";
import { internalLaundryWorkersRouter } from "./laundry-workers";
import type { AppRoute } from "../../types/app";

export const internalRouter = new Hono<AppRoute>();

internalRouter.route("/fnb", internalFnbWorkersRouter);
internalRouter.route("/laundry", internalLaundryWorkersRouter);
