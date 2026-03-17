CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"description" text,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"role_id" uuid NOT NULL,
	"permission" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" text NOT NULL,
	"branch_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "role_id" uuid;
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "branch_id" uuid;
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "sent_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "invitation" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "role_id" uuid;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "deactivated_at" timestamp;
--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "branch_members" ADD CONSTRAINT "branch_members_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "branch_members" ADD CONSTRAINT "branch_members_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "branch_members" ADD CONSTRAINT "branch_members_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_roles_org" ON "roles" USING btree ("organization_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_roles_org_slug" ON "roles" USING btree ("organization_id","slug");
--> statement-breakpoint
CREATE INDEX "idx_role_permissions_org" ON "role_permissions" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role" ON "role_permissions" USING btree ("role_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_role_permissions_role_perm" ON "role_permissions" USING btree ("role_id","permission");
--> statement-breakpoint
CREATE INDEX "idx_branch_members_org" ON "branch_members" USING btree ("organization_id");
--> statement-breakpoint
CREATE INDEX "idx_branch_members_member" ON "branch_members" USING btree ("member_id");
--> statement-breakpoint
CREATE INDEX "idx_branch_members_branch" ON "branch_members" USING btree ("branch_id");
--> statement-breakpoint
CREATE INDEX "idx_branch_members_org_branch" ON "branch_members" USING btree ("organization_id","branch_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_branch_members_member_branch" ON "branch_members" USING btree ("member_id","branch_id");
