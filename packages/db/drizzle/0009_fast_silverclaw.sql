CREATE TYPE "public"."customer_status" AS ENUM('active', 'inactive', 'vip');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."customer_interaction_type" AS ENUM('call', 'visit', 'order', 'complaint', 'feedback', 'other');--> statement-breakpoint
CREATE TYPE "public"."business_type" AS ENUM('laundry', 'fnb', 'retail');--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"inventory_product_id" uuid,
	"sku" varchar(60),
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_sequences" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid,
	"order_number" varchar(32) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"type" text DEFAULT 'walk_in' NOT NULL,
	"subtotal_amount" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "customer_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"average_order_value" integer DEFAULT 0 NOT NULL,
	"last_order_at" timestamp,
	"first_order_at" timestamp,
	"order_frequency_days" integer,
	"total_interactions" integer DEFAULT 0 NOT NULL,
	"last_interaction_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"type" "customer_interaction_type" NOT NULL,
	"notes" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tag_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"color" varchar(24),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"quantity_delta" integer NOT NULL,
	"reason" text,
	"actor_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"sku" varchar(60),
	"unit" varchar(32),
	"image_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_stocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_threshold" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"product_id" uuid NOT NULL,
	"from_branch_id" uuid NOT NULL,
	"to_branch_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"requested_by" text,
	"decided_by" text,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pickup_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"order_id" uuid NOT NULL,
	"status" text DEFAULT 'Dikonfirmasi' NOT NULL,
	"driver_name" text,
	"eta" text,
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"module_key" varchar(50) NOT NULL,
	"module_name" varchar(100),
	"is_active" boolean DEFAULT true,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text,
	"name" varchar(150) NOT NULL,
	"slug" varchar(100),
	"business_type" "business_type" NOT NULL,
	"description" text,
	"logo_url" text,
	"phone" varchar(20),
	"email" varchar(150),
	"address" text,
	"is_active" boolean DEFAULT true,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_business_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"business_id" uuid NOT NULL,
	"role" text DEFAULT 'owner',
	"is_current_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100),
	"description" text,
	"parent_id" uuid,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"sku" varchar(60),
	"barcode" varchar(50),
	"category_id" uuid,
	"base_price" integer DEFAULT 0 NOT NULL,
	"sale_price" integer,
	"cost_price" integer,
	"inventory_product_id" uuid,
	"image_url" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"description" text,
	"short_description" varchar(255),
	"weight" integer,
	"dimensions" jsonb DEFAULT '{}'::jsonb,
	"slug" varchar(150),
	"meta_title" varchar(150),
	"meta_description" text,
	"supplier_id" uuid,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"sold_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(30),
	"contact_name" varchar(100),
	"email" varchar(150),
	"phone" varchar(20),
	"address" text,
	"city" varchar(50),
	"province" varchar(50),
	"postal_code" varchar(10),
	"bank_name" varchar(50),
	"bank_account_number" varchar(30),
	"bank_account_name" varchar(100),
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"customer_id" uuid,
	"payment_method" text,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"amount" integer NOT NULL,
	"type" text DEFAULT 'sale' NOT NULL,
	"status" text DEFAULT 'paid' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_teamId_team_id_fk";
