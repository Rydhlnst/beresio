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
    pgEnum,
} from "drizzle-orm/pg-core";
import { user, organization } from "./auth.schema";

/**
 * Business Type Enum
 * - laundry: Laundry business type
 * - fnb: Food & Beverage business type
 * - retail: Retail business type
 */
export const businessTypeEnum = pgEnum("business_type", ["laundry", "fnb", "retail"]);

/**
 * Businesses Table
 * Multi-business support with type differentiation
 */
export const businesses = pgTable("businesses", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Link to organization (for auth/team structure)
    organizationId: text("organization_id")
        .references(() => organization.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    slug: varchar("slug", { length: 100 }).unique(),
    businessType: businessTypeEnum("business_type").notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 150 }),
    address: text("address"),
    isActive: boolean("is_active").default(true),
    settings: jsonb("settings").default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxBusinessesOrg: index("idx_businesses_org").on(table.organizationId),
        idxBusinessesType: index("idx_businesses_type").on(table.businessType),
        idxBusinessesOrgActive: index("idx_businesses_org_active").on(table.organizationId, table.isActive),
        idxBusinessesSlug: index("idx_businesses_slug").on(table.slug),
    };
});

/**
 * Business Modules Table
 * Active modules per business with settings
 */
export const businessModules = pgTable("business_modules", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Reference to business (not organization directly)
    businessId: uuid("business_id")
        .notNull()
        .references(() => businesses.id, { onDelete: "cascade" }),
    moduleKey: varchar("module_key", { length: 50 }).notNull(),
    moduleName: varchar("module_name", { length: 100 }),
    isActive: boolean("is_active").default(true),
    settings: jsonb("settings").default({}),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxBusinessModulesBusiness: index("idx_business_modules_business").on(table.businessId),
        idxBusinessModulesBusinessActive: index("idx_business_modules_business_active").on(table.businessId, table.isActive),
        idxBusinessModulesBusinessDisplay: index("idx_business_modules_business_display").on(table.businessId, table.displayOrder),
        uqBusinessModulesBusinessKey: uniqueIndex("uq_business_modules_business_key").on(table.businessId, table.moduleKey),
    };
});

/**
 * User Business Access Table
 * User-business relationship for multi-business support
 */
export const userBusinessAccess = pgTable("user_business_access", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    // Reference to business (not organization directly)
    businessId: uuid("business_id")
        .notNull()
        .references(() => businesses.id, { onDelete: "cascade" }),
    role: text("role").default("owner"),
    isCurrentActive: boolean("is_current_active").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxUserBusinessAccessUser: index("idx_user_business_access_user").on(table.userId),
        idxUserBusinessAccessBusiness: index("idx_user_business_access_business").on(table.businessId),
        idxUserBusinessAccessCurrent: index("idx_user_business_access_current").on(table.userId, table.isCurrentActive),
        uqUserBusinessAccessUserBusiness: uniqueIndex("uq_user_business_access_user_business").on(table.userId, table.businessId),
    };
});
