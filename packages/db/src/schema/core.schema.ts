import { pgTable, text, timestamp, boolean, uuid, varchar, integer, index } from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";

export const branches = pgTable("branches", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organizationId")
        .notNull()
        .references(() => organization.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 10 }).notNull(),
    address: varchar("address", { length: 300 }),
    phone: varchar("phone", { length: 20 }),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxBranchesOrg: index("idx_branches_org").on(table.organizationId),
        idxBranchesOrgActive: index("idx_branches_org_active").on(table.organizationId, table.isActive),
    }
});

export const customers = pgTable("customers", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organizationId")
        .notNull()
        .references(() => organization.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 150 }),
    address: varchar("address", { length: 300 }),
    loyaltyPoints: integer("loyaltyPoints").default(0),
    loyaltyTier: varchar("loyaltyTier", { length: 20 }).default('regular'),
    totalSpentRp: integer("totalSpentRp").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxCustomersOrg: index("idx_customers_org").on(table.organizationId),
        idxCustomersPhone: index("idx_customers_phone").on(table.organizationId, table.phone),
    }
});
