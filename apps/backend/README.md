# Backend (Hono + Cloudflare Workers)

Backend API untuk Beres Cloud. Menyediakan:
- Dashboard routes (auth) untuk operasional tenant.
- Public routes untuk customer order intake.

## Tech

- Hono.js
- Drizzle ORM
- Cloudflare Workers

## Menjalankan Lokal

```
pnpm -C apps/backend dev
```

## Struktur Route Utama

- `/api/dashboard/*` -> authenticated dashboard API.
- `/api/public/*` -> public API (customer order intake).

## Laundry Order Flow (ringkas)

1. Public order intake -> `/api/public/laundry/order-intakes`
2. Dashboard verifikasi -> `/api/dashboard/laundry/order-intakes/:id/accept`
3. Setelah accepted, dibuat `laundry_orders`.

## Testing

```
pnpm -C apps/backend test
```
