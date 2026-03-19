import { pgTable, text, timestamp, uuid, index, uniqueIndex } from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { orders } from "./orders.schema";

export const pickupOrders = pgTable("pickup_orders", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
        .notNull()
        .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("Dikonfirmasi"),
    driverName: text("driver_name"),
    eta: text("eta"),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxPickupOrdersOrg: index("idx_pickup_orders_org").on(table.organizationId),
        idxPickupOrdersOrgStatus: index("idx_pickup_orders_org_status").on(table.organizationId, table.status),
        idxPickupOrdersOrder: index("idx_pickup_orders_order").on(table.orderId),
        uqPickupOrdersOrder: uniqueIndex("uq_pickup_orders_order").on(table.orderId),
    };
});
