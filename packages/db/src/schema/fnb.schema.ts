import {
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    integer,
    boolean,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { branches } from "./core.schema";
import { products } from "./products.schema";

/**
 * FnB Tables
 * Master data meja per cabang untuk operasi dine-in.
 */
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
    status: text("status").notNull().default("available"), // available | occupied | reserved | cleaning | inactive
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
        uqFnbTablesOrgBranchCode: uniqueIndex("uq_fnb_tables_org_branch_code").on(
            table.organizationId,
            table.branchId,
            table.code
        ),
    };
});

/**
 * FnB Table Sessions
 * Sesi okupansi meja. Satu meja dapat memiliki banyak sesi historis.
 */
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
    orderId: uuid("order_id"), // optional link ke order aktif, tidak dipasang FK silang untuk menghindari siklus schema
    status: text("status").notNull().default("open"), // open | held | closed | cancelled
    holdState: text("hold_state").notNull().default("none"), // none | held | resumed | released
    guestCount: integer("guest_count").notNull().default(1),
    customerName: varchar("customer_name", { length: 150 }),
    notes: text("notes"),
    openedAt: timestamp("opened_at").defaultNow().notNull(),
    closedAt: timestamp("closed_at"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxFnbTableSessionsOrg: index("idx_fnb_table_sessions_org").on(table.organizationId),
        idxFnbTableSessionsOrgBranchStatus: index("idx_fnb_table_sessions_org_branch_status").on(
            table.organizationId,
            table.branchId,
            table.status
        ),
        idxFnbTableSessionsTableOpened: index("idx_fnb_table_sessions_table_opened").on(table.tableId, table.openedAt),
        idxFnbTableSessionsOrder: index("idx_fnb_table_sessions_order").on(table.orderId),
    };
});

/**
 * FnB Menu Schedule Rules
 * Jika sebuah produk punya rule aktif, produk hanya dapat dijual pada slot jadwal tersebut.
 */
export const fnbMenuScheduleRules = pgTable("fnb_menu_schedule_rules", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Minggu ... 6 = Sabtu
    startTime: varchar("start_time", { length: 5 }).notNull(), // HH:mm
    endTime: varchar("end_time", { length: 5 }).notNull(), // HH:mm
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxFnbMenuRulesOrg: index("idx_fnb_menu_rules_org").on(table.organizationId),
        idxFnbMenuRulesOrgProduct: index("idx_fnb_menu_rules_org_product").on(table.organizationId, table.productId),
        idxFnbMenuRulesOrgBranchDay: index("idx_fnb_menu_rules_org_branch_day").on(
            table.organizationId,
            table.branchId,
            table.dayOfWeek
        ),
        uqFnbMenuRulesUniqueSlot: uniqueIndex("uq_fnb_menu_rules_unique_slot").on(
            table.organizationId,
            table.productId,
            table.branchId,
            table.dayOfWeek,
            table.startTime,
            table.endTime
        ),
    };
});
