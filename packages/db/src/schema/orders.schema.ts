import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    integer,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { branches, customers } from "./core.schema";
import { inventoryProducts } from "./inventory.schema";

export const orders = pgTable("orders", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
        .references(() => customers.id, { onDelete: "set null" }),

    orderNumber: varchar("order_number", { length: 32 }).notNull(),
    status: text("status").notNull().default("pending"), // pending | processing | completed | cancelled
    type: text("type").notNull().default("walk_in"), // pickup | delivery | walk_in

    subtotalAmount: integer("subtotal_amount").notNull(),
    discountAmount: integer("discount_amount").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull(),

    paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | refunded | failed
    paymentMethod: text("payment_method"),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
    completedAt: timestamp("completed_at"),
    cancelledAt: timestamp("cancelled_at"),
}, (table) => {
    return {
        idxOrdersOrg: index("idx_orders_org").on(table.organizationId),
        idxOrdersOrgStatus: index("idx_orders_org_status").on(table.organizationId, table.status),
        idxOrdersOrgCreated: index("idx_orders_org_created").on(table.organizationId, table.createdAt),
        idxOrdersBranch: index("idx_orders_branch").on(table.branchId),
        idxOrdersCustomer: index("idx_orders_customer").on(table.customerId),
        uqOrdersOrgNumber: uniqueIndex("uq_orders_org_number").on(table.organizationId, table.orderNumber),
    };
});

export const orderItems = pgTable("order_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    inventoryProductId: uuid("inventory_product_id")
        .references(() => inventoryProducts.id, { onDelete: "set null" }),
    sku: varchar("sku", { length: 60 }),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    totalPrice: integer("total_price").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxOrderItemsOrder: index("idx_order_items_order").on(table.orderId),
    };
});

export const orderEvents = pgTable("order_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),

    status: text("status").notNull(), // pending | processing | completed | cancelled
    note: text("note"),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxOrderEventsOrder: index("idx_order_events_order").on(table.orderId),
        idxOrderEventsOrgCreated: index("idx_order_events_org_created").on(table.organizationId, table.createdAt),
    };
});

export const orderSequences = pgTable("order_sequences", {
    organizationId: text("organization_id")
        .primaryKey()
        .references(() => organization.id, { onDelete: "cascade" }),
    lastNumber: integer("last_number").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
});
