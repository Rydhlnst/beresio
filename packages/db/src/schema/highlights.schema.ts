import { pgTable, text, timestamp, uuid, varchar, integer, boolean, index } from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";

export const highlights = pgTable("highlights", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxHighlightsOrg: index("idx_highlights_org").on(table.organizationId),
        idxHighlightsOrgArchived: index("idx_highlights_org_archived").on(table.organizationId, table.isArchived),
        idxHighlightsOrgOrder: index("idx_highlights_org_order").on(table.organizationId, table.orderIndex),
    };
});
