import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { toNextJsHandler } from "better-auth/next-js";

const db = createDbNextjs(process.env.DATABASE_URL!);

export const { GET, POST } = toNextJsHandler(auth(db));
