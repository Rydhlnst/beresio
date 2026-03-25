-- Migration: Add discount and tax to transactions

--> statement-breakpoint

ALTER TABLE "transactions"
	ADD COLUMN "discount_amount" integer DEFAULT 0 NOT NULL,
	ADD COLUMN "tax_amount" integer DEFAULT 0 NOT NULL;
