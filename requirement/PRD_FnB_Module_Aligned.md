# PRD FnB Alignment - Beresio (MVP Operasional)

**Status:** Draft Implementable  
**Tanggal:** 1 April 2026  
**Owner:** Product + Backend  
**Scope:** Vertical FnB (Restoran/Kafe) pada stack Beresio saat ini

---

## 1) Ringkasan

Dokumen ini adalah versi PRD FnB yang sudah diselaraskan dengan kondisi kode dan dependency di monorepo Beresio, dengan target **MVP operasional**:

- Manajemen meja
- Menu dasar untuk operasional FnB
- Order dine-in
- Split/merge bill
- Hold bill
- Integrasi stok dasar

Fokus dokumen ini bukan mengganti stack, melainkan mengunci requirement FnB agar bisa langsung dieksekusi di arsitektur yang sudah berjalan.

---

## 2) Baseline Arsitektur (Terkunci)

### 2.1 Stack Teknis yang Dipakai (Current State)

- Frontend dashboard: Next.js App Router (`apps/app`)
- Backend API: Hono.js di Cloudflare Workers (`apps/backend`)
- ORM: Drizzle ORM
- Database: Neon PostgreSQL (`drizzle-orm/neon-http`)
- Auth: Better Auth + organization context
- Validasi: Zod / validator pattern existing

### 2.2 Ketetapan Alignment

- Tidak ada migrasi ke D1/KV/DO untuk fase ini.
- Multi-tenant tetap `organizationId`.
- Akses operasional tetap branch-scoped (cabang) sesuai helper akses branch.

---

## 3) Struktur Project yang Dijadikan Acuan

- API layer: `D:\Projects\beresio\apps\backend`
- Shared schema/types: `D:\Projects\beresio\packages\db\src`
- Dashboard FnB/UI: `D:\Projects\beresio\apps\app`
- Requirement docs: `D:\Projects\beresio\requirement`

---

## 4) Gap Matrix PRD vs Codebase

| Capability FnB | Status | Catatan |
|---|---|---|
| Auth + context organisasi | Ready | Sudah ada via Better Auth + org context |
| Branch-scoped access | Ready | Sudah ada helper akses branch |
| Core order + order item + event | Ready | Domain order sudah berjalan |
| Inventory dasar | Ready | Adjustment/movement/stock sudah ada |
| Product/variant dasar | Ready | Sudah ada product + variant |
| Vertical nav FnB (`meja`, `menu`) | Ready | Sudah ada di nav config backend |
| Halaman menu/meja | Partial | UI masih placeholder |
| Order flow khusus dine-in FnB | Partial | Belum jadi alur default untuk FnB |
| Table occupancy/session lifecycle | Missing | Belum ada lifecycle meja end-to-end |
| Split/merge bill orchestration | Missing | Belum ada contract API final |
| Hold bill lifecycle | Missing | Belum ada contract API final |
| Menu schedule rule (jam aktif) | Missing | Belum ada aturan jadwal operasional menu |

---

## 5) Desain Domain FnB (Tanpa Ganti Core Domain)

## 5.1 Prinsip Utama

- **Tetap pakai `orders` sebagai core transaksi FnB.**
- Tambahan FnB masuk sebagai extension domain, bukan domain transaksi baru.
- Reuse payment flow existing untuk multi-part pembayaran (split bill), bukan bikin payment engine baru.

## 5.2 Entitas Tambahan yang Diperlukan

Minimal extension yang direkomendasikan:

1. `fnb_tables`  
Menyimpan meja per cabang: kode, nama, area, kapasitas, status.

2. `fnb_table_sessions`  
Siklus okupansi meja: open/held/closed, guest count, order aktif, waktu buka/tutup.

3. `fnb_menu_schedule_rules`  
Aturan jam jual menu per produk (opsional per cabang) untuk validasi item availability.

4. Ekstensi `orders`  
Tambahan metadata FnB: `serviceMode`, `tableId`, `guestCount`, `holdState`.

---

## 6) Kontrak API MVP (Kunci Implementasi)

## 6.1 Group Route FnB

Base: `/api/dashboard/fnb`

- `GET /tables`
- `POST /tables`
- `PATCH /tables`

- `GET /table-sessions`
- `POST /table-sessions`
- `PATCH /table-sessions`

## 6.2 Ekstensi Route Order

Base existing: `/api/dashboard/orders`

- Extend `POST /` payload:
  - `serviceMode` (`walk_in|dine_in|pickup|delivery|take_away`)
  - `tableId` (required jika `serviceMode=dine_in`)
  - `guestCount`
  - `holdState` (`none|held|resumed|released`)

- Extend `PATCH /:id` payload:
  - `serviceMode`
  - `tableId`
  - `guestCount`
  - `holdState`

- Tambah endpoint operasional:
  - `PATCH /:id/hold` (hold/release)
  - `POST /:id/split` (split bill parts)
  - `POST /merge` (merge beberapa order ke target order)

## 6.3 Rule Validasi MVP

- Jika `serviceMode=dine_in`, `tableId` wajib.
- Item yang memiliki schedule aktif hanya bisa dipesan pada slot waktu valid.
- Split bill: total seluruh bagian harus sama dengan total order.
- Merge bill: source order harus 1 cabang dengan target order.

---

## 7) Alignment Modul dan Permission

## 7.1 Module Key (diselaraskan)

Untuk sinkronisasi nav vs type-level config, module key yang dipakai:

- Base: `dashboard`, `crm`, `order`, `inventory`, `laporan`, `cabang`, `tim`, `pengaturan`
- Vertical laundry: `pickup`
- Vertical fnb: `meja`, `menu`
- Vertical retail: `products`, `suppliers`

## 7.2 Permission Minimum FnB

- `tables.read`, `tables.manage`
- `menu.read`, `menu.manage`
- `order.read`, `order.create`, `order.manage`

---

## 8) Test Plan (Implementasi)

## 8.1 Schema

- Validasi FK/index untuk tabel FnB baru.
- Validasi tidak ada regresi query pada `orders`, `inventory`, dan navigation builder.

## 8.2 API (Vitest)

- CRUD meja.
- Lifecycle session meja (open/hold/close).
- Create/update order dine-in dengan branch access.
- Split/merge/hold behavior + audit event.
- Menu schedule blocking (item tidak bisa dipesan di luar slot).

## 8.3 Authorization

- User tanpa permission FnB tidak bisa akses endpoint FnB.
- Nav/sidebar hanya menampilkan modul sesuai permission.

---

## 9) Acceptance Scenario MVP

Skenario operasional utama:

1. Kasir buka meja.
2. Kasir tambah item order dine-in.
3. Kasir hold bill.
4. Kasir resume bill.
5. Bill di-split untuk beberapa pembayaran.
6. Pembayaran selesai.
7. Meja kembali `available`.

Skenario validasi menu:

1. Produk punya schedule aktif.
2. User order di luar jam schedule.
3. API menolak dengan error availability.

---

## 10) Out of Scope (Fase Lanjutan)

- KDS real-time advanced
- Promo waktu kompleks (rule engine penuh)
- Analytics FnB mendalam (menu engineering lanjutan)
- Migrasi storage engine (D1/KV/DO)

---

## 11) Catatan Eksekusi

Dokumen ini disusun agar implementer bisa langsung lanjut ke task teknis tanpa membuat keputusan arsitektur ulang. Semua keputusan inti (stack, tenancy, scope MVP, kontrak API, dan permission baseline) sudah dikunci di sini.
