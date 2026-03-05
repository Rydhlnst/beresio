import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { db } from "@beresio/db";

export const { GET, POST } = toNextJsHandler(auth(db));
