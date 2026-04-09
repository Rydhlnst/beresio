-- Laundry domain events + notification outbox (hook-ready, no provider send)

CREATE TABLE IF NOT EXISTS "laundry_domain_events" (
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
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_domain_events_organization_id_organization_id_fk') THEN
        ALTER TABLE "laundry_domain_events"
            ADD CONSTRAINT "laundry_domain_events_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_domain_events_branch_id_branches_id_fk') THEN
        ALTER TABLE "laundry_domain_events"
            ADD CONSTRAINT "laundry_domain_events_branch_id_branches_id_fk"
            FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_domain_events_order_id_laundry_orders_id_fk') THEN
        ALTER TABLE "laundry_domain_events"
            ADD CONSTRAINT "laundry_domain_events_order_id_laundry_orders_id_fk"
            FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_domain_events_actor_id_user_id_fk') THEN
        ALTER TABLE "laundry_domain_events"
            ADD CONSTRAINT "laundry_domain_events_actor_id_user_id_fk"
            FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id")
            ON DELETE set null ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_laundry_domain_events_sequence" ON "laundry_domain_events" USING btree ("sequence");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_domain_events_org_sequence" ON "laundry_domain_events" USING btree ("organization_id","sequence");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_domain_events_type" ON "laundry_domain_events" USING btree ("event_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_domain_events_order" ON "laundry_domain_events" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_domain_events_branch" ON "laundry_domain_events" USING btree ("branch_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "laundry_notification_outbox" (
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
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_notification_outbox_organization_id_organization_id_fk') THEN
        ALTER TABLE "laundry_notification_outbox"
            ADD CONSTRAINT "laundry_notification_outbox_organization_id_organization_id_fk"
            FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_notification_outbox_branch_id_branches_id_fk') THEN
        ALTER TABLE "laundry_notification_outbox"
            ADD CONSTRAINT "laundry_notification_outbox_branch_id_branches_id_fk"
            FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_notification_outbox_order_id_laundry_orders_id_fk') THEN
        ALTER TABLE "laundry_notification_outbox"
            ADD CONSTRAINT "laundry_notification_outbox_order_id_laundry_orders_id_fk"
            FOREIGN KEY ("order_id") REFERENCES "public"."laundry_orders"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'laundry_notification_outbox_domain_event_id_laundry_domain_events_id_fk') THEN
        ALTER TABLE "laundry_notification_outbox"
            ADD CONSTRAINT "laundry_notification_outbox_domain_event_id_laundry_domain_events_id_fk"
            FOREIGN KEY ("domain_event_id") REFERENCES "public"."laundry_domain_events"("id")
            ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_outbox_org_status" ON "laundry_notification_outbox" USING btree ("organization_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_outbox_next_retry" ON "laundry_notification_outbox" USING btree ("next_retry_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_outbox_org_created" ON "laundry_notification_outbox" USING btree ("organization_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_laundry_outbox_order" ON "laundry_notification_outbox" USING btree ("order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_laundry_outbox_event_channel" ON "laundry_notification_outbox" USING btree ("domain_event_id","channel");
