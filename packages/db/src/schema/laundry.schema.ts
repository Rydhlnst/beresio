import {
    bigserial,
    boolean,
    date,
    index,
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { branches, customers } from "./core.schema";

export const laundryServices = pgTable("laundry_services", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    unit: varchar("unit", { length: 20 }).notNull().default("kg"),
    basePrice: integer("base_price").notNull(),
    estimatedDurationHours: integer("estimated_duration_hours").notNull().default(24),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxLaundryServicesOrgBranch: index("idx_laundry_services_org_branch").on(table.organizationId, table.branchId),
        idxLaundryServicesOrgBranchActive: index("idx_laundry_services_org_branch_active").on(
            table.organizationId,
            table.branchId,
            table.isActive
        ),
        idxLaundryServicesOrgBranchCreated: index("idx_laundry_services_org_branch_created").on(
            table.organizationId,
            table.branchId,
            table.createdAt
        ),
        uqLaundryServicesOrgBranchName: uniqueIndex("uq_laundry_services_org_branch_name").on(
            table.organizationId,
            table.branchId,
            table.name
        ),
    };
});

export const laundryOrders = pgTable("laundry_orders", {
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
    status: text("status").notNull().default("received"), // received | processing | ready_for_pickup | out_for_delivery | completed | cancelled
    orderType: text("order_type").notNull().default("walk_in"), // walk_in | pickup | drop_off
    customerName: varchar("customer_name", { length: 150 }),
    customerPhone: varchar("customer_phone", { length: 20 }),
    customerAddress: text("customer_address"),
    notes: text("notes"),
    estimatedCompletedAt: timestamp("estimated_completed_at"),
    subtotalAmount: integer("subtotal_amount").notNull(),
    discountAmount: integer("discount_amount").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    totalAmount: integer("total_amount").notNull(),
    paidAmount: integer("paid_amount").notNull().default(0),
    remainingAmount: integer("remaining_amount").notNull(),
    paymentStatus: text("payment_status").notNull().default("pending"), // pending | partial | paid
    assignedDriverId: text("assigned_driver_id").references(() => user.id, { onDelete: "set null" }),
    assignedDriverName: varchar("assigned_driver_name", { length: 150 }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
    completedAt: timestamp("completed_at"),
    cancelledAt: timestamp("cancelled_at"),
}, (table) => {
    return {
        idxLaundryOrdersOrgBranch: index("idx_laundry_orders_org_branch").on(table.organizationId, table.branchId),
        idxLaundryOrdersOrgBranchStatus: index("idx_laundry_orders_org_branch_status").on(
            table.organizationId,
            table.branchId,
            table.status
        ),
        idxLaundryOrdersOrgBranchCreated: index("idx_laundry_orders_org_branch_created").on(
            table.organizationId,
            table.branchId,
            table.createdAt
        ),
        idxLaundryOrdersOrgBranchPhone: index("idx_laundry_orders_org_branch_phone").on(
            table.organizationId,
            table.branchId,
            table.customerPhone
        ),
        idxLaundryOrdersOrgBranchOutstanding: index("idx_laundry_orders_org_branch_outstanding").on(
            table.organizationId,
            table.branchId,
            table.remainingAmount
        ),
        uqLaundryOrdersOrgBranchNumber: uniqueIndex("uq_laundry_orders_org_branch_number").on(
            table.organizationId,
            table.branchId,
            table.orderNumber
        ),
    };
});

export const laundryOrderItems = pgTable("laundry_order_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => laundryOrders.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
        .references(() => laundryServices.id, { onDelete: "set null" }),
    serviceName: varchar("service_name", { length: 150 }).notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: integer("unit_price").notNull(),
    lineTotal: integer("line_total").notNull(),
    estimatedDurationHours: integer("estimated_duration_hours").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxLaundryOrderItemsOrder: index("idx_laundry_order_items_order").on(table.orderId),
        idxLaundryOrderItemsService: index("idx_laundry_order_items_service").on(table.serviceId),
    };
});

export const laundryPayments = pgTable("laundry_payments", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
        .notNull()
        .references(() => laundryOrders.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    paymentMethod: text("payment_method"),
    note: text("note"),
    recordedBy: text("recorded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxLaundryPaymentsOrgBranch: index("idx_laundry_payments_org_branch").on(table.organizationId, table.branchId),
        idxLaundryPaymentsOrder: index("idx_laundry_payments_order").on(table.orderId),
        idxLaundryPaymentsOrgBranchCreated: index("idx_laundry_payments_org_branch_created").on(
            table.organizationId,
            table.branchId,
            table.createdAt
        ),
    };
});

export const laundryOrderStatusHistory = pgTable("laundry_order_status_history", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
        .notNull()
        .references(() => laundryOrders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    note: text("note"),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxLaundryStatusHistoryOrder: index("idx_laundry_status_history_order").on(table.orderId),
        idxLaundryStatusHistoryOrgBranchCreated: index("idx_laundry_status_history_org_branch_created").on(
            table.organizationId,
            table.branchId,
            table.createdAt
        ),
    };
});

export const laundryDomainEvents = pgTable("laundry_domain_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    sequence: bigserial("sequence", { mode: "number" }).notNull(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .references(() => branches.id, { onDelete: "set null" }),
    orderId: uuid("order_id")
        .notNull()
        .references(() => laundryOrders.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        uqLaundryDomainEventsSequence: uniqueIndex("uq_laundry_domain_events_sequence").on(table.sequence),
        idxLaundryDomainEventsOrgSequence: index("idx_laundry_domain_events_org_sequence").on(
            table.organizationId,
            table.sequence
        ),
        idxLaundryDomainEventsType: index("idx_laundry_domain_events_type").on(table.eventType),
        idxLaundryDomainEventsOrder: index("idx_laundry_domain_events_order").on(table.orderId),
        idxLaundryDomainEventsBranch: index("idx_laundry_domain_events_branch").on(table.branchId),
    };
});

export const laundryNotificationOutbox = pgTable("laundry_notification_outbox", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
        .notNull()
        .references(() => laundryOrders.id, { onDelete: "cascade" }),
    domainEventId: uuid("domain_event_id")
        .notNull()
        .references(() => laundryDomainEvents.id, { onDelete: "cascade" }),
    channel: text("channel").notNull().default("whatsapp"),
    status: text("status").notNull().default("queued"), // queued | processing | sent | failed | dead_letter
    templateSnapshot: text("template_snapshot"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextRetryAt: timestamp("next_retry_at"),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxLaundryOutboxOrgStatus: index("idx_laundry_outbox_org_status").on(table.organizationId, table.status),
        idxLaundryOutboxNextRetry: index("idx_laundry_outbox_next_retry").on(table.nextRetryAt),
        idxLaundryOutboxOrgCreated: index("idx_laundry_outbox_org_created").on(table.organizationId, table.createdAt),
        idxLaundryOutboxOrder: index("idx_laundry_outbox_order").on(table.orderId),
        uqLaundryOutboxEventChannel: uniqueIndex("uq_laundry_outbox_event_channel").on(table.domainEventId, table.channel),
    };
});

export const laundryOrderSequences = pgTable("laundry_order_sequences", {
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    sequenceDate: date("sequence_date").notNull(),
    lastNumber: integer("last_number").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        uqLaundrySequencesOrgBranchDate: uniqueIndex("uq_laundry_sequences_org_branch_date").on(
            table.organizationId,
            table.branchId,
            table.sequenceDate
        ),
    };
});
