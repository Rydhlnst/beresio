-- CRM Enhancement Migration
-- Adds customer interactions, analytics, and extends customers table

-- ============================================================================
-- Create customer_interaction_type enum
-- ============================================================================
CREATE TYPE "customer_interaction_type" AS ENUM ('call', 'visit', 'order', 'complaint', 'feedback', 'other');

-- ============================================================================
-- Create gender enum
-- ============================================================================
CREATE TYPE "gender" AS ENUM ('male', 'female', 'other');

-- ============================================================================
-- Create customer_status enum
-- ============================================================================
CREATE TYPE "customer_status" AS ENUM ('active', 'inactive', 'vip');

-- ============================================================================
-- Alter customers table - add new fields
-- ============================================================================
ALTER TABLE "customers" 
    ADD COLUMN "birth_date" date,
    ADD COLUMN "gender" "gender",
    ADD COLUMN "source" varchar(50),
    ADD COLUMN "status" "customer_status" DEFAULT 'active',
    ADD COLUMN "preferences" jsonb DEFAULT '{}';

-- Add indexes for customers table
CREATE INDEX "idx_customers_status" ON "customers" ("organization_id", "status");
CREATE INDEX "idx_customers_source" ON "customers" ("organization_id", "source");
CREATE INDEX "idx_customers_created" ON "customers" ("organization_id", "created_at");

-- ============================================================================
-- Create customer_interactions table
-- ============================================================================
CREATE TABLE "customer_interactions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE cascade,
    "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE cascade,
    "type" "customer_interaction_type" NOT NULL,
    "notes" text NOT NULL,
    "metadata" jsonb DEFAULT '{}',
    "created_by" text REFERENCES "user"("id") ON DELETE set null,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add indexes for customer_interactions
CREATE INDEX "idx_customer_interactions_org" ON "customer_interactions" ("organization_id");
CREATE INDEX "idx_customer_interactions_customer" ON "customer_interactions" ("customer_id");
CREATE INDEX "idx_customer_interactions_type" ON "customer_interactions" ("type");
CREATE INDEX "idx_customer_interactions_created" ON "customer_interactions" ("organization_id", "created_at");

-- ============================================================================
-- Create customer_analytics table
-- ============================================================================
CREATE TABLE "customer_analytics" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE cascade,
    "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE cascade,
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

-- Add indexes for customer_analytics
CREATE INDEX "idx_customer_analytics_org" ON "customer_analytics" ("organization_id");
CREATE INDEX "idx_customer_analytics_customer" ON "customer_analytics" ("customer_id");
CREATE INDEX "idx_customer_analytics_spent" ON "customer_analytics" ("organization_id", "total_spent");
CREATE INDEX "idx_customer_analytics_orders" ON "customer_analytics" ("organization_id", "total_orders");

-- Add unique constraint for customer analytics (one per customer)
CREATE UNIQUE INDEX "uq_customer_analytics_customer" ON "customer_analytics" ("customer_id");

-- ============================================================================
-- Add created_by to customer_notes if not exists
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_notes' AND column_name = 'created_by') THEN
        ALTER TABLE "customer_notes" ADD COLUMN "created_by" text REFERENCES "user"("id") ON DELETE set null;
    END IF;
END $$;

-- ============================================================================
-- Create function to auto-update updated_at on customer_analytics
-- ============================================================================
CREATE OR REPLACE FUNCTION update_customer_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customer_analytics_updated_at
    BEFORE UPDATE ON "customer_analytics"
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_analytics_updated_at();
