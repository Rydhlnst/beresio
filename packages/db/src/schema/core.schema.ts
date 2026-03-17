import { pgTable, text, timestamp, boolean, uuid, varchar, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { organization, member } from "./auth.schema";

export const branches = pgTable("branches", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 10 }).notNull(),
    address: varchar("address", { length: 300 }),
    phone: varchar("phone", { length: 20 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxBranchesOrg: index("idx_branches_org").on(table.organizationId),
        idxBranchesOrgActive: index("idx_branches_org_active").on(table.organizationId, table.isActive),
    }
});

export const customers = pgTable("customers", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: 'cascade' }),
    name: varchar("name", { length: 150 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 150 }),
    address: varchar("address", { length: 300 }),
    loyaltyPoints: integer("loyalty_points").default(0),
    loyaltyTier: varchar("loyalty_tier", { length: 20 }).default('regular'),
    totalSpentRp: integer("total_spent_rp").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxCustomersOrg: index("idx_customers_org").on(table.organizationId),
        idxCustomersPhone: index("idx_customers_phone").on(table.organizationId, table.phone),
    }
});

export const branchMembers = pgTable("branch_members", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: 'cascade' }),
    memberId: text("member_id")
        .notNull()
        .references(() => member.id, { onDelete: 'cascade' }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: 'cascade' }),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxBranchMembersOrg: index("idx_branch_members_org").on(table.organizationId),
        idxBranchMembersMember: index("idx_branch_members_member").on(table.memberId),
        idxBranchMembersBranch: index("idx_branch_members_branch").on(table.branchId),
        idxBranchMembersOrgBranch: index("idx_branch_members_org_branch").on(table.organizationId, table.branchId),
        uqBranchMembersMemberBranch: uniqueIndex("uq_branch_members_member_branch").on(table.memberId, table.branchId),
    }
});
