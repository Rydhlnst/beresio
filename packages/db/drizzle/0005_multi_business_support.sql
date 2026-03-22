-- Migration: Multi-Business Support
-- Description: Add businesses table with business_type enum and update business_modules & user_business_access

--> statement-breakpoint

-- ============================================
-- STEP 1: Create business_type enum
-- ============================================
CREATE TYPE "business_type" AS ENUM ('laundry', 'fnb', 'retail');

--> statement-breakpoint

-- ============================================
-- STEP 2: Create businesses table
-- ============================================
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text,
	"name" varchar(150) NOT NULL,
	"slug" varchar(100) UNIQUE,
	"business_type" business_type NOT NULL,
	"description" text,
	"logo_url" text,
	"phone" varchar(20),
	"email" varchar(150),
	"address" text,
	"is_active" boolean DEFAULT true,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Create indexes for businesses
CREATE INDEX "idx_businesses_org" ON "businesses" USING btree ("organization_id");
CREATE INDEX "idx_businesses_type" ON "businesses" USING btree ("business_type");
CREATE INDEX "idx_businesses_org_active" ON "businesses" USING btree ("organization_id", "is_active");
CREATE INDEX "idx_businesses_slug" ON "businesses" USING btree ("slug");

--> statement-breakpoint

-- Add foreign key constraint for businesses.organization_id
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_organization_id_organization_id_fk" 
	FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

-- ============================================
-- STEP 3: Migrate data from old tables to new structure
-- ============================================

-- Insert businesses from existing organizations
INSERT INTO "businesses" ("organization_id", "name", "slug", "business_type", "logo_url", "is_active", "created_at", "updated_at")
SELECT 
    o.id as "organization_id",
    o.name,
    o.slug,
    COALESCE(o.business_type::business_type, 'retail'::business_type) as "business_type",
    o.logo_url,
    true as "is_active",
    o.created_at,
    CURRENT_TIMESTAMP as "updated_at"
FROM "organization" o;

--> statement-breakpoint

-- ============================================
-- STEP 4: Drop old tables and recreate with proper structure
-- ============================================

-- Drop old business_modules table
DROP TABLE IF EXISTS "business_modules";

--> statement-breakpoint

-- Create new business_modules table with proper business_id reference
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

-- Create indexes for business_modules
CREATE INDEX "idx_business_modules_business" ON "business_modules" USING btree ("business_id");
CREATE INDEX "idx_business_modules_business_active" ON "business_modules" USING btree ("business_id", "is_active");
CREATE INDEX "idx_business_modules_business_display" ON "business_modules" USING btree ("business_id", "display_order");
CREATE UNIQUE INDEX "uq_business_modules_business_key" ON "business_modules" USING btree ("business_id", "module_key");

--> statement-breakpoint

-- Add foreign key constraint for business_modules
ALTER TABLE "business_modules" ADD CONSTRAINT "business_modules_business_id_businesses_id_fk" 
	FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

-- Drop old user_business_access table
DROP TABLE IF EXISTS "user_business_access";

--> statement-breakpoint

-- Create new user_business_access table with proper business_id reference
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

-- Create indexes for user_business_access
CREATE INDEX "idx_user_business_access_user" ON "user_business_access" USING btree ("user_id");
CREATE INDEX "idx_user_business_access_business" ON "user_business_access" USING btree ("business_id");
CREATE INDEX "idx_user_business_access_current" ON "user_business_access" USING btree ("user_id", "is_current_active");
CREATE UNIQUE INDEX "uq_user_business_access_user_business" ON "user_business_access" USING btree ("user_id", "business_id");

--> statement-breakpoint

-- Add foreign key constraints for user_business_access
ALTER TABLE "user_business_access" ADD CONSTRAINT "user_business_access_user_id_user_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "user_business_access" ADD CONSTRAINT "user_business_access_business_id_businesses_id_fk" 
	FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint

-- ============================================
-- STEP 5: Seed data for testing - Laundry Business (Indomarettt)
-- ============================================

-- Insert test laundry business
INSERT INTO "businesses" ("id", "name", "slug", "business_type", "description", "phone", "email", "address", "is_active", "settings", "created_at", "updated_at")
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Indomarettt Laundry',
    'indomarettt-laundry',
    'laundry',
    'Layanan laundry kilat dan bersih untuk keluarga Anda',
    '081234567890',
    'hello@indomarettt.com',
    'Jl. Laundry No. 123, Jakarta',
    true,
    '{"currency": "IDR", "timezone": "Asia/Jakarta", "taxRate": 11}'::jsonb,
    NOW(),
    NOW()
);

--> statement-breakpoint

-- Insert 5 active modules for Indomarettt Laundry
INSERT INTO "business_modules" ("business_id", "module_key", "module_name", "is_active", "settings", "display_order", "created_at", "updated_at")
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'order', 'Pesanan', true, '{"icon": "ShoppingCart", "defaultView": "list"}'::jsonb, 1, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'tracking', 'Tracking', true, '{"icon": "MapPin", "enableNotifications": true}'::jsonb, 2, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'inventory', 'Inventori', true, '{"icon": "Package", "lowStockAlert": true}'::jsonb, 3, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'customer', 'Pelanggan', true, '{"icon": "Users", "enableLoyalty": true}'::jsonb, 4, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'report', 'Laporan', true, '{"icon": "BarChart3", "defaultPeriod": "monthly"}'::jsonb, 5, NOW(), NOW());
