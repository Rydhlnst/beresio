import {
    pgTable,
    text,
    timestamp,
    uuid,
    integer,
    index,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth.schema";
import { branches, customers } from "./core.schema";
import { products } from "./products.schema";

export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
        .notNull()
        .references(() => branches.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
        .references(() => customers.id, { onDelete: "set null" }),
    paymentMethod: text("payment_method"),
    discountAmount: integer("discount_amount").notNull().default(0),
    taxAmount: integer("tax_amount").notNull().default(0),
    amount: integer("amount").notNull(),
    type: text("type").notNull().default("sale"), // sale | dp | pelunasan | refund
    status: text("status").notNull().default("paid"), // pending | paid | refunded
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdateFn(() => new Date()),
}, (table) => {
    return {
        idxTransactionsOrg: index("idx_transactions_org").on(table.organizationId),
        idxTransactionsOrgStatus: index("idx_transactions_org_status").on(table.organizationId, table.status),
        idxTransactionsOrgCreated: index("idx_transactions_org_created").on(table.organizationId, table.createdAt),
        idxTransactionsBranch: index("idx_transactions_branch").on(table.branchId),
        idxTransactionsCustomer: index("idx_transactions_customer").on(table.customerId),
    };
});

export const transactionItems = pgTable("transaction_items", {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
        .notNull()
        .references(() => transactions.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    subtotal: integer("subtotal").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
    return {
        idxTransactionItemsTxn: index("idx_transaction_items_txn").on(table.transactionId),
        idxTransactionItemsProduct: index("idx_transaction_items_product").on(table.productId),
    };
});
