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
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory_variant_stocks" ADD CONSTRAINT "inventory_variant_stocks_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory_variant_stocks" ADD CONSTRAINT "inventory_variant_stocks_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory_variant_stocks" ADD CONSTRAINT "inventory_variant_stocks_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "variant_stock_movements" ADD CONSTRAINT "variant_stock_movements_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_product_variants_org" ON "product_variants" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "idx_product_variants_org_active" ON "product_variants" USING btree ("organization_id","is_active");
--> statement-breakpoint
CREATE INDEX "idx_product_variants_product" ON "product_variants" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX "idx_product_variants_sku" ON "product_variants" USING btree ("sku");
--> statement-breakpoint
CREATE INDEX "idx_product_variants_barcode" ON "product_variants" USING btree ("barcode");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_variants_org_sku" ON "product_variants" USING btree ("organization_id","sku");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_variants_org_barcode" ON "product_variants" USING btree ("organization_id","barcode");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_product_variants_product_options" ON "product_variants" USING btree ("product_id","option_1","option_2","option_3");
--> statement-breakpoint
CREATE INDEX "idx_inventory_variant_stocks_org" ON "inventory_variant_stocks" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "idx_inventory_variant_stocks_branch" ON "inventory_variant_stocks" USING btree ("branch_id");
--> statement-breakpoint
CREATE INDEX "idx_inventory_variant_stocks_variant" ON "inventory_variant_stocks" USING btree ("variant_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_inventory_variant_stocks_variant_branch" ON "inventory_variant_stocks" USING btree ("variant_id","branch_id");
--> statement-breakpoint
CREATE INDEX "idx_variant_stock_movements_org_created" ON "variant_stock_movements" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_variant_stock_movements_branch" ON "variant_stock_movements" USING btree ("branch_id");
--> statement-breakpoint
CREATE INDEX "idx_variant_stock_movements_variant" ON "variant_stock_movements" USING btree ("variant_id");
--> statement-breakpoint
CREATE INDEX "idx_variant_stock_movements_ref" ON "variant_stock_movements" USING btree ("ref_type","ref_id");
