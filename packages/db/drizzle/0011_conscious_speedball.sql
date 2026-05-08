CREATE TYPE "public"."customer_order_intake_actor_type" AS ENUM('customer', 'tenant', 'system');--> statement-breakpoint
CREATE TYPE "public"."customer_order_intake_channel" AS ENUM('whatsapp_link', 'web_direct');--> statement-breakpoint
CREATE TYPE "public"."customer_order_intake_risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."customer_order_intake_status" AS ENUM('draft_submission', 'pending_verification', 'accepted', 'rejected', 'cancelled', 'expired', 'converted');--> statement-breakpoint
CREATE TYPE "public"."public_order_funnel_event_type" AS ENUM('session_started', 'session_abandoned', 'session_submitted');--> statement-breakpoint
CREATE TYPE "public"."bi_cost_category" AS ENUM('chemical', 'utility', 'labor', 'fixed_cost', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."bi_usage_metric" AS ENUM('per_kg', 'per_cycle', 'per_month', 'per_liter', 'per_kwh');--> statement-breakpoint
CREATE TABLE "laundry_loyalty_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"event_type" text DEFAULT 'order_completed' NOT NULL,
	"points_delta" integer DEFAULT 0 NOT NULL,
	"spending_delta" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laundry_machines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" text DEFAULT 'washer' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"daily_capacity_kg" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_order_intake_events" (
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
CREATE TABLE "customer_order_intake_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intake_id" uuid NOT NULL,
	"service_id" uuid,
	"service_name_snapshot" varchar(150) NOT NULL,
	"qty" numeric(10, 2) NOT NULL,
	"unit" varchar(20) DEFAULT 'kg' NOT NULL,
	"price_snapshot" integer DEFAULT 0 NOT NULL,
	"line_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_order_intakes" (
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
CREATE TABLE "public_order_funnel_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"tenant_slug" varchar(120) NOT NULL,
	"branch_slug" varchar(120) NOT NULL,
	"channel" "customer_order_intake_channel" DEFAULT 'web_direct' NOT NULL,
	"session_id" varchar(120) NOT NULL,
	"event_type" "public_order_funnel_event_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_submit_idempotency" (
	"organization_id" text NOT NULL,
	"scope" varchar(80) NOT NULL,
	"idempotency_key" varchar(120) NOT NULL,
	"request_hash" varchar(128),
	"response_status" integer NOT NULL,
	"response_body" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bi_cost_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"category" "bi_cost_category" NOT NULL,
	"usage_metric" "bi_usage_metric" NOT NULL,
	"usage_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"price_per_unit" numeric(15, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bi_labor_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"employee_count" integer DEFAULT 1 NOT NULL,
	"salary_per_month" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bi_machine_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"total_machines" integer DEFAULT 1 NOT NULL,
	"capacity_per_machine_kg" integer DEFAULT 10 NOT NULL,
	"optimal_usage_percent" numeric(5, 2) DEFAULT '50' NOT NULL,
	"cycle_time_minutes" integer DEFAULT 60 NOT NULL,
	"operational_hours_per_day" integer DEFAULT 12 NOT NULL,
	"water_consumption_per_cycle_liters" numeric(10, 2) DEFAULT '0' NOT NULL,
	"electricity_consumption_per_cycle_kwh" numeric(10, 2) DEFAULT '0' NOT NULL,
	"water_price_per_m3" numeric(15, 2) DEFAULT '0' NOT NULL,
	"electricity_price_per_kwh" numeric(15, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bi_profit_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"target_margin_percent" numeric(5, 2) DEFAULT '30' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "laundry_orders" ALTER COLUMN "status" SET DEFAULT 'created';--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "source_channel" text DEFAULT 'operator_dashboard' NOT NULL;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "source_intake_id" uuid;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "assigned_machine_id" uuid;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "assigned_machine_code" varchar(40);--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "assigned_machine_name" varchar(120);--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "confirmed_at" timestamp;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "pickup_requested_at" timestamp;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "picked_up_at" timestamp;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "washing_at" timestamp;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "drying_at" timestamp;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "ready_at" timestamp;--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD COLUMN "out_for_delivery_at" timestamp;--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD COLUMN "provider" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD COLUMN "provider_transaction_id" varchar(160);--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD COLUMN "provider_status" text DEFAULT 'SETTLED' NOT NULL;--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD COLUMN "idempotency_key" varchar(120);--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD COLUMN "reconciliation_status" text DEFAULT 'synced' NOT NULL;--> statement-breakpoint
ALTER TABLE "laundry_payments" ADD COLUMN "reconciled_at" timestamp;--> statement-breakpoint
ALTER TABLE "laundry_loyalty_ledger" ADD CONSTRAINT "laundry_loyalty_ledger_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_loyalty_ledger" ADD CONSTRAINT "laundry_loyalty_ledger_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_loyalty_ledger" ADD CONSTRAINT "laundry_loyalty_ledger_order_id_laundry_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_machines" ADD CONSTRAINT "laundry_machines_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "laundry_machines" ADD CONSTRAINT "laundry_machines_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_intake_events" ADD CONSTRAINT "customer_order_intake_events_intake_id_customer_order_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."customer_order_intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_intake_events" ADD CONSTRAINT "customer_order_intake_events_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_intake_items" ADD CONSTRAINT "customer_order_intake_items_intake_id_customer_order_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."customer_order_intakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_intake_items" ADD CONSTRAINT "customer_order_intake_items_service_id_laundry_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."laundry_services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_intakes" ADD CONSTRAINT "customer_order_intakes_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_intakes" ADD CONSTRAINT "customer_order_intakes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_intakes" ADD CONSTRAINT "customer_order_intakes_converted_order_id_laundry_orders_id_fk" FOREIGN KEY ("converted_order_id") REFERENCES "public"."laundry_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_intakes" ADD CONSTRAINT "customer_order_intakes_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_order_funnel_events" ADD CONSTRAINT "public_order_funnel_events_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_order_funnel_events" ADD CONSTRAINT "public_order_funnel_events_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_submit_idempotency" ADD CONSTRAINT "public_submit_idempotency_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_cost_items" ADD CONSTRAINT "bi_cost_items_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_cost_items" ADD CONSTRAINT "bi_cost_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_labor_configs" ADD CONSTRAINT "bi_labor_configs_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_labor_configs" ADD CONSTRAINT "bi_labor_configs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_machine_operations" ADD CONSTRAINT "bi_machine_operations_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_machine_operations" ADD CONSTRAINT "bi_machine_operations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_profit_settings" ADD CONSTRAINT "bi_profit_settings_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bi_profit_settings" ADD CONSTRAINT "bi_profit_settings_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_laundry_loyalty_ledger_org_customer" ON "laundry_loyalty_ledger" USING btree ("organization_id","customer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_laundry_loyalty_ledger_order_event" ON "laundry_loyalty_ledger" USING btree ("order_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_laundry_machines_org_branch" ON "laundry_machines" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_machines_org_branch_status" ON "laundry_machines" USING btree ("organization_id","branch_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_laundry_machines_org_branch_code" ON "laundry_machines" USING btree ("organization_id","branch_id","code");--> statement-breakpoint
CREATE INDEX "idx_customer_order_intake_events_intake_created" ON "customer_order_intake_events" USING btree ("intake_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_order_intake_items_intake" ON "customer_order_intake_items" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "idx_customer_order_intake_items_service" ON "customer_order_intake_items" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_customer_order_intakes_org_status_created" ON "customer_order_intakes" USING btree ("organization_id","status","created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_order_intakes_org_branch_created" ON "customer_order_intakes" USING btree ("organization_id","branch_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_order_intakes_org_phone_created" ON "customer_order_intakes" USING btree ("organization_id","customer_phone_normalized","created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_order_intakes_org_hash_created" ON "customer_order_intakes" USING btree ("organization_id","request_hash","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_customer_order_intakes_org_reference" ON "customer_order_intakes" USING btree ("organization_id","reference_code");--> statement-breakpoint
CREATE INDEX "idx_public_order_funnel_events_org_branch_created" ON "public_order_funnel_events" USING btree ("organization_id","branch_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_public_order_funnel_events_org_session" ON "public_order_funnel_events" USING btree ("organization_id","session_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_public_order_funnel_events_session_event" ON "public_order_funnel_events" USING btree ("organization_id","session_id","event_type");--> statement-breakpoint
CREATE INDEX "idx_public_submit_idempotency_org_created" ON "public_submit_idempotency" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_public_submit_idempotency_org_scope_key" ON "public_submit_idempotency" USING btree ("organization_id","scope","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_bi_cost_items_org_branch" ON "bi_cost_items" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_bi_cost_items_category" ON "bi_cost_items" USING btree ("organization_id","branch_id","category");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bi_labor_configs_org_branch" ON "bi_labor_configs" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bi_machine_ops_org_branch" ON "bi_machine_operations" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_bi_profit_settings_org_branch" ON "bi_profit_settings" USING btree ("organization_id","branch_id");--> statement-breakpoint
ALTER TABLE "laundry_orders" ADD CONSTRAINT "laundry_orders_assigned_machine_id_laundry_machines_id_fk" FOREIGN KEY ("assigned_machine_id") REFERENCES "public"."laundry_machines"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_member_user" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_member_org_user" ON "member" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_member_org_status" ON "member" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_session_user" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_active_org" ON "session" USING btree ("active_organization_id");--> statement-breakpoint
CREATE INDEX "idx_activity_org_entity" ON "activity_logs" USING btree ("organization_id","entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_laundry_orders_org_branch_machine" ON "laundry_orders" USING btree ("organization_id","branch_id","assigned_machine_id");--> statement-breakpoint
CREATE INDEX "idx_laundry_payments_provider_status" ON "laundry_payments" USING btree ("provider","provider_status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_laundry_payments_order_idempotency" ON "laundry_payments" USING btree ("order_id","idempotency_key");