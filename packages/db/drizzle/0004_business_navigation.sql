CREATE TABLE "business_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"module_key" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_business_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"business_id" text NOT NULL,
	"role" text DEFAULT 'owner',
	"is_current_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_modules" ADD CONSTRAINT "business_modules_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_business_access" ADD CONSTRAINT "user_business_access_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_business_access" ADD CONSTRAINT "user_business_access_business_id_organization_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_business_modules_org" ON "business_modules" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "idx_business_modules_org_active" ON "business_modules" USING btree ("organization_id","is_active");
--> statement-breakpoint
CREATE INDEX "idx_business_modules_org_display" ON "business_modules" USING btree ("organization_id","display_order");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_business_modules_org_key" ON "business_modules" USING btree ("organization_id","module_key");
--> statement-breakpoint
CREATE INDEX "idx_user_business_access_user" ON "user_business_access" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "idx_user_business_access_business" ON "user_business_access" USING btree ("business_id");
--> statement-breakpoint
CREATE INDEX "idx_user_business_access_current" ON "user_business_access" USING btree ("user_id","is_current_active");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_business_access_user_business" ON "user_business_access" USING btree ("user_id","business_id");
