import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("DATABASE_URL is required to seed roles.");
    process.exit(1);
}

const sql = neon(databaseUrl);

const ROLE_SEED = [
    { slug: "owner", name: "Owner" },
    { slug: "admin", name: "Admin" },
    { slug: "branch_manager", name: "Branch Manager" },
    { slug: "cashier", name: "Cashier" },
    { slug: "staff", name: "Staff" },
];

const orgs = await sql`select id from organization`;

if (orgs.length === 0) {
    console.log("No organizations found. Skipping role seeding.");
    process.exit(0);
}

let inserted = 0;

for (const org of orgs) {
    for (const role of ROLE_SEED) {
        const result = await sql`
            insert into roles (organization_id, name, slug, is_system)
            values (${org.id}, ${role.name}, ${role.slug}, true)
            on conflict (organization_id, slug) do nothing
        `;

        inserted += Number(result?.rowCount ?? 0);
    }
}

console.log(`Role seeding done. Inserted ${inserted} rows.`);
