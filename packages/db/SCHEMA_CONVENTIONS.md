# Database Schema Conventions (Beresio)

Goal: keep code-level names camelCase and database identifiers snake_case. No dashes anywhere.

## Naming Rules

- TypeScript field names: `camelCase`
- Database table/column names: `snake_case`
- Never use `-` (dash) in any identifier (TS or DB)
- Keep existing table names as-is to avoid breaking changes
- New domain tables should follow the current pattern: plural `snake_case` (auth tables are exceptions and stay singular)

## Drizzle Mapping Pattern

Use explicit DB identifiers to keep TS camelCase while storing snake_case in Postgres.

```ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Foreign Keys

- TS: `xxxId` (camelCase)
- DB: `xxx_id` (snake_case)

Example:

```ts
branchId: uuid("branch_id").notNull().references(() => branches.id),
```

## Index / Constraint Names

Use snake_case:

- `idx_<table>_<column(s)>`
- `uq_<table>_<column(s)>`
- `fk_<table>_<column>`

## Do / Don't

- Do: `organizationId` -> `organization_id`
- Do: `createdAt` -> `created_at`
- Don't: `organization-id` or `organizationId` in the DB column name
