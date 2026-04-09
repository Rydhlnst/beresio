import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    integer,
    boolean,
    jsonb,
    bigserial,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { branches } from "./core.schema";

export const fnbTables = pgTable("fnb_tables", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 30 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    area: varchar("area", { length: 80 }),
    capacity: integer("capacity").notNull().default(1),
    status: text("status").notNull().default("available"), // available | ordering | occupied | bill_requested | cleaning
    qrCodeUrl: text("qr_code_url"),
    positionX: integer("position_x"),
    positionY: integer("position_y"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxFnbTablesOrg: index("idx_fnb_tables_org").on(table.organizationId),
        idxFnbTablesOrgBranch: index("idx_fnb_tables_org_branch").on(table.organizationId, table.branchId),
        idxFnbTablesOrgBranchStatus: index("idx_fnb_tables_org_branch_status").on(
            table.organizationId,
            table.branchId,
            table.status
        ),
        idxFnbTablesOrgQr: index("idx_fnb_tables_org_qr").on(table.organizationId, table.qrCodeUrl),
        uqFnbTablesOrgBranchCode: uniqueIndex("uq_fnb_tables_org_branch_code").on(
            table.organizationId,
            table.branchId,
            table.code
        ),
    };
});

export const fnbTableSessions = pgTable("fnb_table_sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    tableId: uuid("table_id")
        .notNull()
        .references(() => fnbTables.id, { onDelete: "cascade" }),
    orderId: uuid("order_id"), // legacy pointer to latest active order in session
    sessionCode: varchar("session_code", { length: 50 }),
    source: text("source").notNull().default("staff_pos"), // staff_pos | self_order
    status: text("status").notNull().default("active"), // active | held | closed | cancelled
    holdState: text("hold_state").notNull().default("none"), // none | held | resumed | released
    guestCount: integer("guest_count").notNull().default(1),
    customerName: varchar("customer_name", { length: 150 }),
    notes: text("notes"),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
    openedBy: text("opened_by").references(() => user.id, { onDelete: "set null" }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxFnbSessionsOrg: index("idx_fnb_sessions_org").on(table.organizationId),
        idxFnbSessionsOrgBranchStatus: index("idx_fnb_sessions_org_branch_status").on(
            table.organizationId,
            table.branchId,
            table.status
        ),
        idxFnbSessionsTable: index("idx_fnb_sessions_table").on(table.tableId),
        idxFnbSessionsOrder: index("idx_fnb_sessions_order").on(table.orderId),
        idxFnbSessionsOpenedBy: index("idx_fnb_sessions_opened_by").on(table.openedBy),
        idxFnbSessionsSource: index("idx_fnb_sessions_source").on(table.organizationId, table.source),
        uqFnbSessionsOrgSessionCode: uniqueIndex("uq_fnb_sessions_org_session_code").on(
            table.organizationId,
            table.sessionCode
        ),
    };
});

export const fnbSessionParticipants = pgTable("fnb_session_participants", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    tableSessionId: uuid("table_session_id")
        .notNull()
        .references(() => fnbTableSessions.id, { onDelete: "cascade" }),
    deviceId: varchar("device_id", { length: 120 }).notNull(),
    source: text("source").notNull().default("qr"), // qr | waiter
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxFnbSessionParticipantsOrg: index("idx_fnb_session_participants_org").on(table.organizationId),
        idxFnbSessionParticipantsSession: index("idx_fnb_session_participants_session").on(table.tableSessionId),
        uqFnbSessionParticipantsDevice: uniqueIndex("uq_fnb_session_participants_device").on(
            table.organizationId,
            table.tableSessionId,
            table.deviceId
        ),
    };
});

export const fnbMenuVersions = pgTable("fnb_menu_versions", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    status: text("status").notNull().default("draft"), // draft | active | archived
    activatedAt: timestamp("activated_at"),
    archivedAt: timestamp("archived_at"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxFnbMenuVersionsOrg: index("idx_fnb_menu_versions_org").on(table.organizationId),
        idxFnbMenuVersionsOrgBranchStatus: index("idx_fnb_menu_versions_org_branch_status").on(
            table.organizationId,
            table.branchId,
            table.status
        ),
        uqFnbMenuVersionsOrgBranchName: uniqueIndex("uq_fnb_menu_versions_org_branch_name").on(
            table.organizationId,
            table.branchId,
            table.name
        ),
    };
});

