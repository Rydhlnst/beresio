-- Laundry MVP Vertical 1 (P0 + P1 hooks)
-- Safe/idempotent migration for new laundry domain tables

CREATE TABLE IF NOT EXISTS "laundry_services" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" text NOT NULL,
    "branch_id" uuid NOT NULL,
    "name" varchar(150) NOT NULL,
    "unit" varchar(20) DEFAULT 'kg' NOT NULL,
    "base_price" integer NOT NULL,
    "estimated_duration_hours" integer DEFAULT 24 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_services_organization_id_organization_id_fk') THEN
        ALTER TABLE "laundry_services"
            ADD CONSTRAINT "laundry_services_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_services_branch_id_branches_id_fk') THEN
        ALTER TABLE "laundry_services"
            ADD CONSTRAINT "laundry_services_branch_id_branches_id_fk"
            FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_services_org_branch" ON "laundry_services" USING btree ("organization_id","branch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_services_org_branch_active" ON "laundry_services" USING btree ("organization_id","branch_id","is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_services_org_branch_created" ON "laundry_services" USING btree ("organization_id","branch_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_laundry_services_org_branch_name" ON "laundry_services" USING btree ("organization_id","branch_id","name");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "laundry_orders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" text NOT NULL,
    "branch_id" uuid NOT NULL,
    "customer_id" uuid,
    "order_number" varchar(32) NOT NULL,
    "status" text DEFAULT 'received' NOT NULL,
    "order_type" text DEFAULT 'walk_in' NOT NULL,
    "customer_name" varchar(150),
    "customer_phone" varchar(20),
    "customer_address" text,
    "notes" text,
    "estimated_completed_at" timestamp,
    "subtotal_amount" integer NOT NULL,
    "discount_amount" integer DEFAULT 0 NOT NULL,
    "tax_amount" integer DEFAULT 0 NOT NULL,
    "total_amount" integer NOT NULL,
    "paid_amount" integer DEFAULT 0 NOT NULL,
    "remaining_amount" integer NOT NULL,
    "payment_status" text DEFAULT 'pending' NOT NULL,
    "assigned_driver_id" text,
    "assigned_driver_name" varchar(150),
    "created_by" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "completed_at" timestamp,
    "cancelled_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_orders_organization_id_organization_id_fk') THEN
        ALTER TABLE "laundry_orders"
            ADD CONSTRAINT "laundry_orders_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_orders_branch_id_branches_id_fk') THEN
        ALTER TABLE "laundry_orders"
            ADD CONSTRAINT "laundry_orders_branch_id_branches_id_fk"
            FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_orders_customer_id_customers_id_fk') THEN
        ALTER TABLE "laundry_orders"
            ADD CONSTRAINT "laundry_orders_customer_id_customers_id_fk"
            FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_orders_assigned_driver_id_user_id_fk') THEN
        ALTER TABLE "laundry_orders"
            ADD CONSTRAINT "laundry_orders_assigned_driver_id_user_id_fk"
            FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."user"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_orders_created_by_user_id_fk') THEN
        ALTER TABLE "laundry_orders"
            ADD CONSTRAINT "laundry_orders_created_by_user_id_fk"
            FOREIGN KEY ("created_by") REFERENCES "public"."user"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_orders_org_branch" ON "laundry_orders" USING btree ("organization_id","branch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_orders_org_branch_status" ON "laundry_orders" USING btree ("organization_id","branch_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_orders_org_branch_created" ON "laundry_orders" USING btree ("organization_id","branch_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_orders_org_branch_phone" ON "laundry_orders" USING btree ("organization_id","branch_id","customer_phone");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_orders_org_branch_outstanding" ON "laundry_orders" USING btree ("organization_id","branch_id","remaining_amount");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_laundry_orders_org_branch_number" ON "laundry_orders" USING btree ("organization_id","branch_id","order_number");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "laundry_order_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "order_id" uuid NOT NULL,
    "service_id" uuid,
    "service_name" varchar(150) NOT NULL,
    "quantity" numeric(10, 2) NOT NULL,
    "unit_price" integer NOT NULL,
    "line_total" integer NOT NULL,
    "estimated_duration_hours" integer DEFAULT 0 NOT NULL,
    "notes" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_order_items_order_id_laundry_orders_id_fk') THEN
        ALTER TABLE "laundry_order_items"
            ADD CONSTRAINT "laundry_order_items_order_id_laundry_orders_id_fk"
            FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_order_items_service_id_laundry_services_id_fk') THEN
        ALTER TABLE "laundry_order_items"
            ADD CONSTRAINT "laundry_order_items_service_id_laundry_services_id_fk"
            FOREIGN KEY ("service_id") REFERENCES "public"."laundry_services"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_order_items_order" ON "laundry_order_items" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_order_items_service" ON "laundry_order_items" USING btree ("service_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "laundry_payments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" text NOT NULL,
    "branch_id" uuid NOT NULL,
    "order_id" uuid NOT NULL,
    "amount" integer NOT NULL,
    "payment_method" text,
    "note" text,
    "recorded_by" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_payments_organization_id_organization_id_fk') THEN
        ALTER TABLE "laundry_payments"
            ADD CONSTRAINT "laundry_payments_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_payments_branch_id_branches_id_fk') THEN
        ALTER TABLE "laundry_payments"
            ADD CONSTRAINT "laundry_payments_branch_id_branches_id_fk"
            FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_payments_order_id_laundry_orders_id_fk') THEN
        ALTER TABLE "laundry_payments"
            ADD CONSTRAINT "laundry_payments_order_id_laundry_orders_id_fk"
            FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_payments_recorded_by_user_id_fk') THEN
        ALTER TABLE "laundry_payments"
            ADD CONSTRAINT "laundry_payments_recorded_by_user_id_fk"
            FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_payments_org_branch" ON "laundry_payments" USING btree ("organization_id","branch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_payments_order" ON "laundry_payments" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_payments_org_branch_created" ON "laundry_payments" USING btree ("organization_id","branch_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "laundry_order_status_history" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" text NOT NULL,
    "branch_id" uuid NOT NULL,
    "order_id" uuid NOT NULL,
    "from_status" text,
    "to_status" text NOT NULL,
    "note" text,
    "actor_id" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_order_status_history_organization_id_organization_id_fk') THEN
        ALTER TABLE "laundry_order_status_history"
            ADD CONSTRAINT "laundry_order_status_history_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_order_status_history_branch_id_branches_id_fk') THEN
        ALTER TABLE "laundry_order_status_history"
            ADD CONSTRAINT "laundry_order_status_history_branch_id_branches_id_fk"
            FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_order_status_history_order_id_laundry_orders_id_fk') THEN
        ALTER TABLE "laundry_order_status_history"
            ADD CONSTRAINT "laundry_order_status_history_order_id_laundry_orders_id_fk"
            FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_order_status_history_actor_id_user_id_fk') THEN
        ALTER TABLE "laundry_order_status_history"
            ADD CONSTRAINT "laundry_order_status_history_actor_id_user_id_fk"
            FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_status_history_order" ON "laundry_order_status_history" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_status_history_org_branch_created" ON "laundry_order_status_history" USING btree ("organization_id","branch_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "laundry_order_sequences" (
    "organization_id" text NOT NULL,
    "branch_id" uuid NOT NULL,
    "sequence_date" date NOT NULL,
    "last_number" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_order_sequences_organization_id_organization_id_fk') THEN
        ALTER TABLE "laundry_order_sequences"
            ADD CONSTRAINT "laundry_order_sequences_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_order_sequences_branch_id_branches_id_fk') THEN
        ALTER TABLE "laundry_order_sequences"
            ADD CONSTRAINT "laundry_order_sequences_branch_id_branches_id_fk"
            FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_laundry_sequences_org_branch_date" ON "laundry_order_sequences" USING btree ("organization_id","branch_id","sequence_date");
