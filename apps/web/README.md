# Web App (Marketing / Public)

Aplikasi Next.js untuk marketing site dan halaman publik non-dashboard.

## Catatan Routing

- `/order/*` tidak lagi dilayani di app ini.
- Jika `ORDER_APP_URL` diset, maka `/order/*` akan redirect ke customer order app (`apps/order`).
- Dashboard routes redirect ke `OWNER_APP_URL`.

## Menjalankan Lokal

```
pnpm -C apps/web dev
```
