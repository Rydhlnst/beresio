import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { customers } from "./core.schema";

export const customerTags = pgTable("customer_tags", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 80 }).notNull(),
    color: varchar("color", { length: 24 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxCustomerTagsOrg: index("idx_customer_tags_org").on(table.organizationId),
        uqCustomerTagsOrgSlug: uniqueIndex("uq_customer_tags_org_slug").on(table.organizationId, table.slug),
    };
});

export const customerTagLinks = pgTable("customer_tag_links", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
        .notNull()
        .references(() => customerTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxCustomerTagLinksOrg: index("idx_customer_tag_links_org").on(table.organizationId),
        idxCustomerTagLinksCustomer: index("idx_customer_tag_links_customer").on(table.customerId),
        idxCustomerTagLinksTag: index("idx_customer_tag_links_tag").on(table.tagId),
        uqCustomerTagLinksUnique: uniqueIndex("uq_customer_tag_links_unique").on(table.customerId, table.tagId),
    };
});

export const customerNotes = pgTable("customer_notes", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxCustomerNotesOrg: index("idx_customer_notes_org").on(table.organizationId),
        idxCustomerNotesCustomer: index("idx_customer_notes_customer").on(table.customerId),
        idxCustomerNotesCreated: index("idx_customer_notes_created").on(table.organizationId, table.createdAt),
    };
});
