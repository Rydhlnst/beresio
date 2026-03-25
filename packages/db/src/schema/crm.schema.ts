import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    index,
    uniqueIndex,
    pgEnum,
    jsonb,
    integer,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { customers } from "./core.schema";

/**
 * Customer Interaction Type Enum
 * - call: Phone call with customer
 * - visit: Customer visit to store
 * - order: Order placement
 * - complaint: Customer complaint
 * - feedback: General feedback
 * - other: Other types of interaction
 */
export const customerInteractionTypeEnum = pgEnum("customer_interaction_type", [
    "call",
    "visit",
    "order",
    "complaint",
    "feedback",
    "other",
]);

/**
 * Customer Tags Table
 * Organize customers with color-coded tags
 */
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

/**
 * Customer Tag Links Table
 * Many-to-many relationship between customers and tags
 */
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

/**
 * Customer Notes Table
 * Track notes and comments about customers
 */
export const customerNotes = pgTable("customer_notes", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxCustomerNotesOrg: index("idx_customer_notes_org").on(table.organizationId),
        idxCustomerNotesCustomer: index("idx_customer_notes_customer").on(table.customerId),
        idxCustomerNotesCreated: index("idx_customer_notes_created").on(table.organizationId, table.createdAt),
    };
});

/**
 * Customer Interactions Table
 * Track all interactions with customers (calls, visits, orders, complaints, etc.)
 */
export const customerInteractions = pgTable("customer_interactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "cascade" }),
    type: customerInteractionTypeEnum("type").notNull(),
    notes: text("notes").notNull(),
    metadata: jsonb("metadata").default({}),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxCustomerInteractionsOrg: index("idx_customer_interactions_org").on(table.organizationId),
        idxCustomerInteractionsCustomer: index("idx_customer_interactions_customer").on(table.customerId),
        idxCustomerInteractionsType: index("idx_customer_interactions_type").on(table.type),
        idxCustomerInteractionsCreated: index("idx_customer_interactions_created").on(table.organizationId, table.createdAt),
    };
});

/**
 * Customer Analytics Table
 * Aggregated metrics for customer performance analysis
 * Updated periodically or via triggers
 */
export const customerAnalytics = pgTable("customer_analytics", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
        .notNull()
        .references(() => customers.id, { onDelete: "cascade" }),
    totalOrders: integer("total_orders").default(0).notNull(),
    totalSpent: integer("total_spent").default(0).notNull(), // in rupiah
    averageOrderValue: integer("average_order_value").default(0).notNull(), // in rupiah
    lastOrderAt: timestamp("last_order_at"),
    firstOrderAt: timestamp("first_order_at"),
    orderFrequencyDays: integer("order_frequency_days"), // average days between orders
    totalInteractions: integer("total_interactions").default(0).notNull(),
    lastInteractionAt: timestamp("last_interaction_at"),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxCustomerAnalyticsOrg: index("idx_customer_analytics_org").on(table.organizationId),
        idxCustomerAnalyticsCustomer: index("idx_customer_analytics_customer").on(table.customerId),
        idxCustomerAnalyticsSpent: index("idx_customer_analytics_spent").on(table.organizationId, table.totalSpent),
        idxCustomerAnalyticsOrders: index("idx_customer_analytics_orders").on(table.organizationId, table.totalOrders),
        uqCustomerAnalyticsCustomer: uniqueIndex("uq_customer_analytics_customer").on(table.customerId),
    };
});
