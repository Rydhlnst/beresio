import { NextResponse } from "next/server";
import { createDbNextjs, testDbConnection } from "@beresio/db";

const db = createDbNextjs(process.env.DATABASE_URL!);

export async function GET() {
    const check = await testDbConnection(db);

    if (check.success) {
        return NextResponse.json({
            status: "healthy",
            database: "connected",
            timestamp: new Date().toISOString(),
        });
    }

    return NextResponse.json({
        status: "unhealthy",
        database: "disconnected",
        error: check.error,
        timestamp: new Date().toISOString(),
    }, { status: 500 });
}
