-- FnB Phase 1 data model (idempotent)
-- Scope: tables, table_sessions, orders/order_items extension, products extension

CREATE TABLE IF NOT EXISTS "fnb_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(120) NOT NULL,
	"area" varchar(80),
	"capacity" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"qr_code_url" text,
	"position_x" integer,
	"position_y" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fnb_tables" ADD COLUMN IF NOT EXISTS "qr_code_url" text;
--> statement-breakpoint
ALTER TABLE "fnb_tables" ADD COLUMN IF NOT EXISTS "position_x" integer;
--> statement-breakpoint
ALTER TABLE "fnb_tables" ADD COLUMN IF NOT EXISTS "position_y" integer;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'fnb_tables_organization_id_organization_id_fk'
	) THEN
		ALTER TABLE "fnb_tables"
			ADD CONSTRAINT "fnb_tables_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'fnb_tables_branch_id_branches_id_fk'
	) THEN
		ALTER TABLE "fnb_tables"
			ADD CONSTRAINT "fnb_tables_branch_id_branches_id_fk"
			FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_tables_org" ON "fnb_tables" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_tables_org_branch" ON "fnb_tables" USING btree ("organization_id","branch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_tables_org_branch_status" ON "fnb_tables" USING btree ("organization_id","branch_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_tables_org_qr" ON "fnb_tables" USING btree ("organization_id","qr_code_url");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_tables_org_branch_code" ON "fnb_tables" USING btree ("organization_id","branch_id","code");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fnb_table_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"table_id" uuid NOT NULL,
	"order_id" uuid,
	"session_code" varchar(50),
	"source" text DEFAULT 'staff_pos' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"hold_state" text DEFAULT 'none' NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"customer_name" varchar(150),
	"notes" text,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"opened_by" text,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD COLUMN IF NOT EXISTS "session_code" varchar(50);
--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'staff_pos' NOT NULL;
--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD COLUMN IF NOT EXISTS "opened_by" text;
--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ALTER COLUMN "status" SET DEFAULT 'active';
--> statement-breakpoint
DO $$ BEGIN
	IF to_regclass('public.fnb_table_sessions') IS NOT NULL THEN
		UPDATE "fnb_table_sessions"
		SET "status" = 'active'
		WHERE "status" = 'open';
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'fnb_table_sessions_organization_id_organization_id_fk'
	) THEN
		ALTER TABLE "fnb_table_sessions"
			ADD CONSTRAINT "fnb_table_sessions_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'fnb_table_sessions_branch_id_branches_id_fk'
	) THEN
		ALTER TABLE "fnb_table_sessions"
			ADD CONSTRAINT "fnb_table_sessions_branch_id_branches_id_fk"
			FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'fnb_table_sessions_table_id_fnb_tables_id_fk'
	) THEN
		ALTER TABLE "fnb_table_sessions"
			ADD CONSTRAINT "fnb_table_sessions_table_id_fnb_tables_id_fk"
			FOREIGN KEY ("table_id") REFERENCES "public"."fnb_tables"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'fnb_table_sessions_opened_by_user_id_fk'
	) THEN
		ALTER TABLE "fnb_table_sessions"
			ADD CONSTRAINT "fnb_table_sessions_opened_by_user_id_fk"
			FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'fnb_table_sessions_created_by_user_id_fk'
	) THEN
		ALTER TABLE "fnb_table_sessions"
			ADD CONSTRAINT "fnb_table_sessions_created_by_user_id_fk"
			FOREIGN KEY ("created_by") REFERENCES "public"."user"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'fnb_table_sessions_updated_by_user_id_fk'
	) THEN
		ALTER TABLE "fnb_table_sessions"
			ADD CONSTRAINT "fnb_table_sessions_updated_by_user_id_fk"
			FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_sessions_org" ON "fnb_table_sessions" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_sessions_org_branch_status" ON "fnb_table_sessions" USING btree ("organization_id","branch_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_sessions_table" ON "fnb_table_sessions" USING btree ("table_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_sessions_order" ON "fnb_table_sessions" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_sessions_opened_by" ON "fnb_table_sessions" USING btree ("opened_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_sessions_source" ON "fnb_table_sessions" USING btree ("organization_id","source");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_sessions_org_session_code" ON "fnb_table_sessions" USING btree ("organization_id","session_code");
--> statement-breakpoint

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'pos' NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "service_mode" text DEFAULT 'walk_in' NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "table_id" uuid;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "session_id" uuid;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guest_count" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "hold_state" text DEFAULT 'none' NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "held_at" timestamp;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "split_from_order_id" uuid;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "merged_into_order_id" uuid;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "created_by" text;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'orders_table_id_fnb_tables_id_fk'
	) THEN
		ALTER TABLE "orders"
			ADD CONSTRAINT "orders_table_id_fnb_tables_id_fk"
			FOREIGN KEY ("table_id") REFERENCES "public"."fnb_tables"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'orders_session_id_fnb_table_sessions_id_fk'
	) THEN
		ALTER TABLE "orders"
			ADD CONSTRAINT "orders_session_id_fnb_table_sessions_id_fk"
			FOREIGN KEY ("session_id") REFERENCES "public"."fnb_table_sessions"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'orders_created_by_user_id_fk'
	) THEN
		ALTER TABLE "orders"
			ADD CONSTRAINT "orders_created_by_user_id_fk"
			FOREIGN KEY ("created_by") REFERENCES "public"."user"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_service_mode" ON "orders" USING btree ("organization_id","service_mode");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_table" ON "orders" USING btree ("table_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_session" ON "orders" USING btree ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_hold_state" ON "orders" USING btree ("organization_id","hold_state");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_source" ON "orders" USING btree ("organization_id","source");
--> statement-breakpoint

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_id" uuid;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "modifiers" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "notes" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "station" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_products_id_fk'
	) THEN
		ALTER TABLE "order_items"
			ADD CONSTRAINT "order_items_product_id_products_id_fk"
			FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_order_status" ON "order_items" USING btree ("order_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_station" ON "order_items" USING btree ("station");
--> statement-breakpoint

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "prep_time_minutes" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "station" text DEFAULT 'kitchen';
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "modifier_groups" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_available_dine_in" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_available_takeaway" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_available_delivery" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_org_station" ON "products" USING btree ("organization_id","station");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_org_avail_dine_in" ON "products" USING btree ("organization_id","is_available_dine_in");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_org_avail_takeaway" ON "products" USING btree ("organization_id","is_available_takeaway");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_org_avail_delivery" ON "products" USING btree ("organization_id","is_available_delivery");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "order_bill_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"part_label" varchar(60) NOT NULL,
	"amount" integer NOT NULL,
	"payment_method" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'order_bill_parts_organization_id_organization_id_fk'
	) THEN
		ALTER TABLE "order_bill_parts"
			ADD CONSTRAINT "order_bill_parts_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'order_bill_parts_order_id_orders_id_fk'
	) THEN
		ALTER TABLE "order_bill_parts"
			ADD CONSTRAINT "order_bill_parts_order_id_orders_id_fk"
			FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'order_bill_parts_created_by_user_id_fk'
	) THEN
		ALTER TABLE "order_bill_parts"
			ADD CONSTRAINT "order_bill_parts_created_by_user_id_fk"
			FOREIGN KEY ("created_by") REFERENCES "public"."user"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_bill_parts_org" ON "order_bill_parts" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_bill_parts_order" ON "order_bill_parts" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_bill_parts_org_status" ON "order_bill_parts" USING btree ("organization_id","payment_status");
