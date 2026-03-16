import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";
import { organization } from "./auth.schema";
import { branches } from "./core.schema";
import { customers } from "./core.schema";

export const payments = pgTable("payments", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
        .references(() => customers.id, { onDelete: "set null" }),
    amount: integer("amount").notNull(), // in smallest currency unit (e.g. IDR)
    status: text("status").notNull().default("PENDING"), // PENDING | SUCCESS | FAILED | REFUNDED
    reference: text("reference").unique(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxPaymentsOrg: index("idx_payments_org").on(table.organizationId),
        idxPaymentsOrgStatus: index("idx_payments_org_status").on(table.organizationId, table.status),
        idxPaymentsOrgCreated: index("idx_payments_org_created").on(table.organizationId, table.createdAt),
        idxPaymentsBranch: index("idx_payments_branch").on(table.branchId),
    };
});
