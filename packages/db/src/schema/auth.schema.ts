import { pgTable, text, timestamp, boolean, uuid, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    activeOrganizationId: text("active_organization_id"),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    activeOrganizationId: text("active_organization_id"),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
});

export const organization = pgTable("organization", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
    // Additional fields requested
    businessType: text("business_type").notNull(),
    subscriptionPlan: text("subscription_plan").default("starter"),
    logoUrl: text("logo_url")
});

export const roles = pgTable("roles", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 50 }).notNull(),
    description: text("description"),
    isSystem: boolean("is_system").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxRolesOrg: index("idx_roles_org").on(table.organizationId),
        uqRolesOrgSlug: uniqueIndex("uq_roles_org_slug").on(table.organizationId, table.slug),
    };
});

export const rolePermissions = pgTable("role_permissions", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
        .notNull()
        .references(() => roles.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxRolePermissionsOrg: index("idx_role_permissions_org").on(table.organizationId),
        idxRolePermissionsRole: index("idx_role_permissions_role").on(table.roleId),
        uqRolePermissionsRolePerm: uniqueIndex("uq_role_permissions_role_perm").on(table.roleId, table.permission),
    };
});

export const member = pgTable("member", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
    status: text("status").notNull().default("active"),
    deactivatedAt: timestamp("deactivated_at"),
    createdAt: timestamp("created_at").notNull()
});

export const team = pgTable("team", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at"),
});

export const teamMember = pgTable("team_member", {
    id: text("id").primaryKey(),
    teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull(),
});

export const invitation = pgTable("invitation", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    teamId: text("team_id").references(() => team.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    role: text("role"),
    roleId: uuid("role_id").references(() => roles.id, { onDelete: "set null" }),
    branchId: uuid("branch_id"),
    status: text("status").notNull(),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
    inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" })
});
