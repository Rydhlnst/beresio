import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function readDatabaseUrlFromDotEnv() {
    try {
        const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
        const line = raw
            .split(/\r?\n/)
            .map((v) => v.trim())
            .find((v) => v.startsWith("DATABASE_URL="));
        if (!line) return undefined;
        return line.slice("DATABASE_URL=".length).trim();
    } catch {
        return undefined;
    }
}

const databaseUrl = process.env.DATABASE_URL || readDatabaseUrlFromDotEnv();

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
    { slug: "laundry_worker", name: "Laundry Worker" },
    { slug: "driver", name: "Driver" },
    { slug: "staff", name: "Staff" },
];

const DEFAULT_LAUNDRY_ROLE_PERMISSIONS = {
    owner: [
        "dashboard.read",
        "branch.read",
        "team.read",
        "settings.read",
        "order.read",
        "order.create",
        "laundry.status.update",
        "laundry.payment.record",
        "laundry.service.manage",
        "pickup.read",
        "pickup.manage",
        "laundry.driver.assign",
        "report.read",
    ],
    admin: [
        "dashboard.read",
        "branch.read",
        "team.read",
        "settings.read",
        "order.read",
        "order.create",
        "laundry.status.update",
        "laundry.payment.record",
        "laundry.service.manage",
        "pickup.read",
        "pickup.manage",
        "laundry.driver.assign",
        "report.read",
    ],
    branch_manager: [
        "dashboard.read",
        "branch.read",
        "team.read",
        "settings.read",
        "order.read",
        "order.create",
        "laundry.status.update",
        "laundry.payment.record",
        "laundry.service.manage",
        "pickup.read",
        "pickup.manage",
        "laundry.driver.assign",
        "report.read",
    ],
    laundry_worker: [
        "order.read",
        "order.create",
        "laundry.status.update",
        "laundry.service.manage",
        "pickup.read",
        "pickup.manage",
    ],
    cashier: [
        "order.read",
        "order.create",
        "laundry.payment.record",
        "report.read",
    ],
    driver: [
        "pickup.read",
        "pickup.manage",
        "laundry.driver.assign",
    ],
};

const orgs = await sql`select id from organization`;

if (orgs.length === 0) {
    console.log("No organizations found. Skipping role seeding.");
    process.exit(0);
}

let inserted = 0;
let permissionInserted = 0;

for (const org of orgs) {
    for (const role of ROLE_SEED) {
        const result = await sql`
            insert into roles (organization_id, name, slug, is_system)
            values (${org.id}, ${role.name}, ${role.slug}, true)
            on conflict (organization_id, slug) do nothing
        `;

        inserted += Number(result?.rowCount ?? 0);
    }

    const orgRoles = await sql`
        select id, slug
        from roles
        where organization_id = ${org.id}
    `;

    const roleIdBySlug = new Map(orgRoles.map((role) => [role.slug, role.id]));

    for (const [roleSlug, permissions] of Object.entries(DEFAULT_LAUNDRY_ROLE_PERMISSIONS)) {
        const roleId = roleIdBySlug.get(roleSlug);
        if (!roleId) continue;

        for (const permission of permissions) {
            const result = await sql`
                insert into role_permissions (organization_id, role_id, permission)
                values (${org.id}, ${roleId}, ${permission})
                on conflict (role_id, permission) do nothing
            `;
            permissionInserted += Number(result?.rowCount ?? 0);
        }
    }
}

console.log(`Role seeding done. Inserted ${inserted} role rows and ${permissionInserted} permission rows.`);