--> statement-breakpoint
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_roleId_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_inviterId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "member_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "member_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "member" DROP CONSTRAINT "member_roleId_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_roleId_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "team" DROP CONSTRAINT "team_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "team_member" DROP CONSTRAINT "team_member_teamId_team_id_fk";
--> statement-breakpoint
ALTER TABLE "team_member" DROP CONSTRAINT "team_member_userId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "branch_members" DROP CONSTRAINT "branch_members_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "branch_members" DROP CONSTRAINT "branch_members_memberId_member_id_fk";
--> statement-breakpoint
ALTER TABLE "branch_members" DROP CONSTRAINT "branch_members_branchId_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "branches" DROP CONSTRAINT "branches_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "customers" DROP CONSTRAINT "customers_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_branchId_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_customerId_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_organizationId_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_actorId_user_id_fk";
--> statement-breakpoint
DROP INDEX "idx_role_permissions_org";--> statement-breakpoint
DROP INDEX "idx_role_permissions_role";--> statement-breakpoint
DROP INDEX "uq_role_permissions_role_perm";--> statement-breakpoint
DROP INDEX "idx_roles_org";--> statement-breakpoint
DROP INDEX "uq_roles_org_slug";--> statement-breakpoint
DROP INDEX "idx_branch_members_org";--> statement-breakpoint
DROP INDEX "idx_branch_members_member";--> statement-breakpoint
DROP INDEX "idx_branch_members_branch";--> statement-breakpoint
DROP INDEX "idx_branch_members_org_branch";--> statement-breakpoint
DROP INDEX "uq_branch_members_member_branch";--> statement-breakpoint
DROP INDEX "idx_branches_org";--> statement-breakpoint
DROP INDEX "idx_branches_org_active";--> statement-breakpoint
DROP INDEX "idx_customers_org";--> statement-breakpoint
DROP INDEX "idx_customers_phone";--> statement-breakpoint
DROP INDEX "idx_payments_org";--> statement-breakpoint
DROP INDEX "idx_payments_org_status";--> statement-breakpoint
DROP INDEX "idx_payments_org_created";--> statement-breakpoint
DROP INDEX "idx_payments_branch";--> statement-breakpoint
DROP INDEX "idx_activity_org";--> statement-breakpoint
DROP INDEX "idx_activity_org_type";--> statement-breakpoint
DROP INDEX "idx_activity_org_level";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "account_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "provider_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refresh_token" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "id_token" text;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "access_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "team_id" text;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "role_id" uuid;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "sent_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "inviter_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "role_id" uuid;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "deactivated_at" timestamp;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "business_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "subscription_plan" text DEFAULT 'starter';--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "role_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "active_organization_id" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "team_member" ADD COLUMN "team_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "team_member" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "team_member" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_verified" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "updated_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active_organization_id" text;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "created_at" timestamp;--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "branch_members" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "branch_members" ADD COLUMN "member_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "branch_members" ADD COLUMN "branch_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "branch_members" ADD COLUMN "is_primary" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "branch_members" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "is_active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "source" varchar(50);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "status" "customer_status" DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "loyalty_points" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "loyalty_tier" varchar(20) DEFAULT 'regular';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "total_spent_rp" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "preferences" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "branch_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "customer_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "organization_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "actor_id" text;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "entity_type" text;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "entity_id" text;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_inventory_product_id_inventory_products_id_fk" FOREIGN KEY ("inventory_product_id") REFERENCES "public"."inventory_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_sequences" ADD CONSTRAINT "order_sequences_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_analytics" ADD CONSTRAINT "customer_analytics_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_analytics" ADD CONSTRAINT "customer_analytics_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_interactions" ADD CONSTRAINT "customer_interactions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tag_links" ADD CONSTRAINT "customer_tag_links_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tag_links" ADD CONSTRAINT "customer_tag_links_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tag_links" ADD CONSTRAINT "customer_tag_links_tag_id_customer_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."customer_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_product_id_inventory_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_products" ADD CONSTRAINT "inventory_products_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_product_id_inventory_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_stocks" ADD CONSTRAINT "inventory_stocks_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_product_id_inventory_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_from_branch_id_branches_id_fk" FOREIGN KEY ("from_branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_to_branch_id_branches_id_fk" FOREIGN KEY ("to_branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_requested_by_user_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transfers" ADD CONSTRAINT "inventory_transfers_decided_by_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_inventory_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."inventory_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_orders" ADD CONSTRAINT "pickup_orders_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pickup_orders" ADD CONSTRAINT "pickup_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_modules" ADD CONSTRAINT "business_modules_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_business_access" ADD CONSTRAINT "user_business_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_business_access" ADD CONSTRAINT "user_business_access_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_inventory_product_id_inventory_products_id_fk" FOREIGN KEY ("inventory_product_id") REFERENCES "public"."inventory_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_events_order" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_events_org_created" ON "order_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_org" ON "orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_orders_org_status" ON "orders" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_org_created" ON "orders" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_branch" ON "orders" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_orders_org_number" ON "orders" USING btree ("organization_id","order_number");--> statement-breakpoint
CREATE INDEX "idx_customer_analytics_org" ON "customer_analytics" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_customer_analytics_customer" ON "customer_analytics" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_analytics_spent" ON "customer_analytics" USING btree ("organization_id","total_spent");--> statement-breakpoint
CREATE INDEX "idx_customer_analytics_orders" ON "customer_analytics" USING btree ("organization_id","total_orders");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_customer_analytics_customer" ON "customer_analytics" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_interactions_org" ON "customer_interactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_customer_interactions_customer" ON "customer_interactions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_interactions_type" ON "customer_interactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_customer_interactions_created" ON "customer_interactions" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_notes_org" ON "customer_notes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_customer_notes_customer" ON "customer_notes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_notes_created" ON "customer_notes" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_tag_links_org" ON "customer_tag_links" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_customer_tag_links_customer" ON "customer_tag_links" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_customer_tag_links_tag" ON "customer_tag_links" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_customer_tag_links_unique" ON "customer_tag_links" USING btree ("customer_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_customer_tags_org" ON "customer_tags" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_customer_tags_org_slug" ON "customer_tags" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "idx_inventory_adjustments_org_created" ON "inventory_adjustments" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_adjustments_branch" ON "inventory_adjustments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_adjustments_product" ON "inventory_adjustments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_products_org" ON "inventory_products" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_products_org_active" ON "inventory_products" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_inventory_products_org_sku" ON "inventory_products" USING btree ("organization_id","sku");--> statement-breakpoint
CREATE INDEX "idx_inventory_stocks_org" ON "inventory_stocks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_stocks_branch" ON "inventory_stocks" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_stocks_product" ON "inventory_stocks" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_inventory_stocks_product_branch" ON "inventory_stocks" USING btree ("product_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_transfers_org" ON "inventory_transfers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_transfers_org_status" ON "inventory_transfers" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_inventory_transfers_product" ON "inventory_transfers" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_transfers_from_branch" ON "inventory_transfers" USING btree ("from_branch_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_transfers_to_branch" ON "inventory_transfers" USING btree ("to_branch_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_org_created" ON "stock_movements" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_branch" ON "stock_movements" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_product" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_ref" ON "stock_movements" USING btree ("ref_type","ref_id");--> statement-breakpoint
CREATE INDEX "idx_highlights_org" ON "highlights" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_highlights_org_archived" ON "highlights" USING btree ("organization_id","is_archived");--> statement-breakpoint
CREATE INDEX "idx_highlights_org_order" ON "highlights" USING btree ("organization_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_pickup_orders_org" ON "pickup_orders" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_pickup_orders_org_status" ON "pickup_orders" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_pickup_orders_order" ON "pickup_orders" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_pickup_orders_order" ON "pickup_orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_business_modules_business" ON "business_modules" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_business_modules_business_active" ON "business_modules" USING btree ("business_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_business_modules_business_display" ON "business_modules" USING btree ("business_id","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_business_modules_business_key" ON "business_modules" USING btree ("business_id","module_key");--> statement-breakpoint
CREATE INDEX "idx_businesses_org" ON "businesses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_businesses_type" ON "businesses" USING btree ("business_type");--> statement-breakpoint
CREATE INDEX "idx_businesses_org_active" ON "businesses" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_businesses_slug" ON "businesses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_user_business_access_user" ON "user_business_access" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_business_access_business" ON "user_business_access" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "idx_user_business_access_current" ON "user_business_access" USING btree ("user_id","is_current_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_business_access_user_business" ON "user_business_access" USING btree ("user_id","business_id");--> statement-breakpoint
CREATE INDEX "idx_product_categories_org" ON "product_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_product_categories_org_active" ON "product_categories" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_product_categories_parent" ON "product_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_categories_org_slug" ON "product_categories" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "idx_products_org" ON "products" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_products_org_active" ON "products" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_products_supplier" ON "products" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_products_sku" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_products_barcode" ON "products" USING btree ("barcode");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_products_org_sku" ON "products" USING btree ("organization_id","sku");--> statement-breakpoint
CREATE INDEX "idx_suppliers_org" ON "suppliers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_org_active" ON "suppliers" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_suppliers_org_code" ON "suppliers" USING btree ("organization_id","code");--> statement-breakpoint
CREATE INDEX "idx_transaction_items_txn" ON "transaction_items" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "idx_transaction_items_product" ON "transaction_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_org" ON "transactions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_org_status" ON "transactions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_transactions_org_created" ON "transactions" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_branch" ON "transactions" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_customer" ON "transactions" USING btree ("customer_id");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_members" ADD CONSTRAINT "branch_members_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_members" ADD CONSTRAINT "branch_members_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_members" ADD CONSTRAINT "branch_members_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customers_status" ON "customers" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_customers_source" ON "customers" USING btree ("organization_id","source");--> statement-breakpoint
CREATE INDEX "idx_customers_created" ON "customers" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_org" ON "role_permissions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_role_permissions_role_perm" ON "role_permissions" USING btree ("role_id","permission");--> statement-breakpoint
CREATE INDEX "idx_roles_org" ON "roles" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_roles_org_slug" ON "roles" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "idx_branch_members_org" ON "branch_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_branch_members_member" ON "branch_members" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_branch_members_branch" ON "branch_members" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_branch_members_org_branch" ON "branch_members" USING btree ("organization_id","branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_branch_members_member_branch" ON "branch_members" USING btree ("member_id","branch_id");--> statement-breakpoint
CREATE INDEX "idx_branches_org" ON "branches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_branches_org_active" ON "branches" USING btree ("organization_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_customers_org" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_customers_phone" ON "customers" USING btree ("organization_id","phone");--> statement-breakpoint
CREATE INDEX "idx_payments_org" ON "payments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_payments_org_status" ON "payments" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "idx_payments_org_created" ON "payments" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_payments_branch" ON "payments" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_activity_org" ON "activity_logs" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_activity_org_type" ON "activity_logs" USING btree ("organization_id","type");--> statement-breakpoint
CREATE INDEX "idx_activity_org_level" ON "activity_logs" USING btree ("organization_id","level");--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "accountId";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "providerId";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "accessToken";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "refreshToken";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "idToken";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "accessTokenExpiresAt";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "refreshTokenExpiresAt";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "teamId";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "roleId";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "branchId";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "sentAt";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "expiresAt";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "invitation" DROP COLUMN "inviterId";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "roleId";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "deactivatedAt";--> statement-breakpoint
ALTER TABLE "member" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "businessType";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "subscriptionPlan";--> statement-breakpoint
ALTER TABLE "organization" DROP COLUMN "logoUrl";--> statement-breakpoint
ALTER TABLE "role_permissions" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "role_permissions" DROP COLUMN "roleId";--> statement-breakpoint
ALTER TABLE "role_permissions" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "isSystem";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "roles" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "expiresAt";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "ipAddress";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "userAgent";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "session" DROP COLUMN "activeOrganizationId";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "team_member" DROP COLUMN "teamId";--> statement-breakpoint
ALTER TABLE "team_member" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "team_member" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "emailVerified";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "activeOrganizationId";--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN "expiresAt";--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "verification" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "branch_members" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "branch_members" DROP COLUMN "memberId";--> statement-breakpoint
ALTER TABLE "branch_members" DROP COLUMN "branchId";--> statement-breakpoint
ALTER TABLE "branch_members" DROP COLUMN "isPrimary";--> statement-breakpoint
ALTER TABLE "branch_members" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "isActive";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "loyaltyPoints";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "loyaltyTier";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "totalSpentRp";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "customers" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "branchId";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "customerId";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "createdAt";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "updatedAt";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "organizationId";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "actorId";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "entityType";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "entityId";--> statement-breakpoint
ALTER TABLE "activity_logs" DROP COLUMN "createdAt";