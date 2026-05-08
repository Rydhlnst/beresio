CREATE TYPE "public"."org_mode" AS ENUM('single', 'multi');--> statement-breakpoint
CREATE TABLE "order_bill_parts" (
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
CREATE TABLE "inventory_variant_stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"variant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_threshold" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(60),
	"barcode" varchar(50),
	"option_1" varchar(50),
	"option_2" varchar(50),
	"option_3" varchar(50),
	"price" integer,
	"compare_at_price" integer,
	"cost_price" integer,
	"image_url" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "variant_stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"variant_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text,
	"ref_type" text,
	"ref_id" text,
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fnb_command_idempotency" (
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
CREATE TABLE "fnb_domain_events" (
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
CREATE TABLE "fnb_kds_items" (
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
CREATE TABLE "fnb_menu_version_items" (
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
CREATE TABLE "fnb_menu_versions" (
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
CREATE TABLE "fnb_projector_checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"projector_name" varchar(100) NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fnb_session_participants" (
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
CREATE TABLE "fnb_table_sessions" (
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
CREATE TABLE "fnb_tables" (
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
CREATE TABLE "laundry_domain_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence" bigserial NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid,
	"order_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"actor_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_notification_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"domain_event_id" uuid NOT NULL,
	"channel" text DEFAULT 'whatsapp' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"template_snapshot" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp,
	"last_error" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_order_items" (
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
CREATE TABLE "laundry_order_sequences" (
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"sequence_date" date NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_order_status_history" (
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
CREATE TABLE "laundry_orders" (
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
CREATE TABLE "laundry_payments" (
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
CREATE TABLE "laundry_services" (
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
ALTER TABLE "organization" ADD COLUMN "mode" "org_mode" DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "modifiers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "station" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "menu_version_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "menu_version_item_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "snapshot_modifier_schema" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "snapshot_station" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "snapshot_prep_time_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "source" text DEFAULT 'pos' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "service_mode" text DEFAULT 'walk_in' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "table_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "guest_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "hold_state" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "held_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "split_from_order_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "merged_into_order_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "prep_time_minutes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "station" text DEFAULT 'kitchen';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "modifier_groups" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_available_dine_in" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_available_takeaway" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_available_delivery" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "order_bill_parts" ADD CONSTRAINT "order_bill_parts_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_bill_parts" ADD CONSTRAINT "order_bill_parts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_bill_parts" ADD CONSTRAINT "order_bill_parts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_variant_stocks" ADD CONSTRAINT "inventory_variant_stocks_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_variant_stocks" ADD CONSTRAINT "inventory_variant_stocks_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_variant_stocks" ADD CONSTRAINT "inventory_variant_stocks_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_command_idempotency" ADD CONSTRAINT "fnb_command_idempotency_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_domain_events" ADD CONSTRAINT "fnb_domain_events_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_domain_events" ADD CONSTRAINT "fnb_domain_events_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_domain_events" ADD CONSTRAINT "fnb_domain_events_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_kds_items" ADD CONSTRAINT "fnb_kds_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_kds_items" ADD CONSTRAINT "fnb_kds_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_menu_version_items" ADD CONSTRAINT "fnb_menu_version_items_menu_version_id_fnb_menu_versions_id_fk" FOREIGN KEY ("menu_version_id") REFERENCES "public"."fnb_menu_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_menu_version_items" ADD CONSTRAINT "fnb_menu_version_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_menu_version_items" ADD CONSTRAINT "fnb_menu_version_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_menu_versions" ADD CONSTRAINT "fnb_menu_versions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_menu_versions" ADD CONSTRAINT "fnb_menu_versions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_menu_versions" ADD CONSTRAINT "fnb_menu_versions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_projector_checkpoints" ADD CONSTRAINT "fnb_projector_checkpoints_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_session_participants" ADD CONSTRAINT "fnb_session_participants_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_session_participants" ADD CONSTRAINT "fnb_session_participants_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_session_participants" ADD CONSTRAINT "fnb_session_participants_table_session_id_fnb_table_sessions_id_fk" FOREIGN KEY ("table_session_id") REFERENCES "public"."fnb_table_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD CONSTRAINT "fnb_table_sessions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD CONSTRAINT "fnb_table_sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD CONSTRAINT "fnb_table_sessions_table_id_fnb_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."fnb_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD CONSTRAINT "fnb_table_sessions_opened_by_user_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD CONSTRAINT "fnb_table_sessions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_table_sessions" ADD CONSTRAINT "fnb_table_sessions_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_tables" ADD CONSTRAINT "fnb_tables_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fnb_tables" ADD CONSTRAINT "fnb_tables_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_domain_events" ADD CONSTRAINT "laundry_domain_events_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_domain_events" ADD CONSTRAINT "laundry_domain_events_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_domain_events" ADD CONSTRAINT "laundry_domain_events_order_id_laundry_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_domain_events" ADD CONSTRAINT "laundry_domain_events_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_notification_outbox" ADD CONSTRAINT "laundry_notification_outbox_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_notification_outbox" ADD CONSTRAINT "laundry_notification_outbox_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_notification_outbox" ADD CONSTRAINT "laundry_notification_outbox_order_id_laundry_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_notification_outbox" ADD CONSTRAINT "laundry_notification_outbox_domain_event_id_laundry_domain_events_id_fk" FOREIGN KEY ("domain_event_id") REFERENCES "public"."laundry_domain_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_order_items" ADD CONSTRAINT "laundry_order_items_order_id_laundry_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_order_items" ADD CONSTRAINT "laundry_order_items_service_id_laundry_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."laundry_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_order_sequences" ADD CONSTRAINT "laundry_order_sequences_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_order_sequences" ADD CONSTRAINT "laundry_order_sequences_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_order_status_history" ADD CONSTRAINT "laundry_order_status_history_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_order_status_history" ADD CONSTRAINT "laundry_order_status_history_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_order_status_history" ADD CONSTRAINT "laundry_order_status_history_order_id_laundry_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_order_status_history" ADD CONSTRAINT "laundry_order_status_history_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_assigned_driver_id_user_id_fk" FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD CONSTRAINT "laundry_payments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD CONSTRAINT "laundry_payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD CONSTRAINT "laundry_payments_order_id_laundry_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD CONSTRAINT "laundry_payments_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_services" ADD CONSTRAINT "laundry_services_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_services" ADD CONSTRAINT "laundry_services_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_bill_parts_org" ON "order_bill_parts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_order_bill_parts_order" ON "order_bill_parts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_bill_parts_org_status" ON "order_bill_parts" USING btree ("organization_id","payment_status");--> statement-breakpoint
CREATE INDEX "idx_inventory_variant_stocks_org" ON "inventory_variant_stocks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_variant_stocks_branch" ON "inventory_variant_stocks" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_variant_stocks_variant" ON "inventory_variant_stocks" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_inventory_variant_stocks_variant_branch" ON "inventory_variant_stocks" USING btree ("variant_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_product_variants_org" ON "product_variants" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_product_variants_org_active" ON "product_variants" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_product_variants_product" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_variants_sku" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_product_variants_barcode" ON "product_variants" USING btree ("barcode");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_variants_org_sku" ON "product_variants" USING btree ("organization_id","sku");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_variants_org_barcode" ON "product_variants" USING btree ("organization_id","barcode");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_variants_product_options" ON "product_variants" USING btree ("product_id","option_1","option_2","option_3");--> statement-breakpoint
CREATE INDEX "idx_variant_stock_movements_org_created" ON "variant_stock_movements" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_variant_stock_movements_branch" ON "variant_stock_movements" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_variant_stock_movements_variant" ON "variant_stock_movements" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_variant_stock_movements_ref" ON "variant_stock_movements" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_command_idempotency_key" ON "fnb_command_idempotency" USING btree ("organization_id","scope","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_fnb_command_idempotency_created" ON "fnb_command_idempotency" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_domain_events_sequence" ON "fnb_domain_events" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "idx_fnb_domain_events_org_sequence" ON "fnb_domain_events" USING btree ("organization_id","sequence");--> statement-breakpoint
CREATE INDEX "idx_fnb_domain_events_event_type" ON "fnb_domain_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_fnb_domain_events_aggregate" ON "fnb_domain_events" USING btree ("aggregate_type","aggregate_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_domain_events_branch" ON "fnb_domain_events" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_kds_order_item" ON "fnb_kds_items" USING btree ("order_item_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_kds_org_branch_status" ON "fnb_kds_items" USING btree ("organization_id","branch_id","status");--> statement-breakpoint
CREATE INDEX "idx_fnb_kds_org_branch_station_status" ON "fnb_kds_items" USING btree ("organization_id","branch_id","station","status");--> statement-breakpoint
CREATE INDEX "idx_fnb_kds_priority" ON "fnb_kds_items" USING btree ("organization_id","priority");--> statement-breakpoint
CREATE INDEX "idx_fnb_menu_items_menu_version" ON "fnb_menu_version_items" USING btree ("menu_version_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_menu_items_org_branch_active" ON "fnb_menu_version_items" USING btree ("organization_id","branch_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_fnb_menu_items_product" ON "fnb_menu_version_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_menu_items_menu_product" ON "fnb_menu_version_items" USING btree ("menu_version_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_menu_versions_org" ON "fnb_menu_versions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_menu_versions_org_branch_status" ON "fnb_menu_versions" USING btree ("organization_id","branch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_menu_versions_org_branch_name" ON "fnb_menu_versions" USING btree ("organization_id","branch_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_projector_checkpoint" ON "fnb_projector_checkpoints" USING btree ("organization_id","projector_name");--> statement-breakpoint
CREATE INDEX "idx_fnb_session_participants_org" ON "fnb_session_participants" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_session_participants_session" ON "fnb_session_participants" USING btree ("table_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_session_participants_device" ON "fnb_session_participants" USING btree ("organization_id","table_session_id","device_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_sessions_org" ON "fnb_table_sessions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_sessions_org_branch_status" ON "fnb_table_sessions" USING btree ("organization_id","branch_id","status");--> statement-breakpoint
CREATE INDEX "idx_fnb_sessions_table" ON "fnb_table_sessions" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_sessions_order" ON "fnb_table_sessions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_sessions_opened_by" ON "fnb_table_sessions" USING btree ("opened_by");--> statement-breakpoint
CREATE INDEX "idx_fnb_sessions_source" ON "fnb_table_sessions" USING btree ("organization_id","source");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_sessions_org_session_code" ON "fnb_table_sessions" USING btree ("organization_id","session_code");--> statement-breakpoint
CREATE INDEX "idx_fnb_tables_org" ON "fnb_tables" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_tables_org_branch" ON "fnb_tables" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_fnb_tables_org_branch_status" ON "fnb_tables" USING btree ("organization_id","branch_id","status");--> statement-breakpoint
CREATE INDEX "idx_fnb_tables_org_qr" ON "fnb_tables" USING btree ("organization_id","qr_code_url");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_fnb_tables_org_branch_code" ON "fnb_tables" USING btree ("organization_id","branch_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_laundry_domain_events_sequence" ON "laundry_domain_events" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "idx_laundry_domain_events_org_sequence" ON "laundry_domain_events" USING btree ("organization_id","sequence");--> statement-breakpoint
CREATE INDEX "idx_laundry_domain_events_type" ON "laundry_domain_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_laundry_domain_events_order" ON "laundry_domain_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_domain_events_branch" ON "laundry_domain_events" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_outbox_org_status" ON "laundry_notification_outbox" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_laundry_outbox_next_retry" ON "laundry_notification_outbox" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_laundry_outbox_org_created" ON "laundry_notification_outbox" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_laundry_outbox_order" ON "laundry_notification_outbox" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_laundry_outbox_event_channel" ON "laundry_notification_outbox" USING btree ("domain_event_id","channel");--> statement-breakpoint
CREATE INDEX "idx_laundry_order_items_order" ON "laundry_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_order_items_service" ON "laundry_order_items" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_laundry_sequences_org_branch_date" ON "laundry_order_sequences" USING btree ("organization_id","branch_id","sequence_date");--> statement-breakpoint
CREATE INDEX "idx_laundry_status_history_order" ON "laundry_order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_status_history_org_branch_created" ON "laundry_order_status_history" USING btree ("organization_id","branch_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_laundry_orders_org_branch" ON "laundry_orders" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_orders_org_branch_status" ON "laundry_orders" USING btree ("organization_id","branch_id","status");--> statement-breakpoint
CREATE INDEX "idx_laundry_orders_org_branch_created" ON "laundry_orders" USING btree ("organization_id","branch_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_laundry_orders_org_branch_phone" ON "laundry_orders" USING btree ("organization_id","branch_id","customer_phone");--> statement-breakpoint
CREATE INDEX "idx_laundry_orders_org_branch_outstanding" ON "laundry_orders" USING btree ("organization_id","branch_id","remaining_amount");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_laundry_orders_org_branch_number" ON "laundry_orders" USING btree ("organization_id","branch_id","order_number");--> statement-breakpoint
CREATE INDEX "idx_laundry_payments_org_branch" ON "laundry_payments" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_payments_order" ON "laundry_payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_payments_org_branch_created" ON "laundry_payments" USING btree ("organization_id","branch_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_laundry_services_org_branch" ON "laundry_services" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_services_org_branch_active" ON "laundry_services" USING btree ("organization_id","branch_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_laundry_services_org_branch_created" ON "laundry_services" USING btree ("organization_id","branch_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_laundry_services_org_branch_name" ON "laundry_services" USING btree ("organization_id","branch_id","name");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_version_id_fnb_menu_versions_id_fk" FOREIGN KEY ("menu_version_id") REFERENCES "public"."fnb_menu_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_version_item_id_fnb_menu_version_items_id_fk" FOREIGN KEY ("menu_version_item_id") REFERENCES "public"."fnb_menu_version_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fnb_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."fnb_tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_fnb_table_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."fnb_table_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_items_order_status" ON "order_items" USING btree ("order_id","status");--> statement-breakpoint
CREATE INDEX "idx_order_items_station" ON "order_items" USING btree ("station");--> statement-breakpoint
CREATE INDEX "idx_order_items_menu_version" ON "order_items" USING btree ("menu_version_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_menu_version_item" ON "order_items" USING btree ("menu_version_item_id");--> statement-breakpoint
CREATE INDEX "idx_orders_service_mode" ON "orders" USING btree ("organization_id","service_mode");--> statement-breakpoint
CREATE INDEX "idx_orders_table" ON "orders" USING btree ("table_id");--> statement-breakpoint
CREATE INDEX "idx_orders_session" ON "orders" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_orders_hold_state" ON "orders" USING btree ("organization_id","hold_state");--> statement-breakpoint
CREATE INDEX "idx_orders_source" ON "orders" USING btree ("organization_id","source");--> statement-breakpoint
CREATE INDEX "idx_products_org_station" ON "products" USING btree ("organization_id","station");--> statement-breakpoint
CREATE INDEX "idx_products_org_avail_dine_in" ON "products" USING btree ("organization_id","is_available_dine_in");--> statement-breakpoint
CREATE INDEX "idx_products_org_avail_takeaway" ON "products" USING btree ("organization_id","is_available_takeaway");--> statement-breakpoint
CREATE INDEX "idx_products_org_avail_delivery" ON "products" USING btree ("organization_id","is_available_delivery");