import {
    pgTable,
    text,
    timestamp,
    boolean,
    uuid,
    varchar,
    integer,
    numeric,
    index,
    uniqueIndex,
    pgEnum
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { organization } from "./auth.schema";
import { branches } from "./core.schema";

/**
 * BI Cost Item Category Enum
 */
export const biCostCategoryEnum = pgEnum("bi_cost_category", ["chemical", "utility", "labor", "fixed_cost", "maintenance"]);

/**
 * BI Cost Usage Metric Enum
 */
export const biUsageMetricEnum = pgEnum("bi_usage_metric", ["per_kg", "per_cycle", "per_month", "per_liter", "per_kwh"]);

/**
 * BI Cost Items Table
 * Tracks dynamic chemical, utility, labor, overhead items for calculating HPP
 */
export const biCostItems = pgTable("bi_cost_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    category: biCostCategoryEnum("category").notNull(),
    usageMetric: biUsageMetricEnum("usage_metric").notNull(),
    usageAmount: numeric("usage_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    pricePerUnit: numeric("price_per_unit", { precision: 15, scale: 2 }).notNull().default("0"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxBiCostItemsOrgBranch: index("idx_bi_cost_items_org_branch").on(table.organizationId, table.branchId),
        idxBiCostItemsCategory: index("idx_bi_cost_items_category").on(table.organizationId, table.branchId, table.category),
    };
});

/**
 * BI Machine Operations Configurations Table
 * Machine operation modeling based on real usage
 */
export const biMachineOperations = pgTable("bi_machine_operations", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    totalMachines: integer("total_machines").notNull().default(1),
    capacityPerMachineKg: integer("capacity_per_machine_kg").notNull().default(10),
    optimalUsagePercent: numeric("optimal_usage_percent", { precision: 5, scale: 2 }).notNull().default("50"),
    cycleTimeMinutes: integer("cycle_time_minutes").notNull().default(60),
    operationalHoursPerDay: integer("operational_hours_per_day").notNull().default(12),
    waterConsumptionPerCycleLiters: numeric("water_consumption_per_cycle_liters", { precision: 10, scale: 2 }).notNull().default("0"),
    electricityConsumptionPerCycleKwh: numeric("electricity_consumption_per_cycle_kwh", { precision: 10, scale: 2 }).notNull().default("0"),
    waterPricePerM3: numeric("water_price_per_m3", { precision: 15, scale: 2 }).notNull().default("0"),
    electricityPricePerKwh: numeric("electricity_price_per_kwh", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        uqBiMachineOperationsOrgBranch: uniqueIndex("uq_bi_machine_ops_org_branch").on(table.organizationId, table.branchId),
    };
});

/**
 * BI Profit & Pricing Settings Table
 */
export const biProfitSettings = pgTable("bi_profit_settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    targetMarginPercent: numeric("target_margin_percent", { precision: 5, scale: 2 }).notNull().default("30"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        uqBiProfitSettingsOrgBranch: uniqueIndex("uq_bi_profit_settings_org_branch").on(table.organizationId, table.branchId),
    };
});

/**
 * BI Labor Configurations Table
 * To track total labor cost directly to distribute per volume
 */
export const biLaborConfigs = pgTable("bi_labor_configs", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    employeeCount: integer("employee_count").notNull().default(1),
    salaryPerMonth: numeric("salary_per_month", { precision: 15, scale: 2 }).notNull().default("0"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        uqBiLaborConfigsOrgBranch: uniqueIndex("uq_bi_labor_configs_org_branch").on(table.organizationId, table.branchId),
    };
});

// Type definitions
export type BiCostItem = InferSelectModel<typeof biCostItems>;
export type NewBiCostItem = InferInsertModel<typeof biCostItems>;

export type BiMachineOperation = InferSelectModel<typeof biMachineOperations>;
export type NewBiMachineOperation = InferInsertModel<typeof biMachineOperations>;

export type BiProfitSetting = InferSelectModel<typeof biProfitSettings>;
export type NewBiProfitSetting = InferInsertModel<typeof biProfitSettings>;

export type BiLaborConfig = InferSelectModel<typeof biLaborConfigs>;
export type NewBiLaborConfig = InferInsertModel<typeof biLaborConfigs>;

