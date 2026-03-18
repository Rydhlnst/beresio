import { createDbHttp, testDbConnection } from "../src/db";
import * as schema from "../src/schema/index";

async function verify() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    console.log("Verifying database connection...");
    const db = createDbHttp(url);
    const result = await testDbConnection(db);

    if (result.success) {
        console.log("✅ Database connection successful!");
        
        try {
            console.log("Testing schema access (fetching a user)...");
            // Assuming the user table exists
            const users = await db.select().from(schema.user).limit(1);
            console.log("✅ Schema access successful! Found users:", users.length);
        } catch (error: any) {
            console.warn("⚠️ Schema access warning (table might be empty or missing):", error.message);
        }
    } else {
        console.error("❌ Database connection failed:", result.error);
        process.exit(1);
    }
}

verify();
