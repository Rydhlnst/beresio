import {
    pgTable,
    text,
    timestamp,
    boolean,
    uuid,
    varchar,
    integer,
    jsonb,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { inventoryProducts } from "./inventory.schema";

/**
 * Product Categories Table
 * Kategori produk untuk retail (hierarchical support)
 */
export const productCategories = pgTable("product_categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }),
    description: text("description"),
    parentId: uuid("parent_id"),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxProductCategoriesOrg: index("idx_product_categories_org").on(table.organizationId),
        idxProductCategoriesOrgActive: index("idx_product_categories_org_active").on(table.organizationId, table.isActive),
        idxProductCategoriesParent: index("idx_product_categories_parent").on(table.parentId),
        uqProductCategoriesOrgSlug: uniqueIndex("uq_product_categories_org_slug").on(table.organizationId, table.slug),
    };
});

/**
 * Suppliers Table
 * Pemasok untuk produk retail
 */
export const suppliers = pgTable("suppliers", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    
    // Basic Info
    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 30 }),
    
    // Contact
    contactName: varchar("contact_name", { length: 100 }),
    email: varchar("email", { length: 150 }),
    phone: varchar("phone", { length: 20 }),
    
    // Address
    address: text("address"),
    city: varchar("city", { length: 50 }),
    province: varchar("province", { length: 50 }),
    postalCode: varchar("postal_code", { length: 10 }),
    
    // Bank Info (for payments)
    bankName: varchar("bank_name", { length: 50 }),
    bankAccountNumber: varchar("bank_account_number", { length: 30 }),
    bankAccountName: varchar("bank_account_name", { length: 100 }),
    
    // Status
    isActive: boolean("is_active").default(true),
    notes: text("notes"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxSuppliersOrg: index("idx_suppliers_org").on(table.organizationId),
        idxSuppliersOrgActive: index("idx_suppliers_org_active").on(table.organizationId, table.isActive),
        uqSuppliersOrgCode: uniqueIndex("uq_suppliers_org_code").on(table.organizationId, table.code),
    };
});

/**
 * Products Table
 * Katalog produk untuk business type RETAIL
 */
export const products = pgTable("products", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    
    // Basic Info
    name: varchar("name", { length: 150 }).notNull(),
    sku: varchar("sku", { length: 60 }),
    barcode: varchar("barcode", { length: 50 }),
    
    // Categorization
    categoryId: uuid("category_id").references(() => productCategories.id, { onDelete: "set null" }),
    
    // Pricing (in rupiah, store as integer)
    basePrice: integer("base_price").notNull().default(0),
    salePrice: integer("sale_price"), // Final selling price
    costPrice: integer("cost_price"), // COGS for margin calculation
    
    // Inventory Link (optional, for stock tracking)
    inventoryProductId: uuid("inventory_product_id")
        .references(() => inventoryProducts.id, { onDelete: "set null" }),
    
    // Media
    imageUrl: text("image_url"),
    images: jsonb("images").$type<string[]>().default([]),
    
    // Details
    description: text("description"),
    shortDescription: varchar("short_description", { length: 255 }),
    weight: integer("weight"), // in grams
    dimensions: jsonb("dimensions").$type<{
        length?: number;
        width?: number;
        height?: number;
    }>().default({}),
    
    // SEO/Marketplace
    slug: varchar("slug", { length: 150 }),
    metaTitle: varchar("meta_title", { length: 150 }),
    metaDescription: text("meta_description"),
    
    // Supplier
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    
    // Status
    isActive: boolean("is_active").default(true),
    isFeatured: boolean("is_featured").default(false),
    
    // Track sold count for popularity
    soldCount: integer("sold_count").default(0),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxProductsOrg: index("idx_products_org").on(table.organizationId),
        idxProductsOrgActive: index("idx_products_org_active").on(table.organizationId, table.isActive),
        idxProductsCategory: index("idx_products_category").on(table.categoryId),
        idxProductsSupplier: index("idx_products_supplier").on(table.supplierId),
        idxProductsSku: index("idx_products_sku").on(table.sku),
        idxProductsBarcode: index("idx_products_barcode").on(table.barcode),
        uqProductsOrgSku: uniqueIndex("uq_products_org_sku").on(table.organizationId, table.sku),
    };
});

// Types
export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
