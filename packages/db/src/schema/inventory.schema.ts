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

export const inventoryProducts = pgTable("inventory_products", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    sku: varchar("sku", { length: 60 }),
    unit: varchar("unit", { length: 32 }),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxInventoryProductsOrg: index("idx_inventory_products_org").on(table.organizationId),
        idxInventoryProductsOrgActive: index("idx_inventory_products_org_active").on(table.organizationId, table.isActive),
        uqInventoryProductsOrgSku: uniqueIndex("uq_inventory_products_org_sku").on(table.organizationId, table.sku),
    };
});

export const inventoryStocks = pgTable("inventory_stocks", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => inventoryProducts.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    minThreshold: integer("min_threshold").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxInventoryStocksOrg: index("idx_inventory_stocks_org").on(table.organizationId),
        idxInventoryStocksBranch: index("idx_inventory_stocks_branch").on(table.branchId),
        idxInventoryStocksProduct: index("idx_inventory_stocks_product").on(table.productId),
        uqInventoryStocksProductBranch: uniqueIndex("uq_inventory_stocks_product_branch").on(table.productId, table.branchId),
    };
});

export const inventoryAdjustments = pgTable("inventory_adjustments", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => inventoryProducts.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    quantityDelta: integer("quantity_delta").notNull(),
    reason: text("reason"),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxInventoryAdjustmentsOrgCreated: index("idx_inventory_adjustments_org_created").on(table.organizationId, table.createdAt),
        idxInventoryAdjustmentsBranch: index("idx_inventory_adjustments_branch").on(table.branchId),
        idxInventoryAdjustmentsProduct: index("idx_inventory_adjustments_product").on(table.productId),
    };
});

export const inventoryTransfers = pgTable("inventory_transfers", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => inventoryProducts.id, { onDelete: "cascade" }),
    fromBranchId: uuid("from_branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    toBranchId: uuid("to_branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    status: text("status").notNull().default("pending"),
    note: text("note"),
    requestedBy: text("requested_by").references(() => user.id, { onDelete: "set null" }),
    decidedBy: text("decided_by").references(() => user.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxInventoryTransfersOrg: index("idx_inventory_transfers_org").on(table.organizationId),
        idxInventoryTransfersOrgStatus: index("idx_inventory_transfers_org_status").on(table.organizationId, table.status),
        idxInventoryTransfersProduct: index("idx_inventory_transfers_product").on(table.productId),
        idxInventoryTransfersFromBranch: index("idx_inventory_transfers_from_branch").on(table.fromBranchId),
        idxInventoryTransfersToBranch: index("idx_inventory_transfers_to_branch").on(table.toBranchId),
    };
});

export const stockMovements = pgTable("stock_movements", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => inventoryProducts.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: text("reason"),
    refType: text("ref_type"),
    refId: text("ref_id"),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxStockMovementsOrgCreated: index("idx_stock_movements_org_created").on(table.organizationId, table.createdAt),
        idxStockMovementsBranch: index("idx_stock_movements_branch").on(table.branchId),
        idxStockMovementsProduct: index("idx_stock_movements_product").on(table.productId),
        idxStockMovementsRef: index("idx_stock_movements_ref").on(table.refType, table.refId),
    };
});
