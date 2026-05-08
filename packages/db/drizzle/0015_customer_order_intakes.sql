DO $$ BEGIN
    CREATE TYPE "customer_order_intake_channel" AS ENUM ('whatsapp_link', 'web_direct');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "customer_order_intake_status" AS ENUM (
        'draft_submission',
        'pending_verification',
        'accepted',
        'rejected',
        'cancelled',
        'expired',
        'converted'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "customer_order_intake_risk_level" AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "customer_order_intake_actor_type" AS ENUM ('customer', 'tenant', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "customer_order_intakes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "reference_code" varchar(40) NOT NULL,
    "organization_id" text NOT NULL,
    "branch_id" uuid NOT NULL,
    "tenant_slug" varchar(120) NOT NULL,
    "branch_slug" varchar(120) NOT NULL,
    "channel" "customer_order_intake_channel" DEFAULT 'web_direct' NOT NULL,
    "status" "customer_order_intake_status" DEFAULT 'pending_verification' NOT NULL,
    "order_type" text DEFAULT 'pickup' NOT NULL,
    "customer_name" varchar(150) NOT NULL,
    "customer_phone_raw" varchar(30) NOT NULL,
    "customer_phone_normalized" varchar(20) NOT NULL,
    "customer_address" text NOT NULL,
    "pickup_preference_at" timestamp,
    "payment_preference" text,
    "notes" text,
    "custom_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "consent_accepted_at" timestamp NOT NULL,
    "risk_score" integer DEFAULT 0 NOT NULL,
    "risk_level" "customer_order_intake_risk_level" DEFAULT 'low' NOT NULL,
    "risk_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "idempotency_key" varchar(120) NOT NULL,
    "request_hash" varchar(128) NOT NULL,
    "submit_ip_hash" varchar(128),
    "submit_user_agent_hash" varchar(128),
    "converted_order_id" uuid,
    "verified_at" timestamp,
    "verified_by" text,
    "expires_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_order_intakes_organization_id_organization_id_fk') THEN
        ALTER TABLE "customer_order_intakes"
            ADD CONSTRAINT "customer_order_intakes_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_order_intakes_branch_id_branches_id_fk') THEN
        ALTER TABLE "customer_order_intakes"
            ADD CONSTRAINT "customer_order_intakes_branch_id_branches_id_fk"
            FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_order_intakes_converted_order_id_laundry_orders_id_fk') THEN
        ALTER TABLE "customer_order_intakes"
            ADD CONSTRAINT "customer_order_intakes_converted_order_id_laundry_orders_id_fk"
            FOREIGN KEY ("converted_order_id") REFERENCES "public"."laundry_orders"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_order_intakes_verified_by_user_id_fk') THEN
        ALTER TABLE "customer_order_intakes"
            ADD CONSTRAINT "customer_order_intakes_verified_by_user_id_fk"
            FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_order_intakes_org_status_created"
    ON "customer_order_intakes" USING btree ("organization_id","status","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_order_intakes_org_branch_created"
    ON "customer_order_intakes" USING btree ("organization_id","branch_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_order_intakes_org_phone_created"
    ON "customer_order_intakes" USING btree ("organization_id","customer_phone_normalized","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_order_intakes_org_hash_created"
    ON "customer_order_intakes" USING btree ("organization_id","request_hash","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_customer_order_intakes_org_reference"
    ON "customer_order_intakes" USING btree ("organization_id","reference_code");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "customer_order_intake_items" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "intake_id" uuid NOT NULL,
    "service_id" uuid,
    "service_name_snapshot" varchar(150) NOT NULL,
    "qty" numeric(10,2) NOT NULL,
    "unit" varchar(20) DEFAULT 'kg' NOT NULL,
    "price_snapshot" integer DEFAULT 0 NOT NULL,
    "line_note" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_order_intake_items_intake_id_customer_order_intakes_id_fk') THEN
        ALTER TABLE "customer_order_intake_items"
            ADD CONSTRAINT "customer_order_intake_items_intake_id_customer_order_intakes_id_fk"
            FOREIGN KEY ("intake_id") REFERENCES "public"."customer_order_intakes"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_order_intake_items_service_id_laundry_services_id_fk') THEN
        ALTER TABLE "customer_order_intake_items"
            ADD CONSTRAINT "customer_order_intake_items_service_id_laundry_services_id_fk"
            FOREIGN KEY ("service_id") REFERENCES "public"."laundry_services"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_order_intake_items_intake"
    ON "customer_order_intake_items" USING btree ("intake_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_order_intake_items_service"
    ON "customer_order_intake_items" USING btree ("service_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "customer_order_intake_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "intake_id" uuid NOT NULL,
    "from_status" "customer_order_intake_status",
    "to_status" "customer_order_intake_status" NOT NULL,
    "actor_type" "customer_order_intake_actor_type" DEFAULT 'system' NOT NULL,
    "actor_id" text,
    "note" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_order_intake_events_intake_id_customer_order_intakes_id_fk') THEN
        ALTER TABLE "customer_order_intake_events"
            ADD CONSTRAINT "customer_order_intake_events_intake_id_customer_order_intakes_id_fk"
            FOREIGN KEY ("intake_id") REFERENCES "public"."customer_order_intakes"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_order_intake_events_actor_id_user_id_fk') THEN
        ALTER TABLE "customer_order_intake_events"
            ADD CONSTRAINT "customer_order_intake_events_actor_id_user_id_fk"
            FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_order_intake_events_intake_created"
    ON "customer_order_intake_events" USING btree ("intake_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public_submit_idempotency" (
    "organization_id" text NOT NULL,
    "scope" varchar(80) NOT NULL,
    "idempotency_key" varchar(120) NOT NULL,
    "request_hash" varchar(128),
    "response_status" integer NOT NULL,
    "response_body" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'public_submit_idempotency_organization_id_organization_id_fk') THEN
        ALTER TABLE "public_submit_idempotency"
            ADD CONSTRAINT "public_submit_idempotency_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_public_submit_idempotency_org_created"
    ON "public_submit_idempotency" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_public_submit_idempotency_org_scope_key"
    ON "public_submit_idempotency" USING btree ("organization_id","scope","idempotency_key");