export const fnbMenuVersionItems = pgTable("fnb_menu_version_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    menuVersionId: uuid("menu_version_id")
        .notNull()
        .references(() => fnbMenuVersions.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    productId: uuid("product_id"),
    itemName: varchar("item_name", { length: 200 }).notNull(),
    unitPrice: integer("unit_price").notNull(),
    modifierSchema: jsonb("modifier_schema").$type<Array<{
        name: string;
        type: "single_required" | "single_optional" | "multi_optional";
        maxSelect?: number;
        options: Array<{ name: string; price?: number }>;
    }>>().default([]),
    station: text("station").default("kitchen"),
    prepTimeMinutes: integer("prep_time_minutes").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxFnbMenuItemsMenuVersion: index("idx_fnb_menu_items_menu_version").on(table.menuVersionId),
        idxFnbMenuItemsOrgBranchActive: index("idx_fnb_menu_items_org_branch_active").on(
            table.organizationId,
            table.branchId,
            table.isActive
        ),
        idxFnbMenuItemsProduct: index("idx_fnb_menu_items_product").on(table.productId),
        uqFnbMenuItemsMenuProduct: uniqueIndex("uq_fnb_menu_items_menu_product").on(
            table.menuVersionId,
            table.productId
        ),
    };
});

export const fnbDomainEvents = pgTable("fnb_domain_events", {
    id: uuid("id").primaryKey().defaultRandom(),
    sequence: bigserial("sequence", { mode: "number" }).notNull(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .references(() => branches.id, { onDelete: "set null" }),
    aggregateType: text("aggregate_type").notNull(), // order | table_session | payment
    aggregateId: text("aggregate_id").notNull(),
    eventType: text("event_type").notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    idempotencyKey: text("idempotency_key"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        uqFnbDomainEventsSequence: uniqueIndex("uq_fnb_domain_events_sequence").on(table.sequence),
        idxFnbDomainEventsOrgSequence: index("idx_fnb_domain_events_org_sequence").on(
            table.organizationId,
            table.sequence
        ),
        idxFnbDomainEventsEventType: index("idx_fnb_domain_events_event_type").on(table.eventType),
        idxFnbDomainEventsAggregate: index("idx_fnb_domain_events_aggregate").on(
            table.aggregateType,
            table.aggregateId
        ),
        idxFnbDomainEventsBranch: index("idx_fnb_domain_events_branch").on(table.branchId),
    };
});

export const fnbProjectorCheckpoints = pgTable("fnb_projector_checkpoints", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    projectorName: varchar("projector_name", { length: 100 }).notNull(),
    lastSequence: integer("last_sequence").notNull().default(0),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        uqFnbProjectorCheckpoint: uniqueIndex("uq_fnb_projector_checkpoint").on(
            table.organizationId,
            table.projectorName
        ),
    };
});

export const fnbCommandIdempotency = pgTable("fnb_command_idempotency", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    scope: varchar("scope", { length: 180 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 180 }).notNull(),
    requestHash: varchar("request_hash", { length: 128 }),
    responseStatus: integer("response_status").notNull(),
    responseBody: jsonb("response_body").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        uqFnbCommandIdempotencyKey: uniqueIndex("uq_fnb_command_idempotency_key").on(
            table.organizationId,
            table.scope,
            table.idempotencyKey
        ),
        idxFnbCommandIdempotencyCreated: index("idx_fnb_command_idempotency_created").on(
            table.organizationId,
            table.createdAt
        ),
    };
});

export const fnbKdsItems = pgTable("fnb_kds_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").notNull(),
    orderItemId: uuid("order_item_id").notNull(),
    sessionId: uuid("session_id"),
    tableId: uuid("table_id"),
    station: text("station").default("kitchen"),
    status: text("status").notNull().default("new"), // new | cooking | ready | served
    priority: integer("priority").notNull().default(0),
    targetReadyAt: timestamp("target_ready_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    elapsedSeconds: integer("elapsed_seconds").notNull().default(0),
    isOverdue: boolean("is_overdue").notNull().default(false),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        uqFnbKdsOrderItem: uniqueIndex("uq_fnb_kds_order_item").on(table.orderItemId),
        idxFnbKdsOrgBranchStatus: index("idx_fnb_kds_org_branch_status").on(
            table.organizationId,
            table.branchId,
            table.status
        ),
        idxFnbKdsOrgBranchStationStatus: index("idx_fnb_kds_org_branch_station_status").on(
            table.organizationId,
            table.branchId,
            table.station,
            table.status
        ),
        idxFnbKdsPriority: index("idx_fnb_kds_priority").on(table.organizationId, table.priority),
    };
});
