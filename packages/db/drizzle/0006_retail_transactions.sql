-- Migration: Retail Transactions + Stock Movements
-- Description: Add transactions, transaction_items, stock_movements, and inventory min_threshold

--> statement-breakpoint

-- ============================================
-- STEP 1: Add min_threshold to inventory_stocks
-- ============================================
ALTER TABLE "inventory_stocks" ADD COLUMN "min_threshold" integer DEFAULT 0 NOT NULL;

--> statement-breakpoint

-- ============================================
-- STEP 2: Create stock_movements table
-- ============================================
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text,
	"ref_type" text,
	"ref_id" text,
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Indexes for stock_movements
CREATE INDEX "idx_stock_movements_org_created" ON "stock_movements" USING btree ("organization_id", "created_at");
CREATE INDEX "idx_stock_movements_branch" ON "stock_movements" USING btree ("branch_id");
CREATE INDEX "idx_stock_movements_product" ON "stock_movements" USING btree ("product_id");
CREATE INDEX "idx_stock_movements_ref" ON "stock_movements" USING btree ("ref_type", "ref_id");

--> statement-breakpoint

-- Foreign keys for stock_movements
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organization_id_organization_id_fk"
	FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_inventory_products_id_fk"
	FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branch_id_branches_id_fk"
	FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_user_id_fk"
	FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint

-- ============================================
-- STEP 3: Create transactions table
-- ============================================
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid,
	"payment_method" text,
	"amount" integer NOT NULL,
	"type" text DEFAULT 'sale' NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Indexes for transactions
CREATE INDEX "idx_transactions_org" ON "transactions" USING btree ("organization_id");
CREATE INDEX "idx_transactions_org_status" ON "transactions" USING btree ("organization_id", "status");
CREATE INDEX "idx_transactions_org_created" ON "transactions" USING btree ("organization_id", "created_at");
CREATE INDEX "idx_transactions_branch" ON "transactions" USING btree ("branch_id");
CREATE INDEX "idx_transactions_customer" ON "transactions" USING btree ("customer_id");

--> statement-breakpoint

-- Foreign keys for transactions
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organization_id_organization_id_fk"
	FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_branch_id_branches_id_fk"
	FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk"
	FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_user_id_fk"
	FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;

--> statement-breakpoint

-- ============================================
-- STEP 4: Create transaction_items table
-- ============================================
CREATE TABLE "transaction_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Indexes for transaction_items
CREATE INDEX "idx_transaction_items_txn" ON "transaction_items" USING btree ("transaction_id");
CREATE INDEX "idx_transaction_items_product" ON "transaction_items" USING btree ("product_id");

--> statement-breakpoint

-- Foreign keys for transaction_items
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk"
	FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk"
	FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
