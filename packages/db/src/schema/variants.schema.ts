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
 * Product Variants Table
 * Variants for retail products (size/color/material)
 */
export const productVariants = pgTable("product_variants", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 60 }),
    barcode: varchar("barcode", { length: 50 }),
    option1: varchar("option_1", { length: 50 }),
    option2: varchar("option_2", { length: 50 }),
    option3: varchar("option_3", { length: 50 }),
    price: integer("price"),
    compareAtPrice: integer("compare_at_price"),
    costPrice: integer("cost_price"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxProductVariantsOrg: index("idx_product_variants_org").on(table.organizationId),
        idxProductVariantsOrgActive: index("idx_product_variants_org_active").on(table.organizationId, table.isActive),
        idxProductVariantsProduct: index("idx_product_variants_product").on(table.productId),
        idxProductVariantsSku: index("idx_product_variants_sku").on(table.sku),
        idxProductVariantsBarcode: index("idx_product_variants_barcode").on(table.barcode),
        uqProductVariantsOrgSku: uniqueIndex("uq_product_variants_org_sku").on(table.organizationId, table.sku),
        uqProductVariantsOrgBarcode: uniqueIndex("uq_product_variants_org_barcode").on(table.organizationId, table.barcode),
        uqProductVariantsProductOptions: uniqueIndex("uq_product_variants_product_options").on(
            table.productId,
            table.option1,
            table.option2,
            table.option3
        ),
    };
});

/**
 * Inventory Variant Stocks Table
 * Stock per variant per branch
 */
export const inventoryVariantStocks = pgTable("inventory_variant_stocks", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
        .notNull()
        .references(() => productVariants.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    minThreshold: integer("min_threshold").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxInventoryVariantStocksOrg: index("idx_inventory_variant_stocks_org").on(table.organizationId),
        idxInventoryVariantStocksBranch: index("idx_inventory_variant_stocks_branch").on(table.branchId),
        idxInventoryVariantStocksVariant: index("idx_inventory_variant_stocks_variant").on(table.variantId),
        uqInventoryVariantStocksVariantBranch: uniqueIndex("uq_inventory_variant_stocks_variant_branch").on(
            table.variantId,
            table.branchId
        ),
    };
});

/**
 * Variant Stock Movements Table
 * Audit trail for variant stock changes
 */
export const variantStockMovements = pgTable("variant_stock_movements", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
        .notNull()
        .references(() => productVariants.id, { onDelete: "cascade" }),
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
        idxVariantStockMovementsOrgCreated: index("idx_variant_stock_movements_org_created").on(
            table.organizationId,
            table.createdAt
        ),
        idxVariantStockMovementsBranch: index("idx_variant_stock_movements_branch").on(table.branchId),
        idxVariantStockMovementsVariant: index("idx_variant_stock_movements_variant").on(table.variantId),
        idxVariantStockMovementsRef: index("idx_variant_stock_movements_ref").on(table.refType, table.refId),
    };
});

// Types
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

export type InventoryVariantStock = typeof inventoryVariantStocks.$inferSelect;
export type NewInventoryVariantStock = typeof inventoryVariantStocks.$inferInsert;

export type VariantStockMovement = typeof variantStockMovements.$inferSelect;
export type NewVariantStockMovement = typeof variantStockMovements.$inferInsert;
