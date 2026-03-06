import { NextResponse } from "next/server";
import { db, testDbConnection } from "@beresio/db";

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
