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
    pgEnum,
    jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const betaBusinessTypeEnum = pgEnum("beta_business_type", [
    "fnb",
    "retail",
    "laundry",
    "grocery",
    "services",
    "other",
]);

export const betaBusinessSizeEnum = pgEnum("beta_business_size", [
    "solo",
    "1_5",
    "6_20",
    "21_50",
    "50_plus",
]);

export const betaReadinessEnum = pgEnum("beta_readiness", [
    "curious",
    "interested_not_urgent",
    "ready_soon",
    "urgent",
]);

export const betaApplicationStatusEnum = pgEnum("beta_application_status", [
    "PENDING",
    "REVIEWED",
    "ACCEPTED",
    "REJECTED",
]);

export const betaApplications = pgTable("beta_applications", {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    fullName: varchar("full_name", { length: 150 }).notNull(),
    email: varchar("email", { length: 150 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
    companyName: varchar("company_name", { length: 150 }).notNull(),
    roleInCompany: varchar("role_in_company", { length: 120 }).notNull(),

    businessType: betaBusinessTypeEnum("business_type").notNull(),
    businessSize: betaBusinessSizeEnum("business_size").notNull(),
    numberOfBranches: integer("number_of_branches").notNull(),
    currentToolsUsed: text("current_tools_used").notNull(),

    mainOperationalProblem: text("main_operational_problem").notNull(),
    currentBiggestChallenge: text("current_biggest_challenge").notNull(),
    expectedSolutionFromBeres: text("expected_solution_from_beres").notNull(),

    interestedModules: jsonb("interested_modules").$type<string[]>().default([]),
    betaReadiness: betaReadinessEnum("beta_readiness").notNull(),
    willingnessToGiveFeedback: boolean("willingness_to_give_feedback").notNull().default(false),

    status: betaApplicationStatusEnum("status").notNull().default("PENDING"),
    source: text("source"),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        uqBetaApplicationsEmail: uniqueIndex("uq_beta_applications_email").on(table.email),
        idxBetaApplicationsUser: index("idx_beta_applications_user").on(table.userId),
        idxBetaApplicationsCreated: index("idx_beta_applications_created").on(table.createdAt),
        idxBetaApplicationsStatusCreated: index("idx_beta_applications_status_created").on(table.status, table.createdAt),
    };
});

