# Beres Cloud Monorepo

Monorepo untuk Beres Cloud (ERP/operational OS untuk tenant UMKM). Repo ini berisi backend API, dashboard tenant, customer order app, dan marketing site.

## Apps

- `apps/backend`: Hono.js API (Cloudflare Workers). Sumber utama endpoint dashboard dan public order intake.
- `apps/app`: Dashboard tenant (Next.js). Operasional internal dan verifikasi order.
- `apps/order`: Customer order app (Next.js). Entry dari WhatsApp untuk membuat order terstruktur.
- `apps/web`: Marketing/public site (Next.js). Redirect ke dashboard dan order app bila perlu.
- `apps/docs`: Dokumentasi internal.

## Arsitektur Singkat

- Customer order masuk melalui `apps/order` -> `apps/backend` (public routes).
- Order masuk disimpan sebagai intake (pre-verification).
- Tenant memverifikasi intake dari `apps/app` -> `apps/backend` (dashboard routes).
- Order operasional hanya dibuat setelah intake diterima.

## Struktur Data Inti (high level)

- `customer_order_intakes`: intake publik dari customer.
- `laundry_orders`: order operasional setelah diverifikasi.

## Routing Penting

- Customer order: `/order/[tenantSlug]` dan `/order/[tenantSlug]/[branchSlug]` di `apps/order`.
- Dashboard laundry: `/laundry/orders` di `apps/app`.

## Menjalankan Lokal

1. Install dependencies

```
pnpm install
```

2. Jalankan app tertentu

```
# Backend API
pnpm -C apps/backend dev

# Dashboard tenant
pnpm -C apps/app dev

# Customer order app
pnpm -C apps/order dev

# Marketing site
pnpm -C apps/web dev
```

## Env Penting

- `NEXT_PUBLIC_API_URL` (apps/order, apps/web): base URL ke backend.
- `OWNER_APP_URL` (apps/web): redirect ke dashboard tenant.
- `ORDER_APP_URL` (apps/web): redirect ke customer order app.

## Catatan

- Customer order flow sekarang dipisah ke `apps/order` untuk memudahkan wildcard/domain routing.
- `apps/web` tidak lagi menampung route `/order` agar tidak double handling.
