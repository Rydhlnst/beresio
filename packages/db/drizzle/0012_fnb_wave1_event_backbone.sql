-- FnB Wave 1: Event backbone, idempotency, menu versioning, KDS projection
-- Idempotent migration for existing environments

CREATE TABLE IF NOT EXISTS "fnb_session_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"table_session_id" uuid NOT NULL,
	"device_id" varchar(120) NOT NULL,
	"source" text DEFAULT 'qr' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_session_participants_organization_id_organization_id_fk') THEN
		ALTER TABLE "fnb_session_participants"
			ADD CONSTRAINT "fnb_session_participants_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_session_participants_branch_id_branches_id_fk') THEN
		ALTER TABLE "fnb_session_participants"
			ADD CONSTRAINT "fnb_session_participants_branch_id_branches_id_fk"
			FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_session_participants_table_session_id_fnb_table_sessions_id_fk') THEN
		ALTER TABLE "fnb_session_participants"
			ADD CONSTRAINT "fnb_session_participants_table_session_id_fnb_table_sessions_id_fk"
			FOREIGN KEY ("table_session_id") REFERENCES "public"."fnb_table_sessions"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_session_participants_org" ON "fnb_session_participants" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_session_participants_session" ON "fnb_session_participants" USING btree ("table_session_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_session_participants_device" ON "fnb_session_participants" USING btree ("organization_id","table_session_id","device_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fnb_menu_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"activated_at" timestamp,
	"archived_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_menu_versions_organization_id_organization_id_fk') THEN
		ALTER TABLE "fnb_menu_versions"
			ADD CONSTRAINT "fnb_menu_versions_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_menu_versions_branch_id_branches_id_fk') THEN
		ALTER TABLE "fnb_menu_versions"
			ADD CONSTRAINT "fnb_menu_versions_branch_id_branches_id_fk"
			FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_menu_versions_created_by_user_id_fk') THEN
		ALTER TABLE "fnb_menu_versions"
			ADD CONSTRAINT "fnb_menu_versions_created_by_user_id_fk"
			FOREIGN KEY ("created_by") REFERENCES "public"."user"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_menu_versions_org" ON "fnb_menu_versions" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_menu_versions_org_branch_status" ON "fnb_menu_versions" USING btree ("organization_id","branch_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_menu_versions_org_branch_name" ON "fnb_menu_versions" USING btree ("organization_id","branch_id","name");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fnb_menu_version_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_version_id" uuid NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"product_id" uuid,
	"item_name" varchar(200) NOT NULL,
	"unit_price" integer NOT NULL,
	"modifier_schema" jsonb DEFAULT '[]'::jsonb,
	"station" text DEFAULT 'kitchen',
	"prep_time_minutes" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_menu_version_items_menu_version_id_fnb_menu_versions_id_fk') THEN
		ALTER TABLE "fnb_menu_version_items"
			ADD CONSTRAINT "fnb_menu_version_items_menu_version_id_fnb_menu_versions_id_fk"
			FOREIGN KEY ("menu_version_id") REFERENCES "public"."fnb_menu_versions"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_menu_version_items_organization_id_organization_id_fk') THEN
		ALTER TABLE "fnb_menu_version_items"
			ADD CONSTRAINT "fnb_menu_version_items_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_menu_version_items_branch_id_branches_id_fk') THEN
		ALTER TABLE "fnb_menu_version_items"
			ADD CONSTRAINT "fnb_menu_version_items_branch_id_branches_id_fk"
			FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_menu_items_menu_version" ON "fnb_menu_version_items" USING btree ("menu_version_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_menu_items_org_branch_active" ON "fnb_menu_version_items" USING btree ("organization_id","branch_id","is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_menu_items_product" ON "fnb_menu_version_items" USING btree ("product_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_menu_items_menu_product" ON "fnb_menu_version_items" USING btree ("menu_version_id","product_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fnb_domain_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence" bigserial NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" text,
	"idempotency_key" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_domain_events_organization_id_organization_id_fk') THEN
		ALTER TABLE "fnb_domain_events"
			ADD CONSTRAINT "fnb_domain_events_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_domain_events_branch_id_branches_id_fk') THEN
		ALTER TABLE "fnb_domain_events"
			ADD CONSTRAINT "fnb_domain_events_branch_id_branches_id_fk"
			FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_domain_events_actor_id_user_id_fk') THEN
		ALTER TABLE "fnb_domain_events"
			ADD CONSTRAINT "fnb_domain_events_actor_id_user_id_fk"
			FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_domain_events_sequence" ON "fnb_domain_events" USING btree ("sequence");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_domain_events_org_sequence" ON "fnb_domain_events" USING btree ("organization_id","sequence");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_domain_events_event_type" ON "fnb_domain_events" USING btree ("event_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_domain_events_aggregate" ON "fnb_domain_events" USING btree ("aggregate_type","aggregate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_domain_events_branch" ON "fnb_domain_events" USING btree ("branch_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fnb_projector_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"projector_name" varchar(100) NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_projector_checkpoints_organization_id_organization_id_fk') THEN
		ALTER TABLE "fnb_projector_checkpoints"
			ADD CONSTRAINT "fnb_projector_checkpoints_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_projector_checkpoint" ON "fnb_projector_checkpoints" USING btree ("organization_id","projector_name");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fnb_command_idempotency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"scope" varchar(180) NOT NULL,
	"idempotency_key" varchar(180) NOT NULL,
	"request_hash" varchar(128),
	"response_status" integer NOT NULL,
	"response_body" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_command_idempotency_organization_id_organization_id_fk') THEN
		ALTER TABLE "fnb_command_idempotency"
			ADD CONSTRAINT "fnb_command_idempotency_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_command_idempotency_key" ON "fnb_command_idempotency" USING btree ("organization_id","scope","idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_command_idempotency_created" ON "fnb_command_idempotency" USING btree ("organization_id","created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fnb_kds_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"session_id" uuid,
	"table_id" uuid,
	"station" text DEFAULT 'kitchen',
	"status" text DEFAULT 'new' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"target_ready_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"elapsed_seconds" integer DEFAULT 0 NOT NULL,
	"is_overdue" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_kds_items_organization_id_organization_id_fk') THEN
		ALTER TABLE "fnb_kds_items"
			ADD CONSTRAINT "fnb_kds_items_organization_id_organization_id_fk"
			FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fnb_kds_items_branch_id_branches_id_fk') THEN
		ALTER TABLE "fnb_kds_items"
			ADD CONSTRAINT "fnb_kds_items_branch_id_branches_id_fk"
			FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_fnb_kds_order_item" ON "fnb_kds_items" USING btree ("order_item_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_kds_org_branch_status" ON "fnb_kds_items" USING btree ("organization_id","branch_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_kds_org_branch_station_status" ON "fnb_kds_items" USING btree ("organization_id","branch_id","station","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fnb_kds_priority" ON "fnb_kds_items" USING btree ("organization_id","priority");
--> statement-breakpoint

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "menu_version_id" uuid;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "menu_version_item_id" uuid;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "snapshot_modifier_schema" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "snapshot_station" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "snapshot_prep_time_minutes" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_menu_version_id_fnb_menu_versions_id_fk') THEN
		ALTER TABLE "order_items"
			ADD CONSTRAINT "order_items_menu_version_id_fnb_menu_versions_id_fk"
			FOREIGN KEY ("menu_version_id") REFERENCES "public"."fnb_menu_versions"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_menu_version_item_id_fnb_menu_version_items_id_fk') THEN
		ALTER TABLE "order_items"
			ADD CONSTRAINT "order_items_menu_version_item_id_fnb_menu_version_items_id_fk"
			FOREIGN KEY ("menu_version_item_id") REFERENCES "public"."fnb_menu_version_items"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_menu_version" ON "order_items" USING btree ("menu_version_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_menu_version_item" ON "order_items" USING btree ("menu_version_item_id");
