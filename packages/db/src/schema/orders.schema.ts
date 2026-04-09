import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    integer,
    jsonb,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { branches, customers } from "./core.schema";
import { inventoryProducts } from "./inventory.schema";
import { fnbTables, fnbTableSessions, fnbMenuVersionItems, fnbMenuVersions } from "./fnb.schema";
import { products } from "./products.schema";

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
    status: text("status").notNull().default("pending"), // pending | confirmed | processing | preparing | ready | served | completed | cancelled
    type: text("type").notNull().default("walk_in"), // pickup | delivery | walk_in | takeaway | dine_in

    subtotalAmount: integer("subtotal_amount").notNull(),
    discountAmount: integer("discount_amount").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull(),

    paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | refunded | failed
    paymentMethod: text("payment_method"),
    notes: text("notes"),
    source: text("source").notNull().default("pos"), // pos | self_order
    serviceMode: text("service_mode").notNull().default("walk_in"), // walk_in | dine_in | pickup | delivery | take_away
    tableId: uuid("table_id").references(() => fnbTables.id, { onDelete: "set null" }),
    sessionId: uuid("session_id").references(() => fnbTableSessions.id, { onDelete: "set null" }),
    guestCount: integer("guest_count").notNull().default(1),
    holdState: text("hold_state").notNull().default("none"), // none | held | resumed | released
    heldAt: timestamp("held_at"),
    splitFromOrderId: uuid("split_from_order_id"),
    mergedIntoOrderId: uuid("merged_into_order_id"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),

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
        idxOrdersServiceMode: index("idx_orders_service_mode").on(table.organizationId, table.serviceMode),
        idxOrdersTable: index("idx_orders_table").on(table.tableId),
        idxOrdersSession: index("idx_orders_session").on(table.sessionId),
        idxOrdersHoldState: index("idx_orders_hold_state").on(table.organizationId, table.holdState),
        idxOrdersSource: index("idx_orders_source").on(table.organizationId, table.source),
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
    productId: uuid("product_id")
        .references(() => products.id, { onDelete: "set null" }),
    sku: varchar("sku", { length: 60 }),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    totalPrice: integer("total_price").notNull(),
    modifiers: jsonb("modifiers").$type<Array<{
        name: string;
        value?: string;
        price?: number;
    }>>().default([]),
    notes: text("notes"),
    station: text("station"), // kitchen | bar
    status: text("status").notNull().default("pending"), // pending | confirmed | preparing | ready | served | cancelled
    menuVersionId: uuid("menu_version_id").references(() => fnbMenuVersions.id, { onDelete: "set null" }),
    menuVersionItemId: uuid("menu_version_item_id").references(() => fnbMenuVersionItems.id, { onDelete: "set null" }),
    snapshotModifierSchema: jsonb("snapshot_modifier_schema").$type<Array<{
        name: string;
        type: "single_required" | "single_optional" | "multi_optional";
        maxSelect?: number;
        options: Array<{ name: string; price?: number }>;
    }>>().default([]),
    snapshotStation: text("snapshot_station"),
    snapshotPrepTimeMinutes: integer("snapshot_prep_time_minutes").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxOrderItemsOrder: index("idx_order_items_order").on(table.orderId),
        idxOrderItemsOrderStatus: index("idx_order_items_order_status").on(table.orderId, table.status),
        idxOrderItemsStation: index("idx_order_items_station").on(table.station),
        idxOrderItemsMenuVersion: index("idx_order_items_menu_version").on(table.menuVersionId),
        idxOrderItemsMenuVersionItem: index("idx_order_items_menu_version_item").on(table.menuVersionItemId),
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

export const orderBillParts = pgTable("order_bill_parts", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    partLabel: varchar("part_label", { length: 60 }).notNull(),
    amount: integer("amount").notNull(),
    paymentMethod: text("payment_method"),
    paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed | refunded
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxOrderBillPartsOrg: index("idx_order_bill_parts_org").on(table.organizationId),
        idxOrderBillPartsOrder: index("idx_order_bill_parts_order").on(table.orderId),
        idxOrderBillPartsOrgStatus: index("idx_order_bill_parts_org_status").on(table.organizationId, table.paymentStatus),
    };
});
