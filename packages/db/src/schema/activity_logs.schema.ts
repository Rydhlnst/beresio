import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { user } from "./auth.schema";

export const activityLogs = pgTable("activity_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // RBAC | PAYMENT | AUTH | SYSTEM | BRANCH | CUSTOMER
    level: text("level").notNull().default("info"), // info | warning | error
    description: text("description").notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    entityType: text("entity_type"), // branch | customer | member | payment
    entityId: text("entity_id"),
    metadata: text("metadata"), // JSON string for extra structured details
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxActivityOrg: index("idx_activity_org").on(table.organizationId, table.createdAt),
        idxActivityOrgType: index("idx_activity_org_type").on(table.organizationId, table.type),
        idxActivityOrgLevel: index("idx_activity_org_level").on(table.organizationId, table.level),
        idxActivityOrgEntity: index("idx_activity_org_entity").on(
            table.organizationId,
            table.entityType,
            table.entityId,
            table.createdAt
        ),
    };
});
