# BERES MVP — Dashboard & CRM PRD
## Rencana Lengkap: Dari Codebase Understanding Hingga Implementasi

**Version:** 2.0  
**Last Updated:** March 2026  
**Status:** Active Planning — MVP Phase  
**Scope:** Dashboard (app.beres.io/dashboard) + CRM Module  
**Berdasarkan:** BERES_MASTER_MODULE_DOCUMENT.md + Competitive Analysis (Moka, ESB, Pawoon)

---

## 📋 Daftar Isi

1. [Perintah Memahami Codebase](#1-perintah-memahami-codebase)
2. [Analisis Current State](#2-analisis-current-state)
3. [Gap Analysis vs Kompetitor](#3-gap-analysis-vs-kompetitor)
4. [Revised PRD: Dashboard MVP](#4-revised-prd-dashboard-mvp)
5. [New Module: CRM MVP](#5-new-module-crm-mvp)
6. [Backend Architecture & API Contracts](#6-backend-architecture--api-contracts)
7. [Database Schema (Drizzle ORM)](#7-database-schema-drizzle-orm)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Data Flow & Korelasi Antar Modul](#9-data-flow--korelasi-antar-modul)
10. [Revised Sidebar & Navigation](#10-revised-sidebar--navigation)
11. [Implementation Checklist (Urutan Eksekusi)](#11-implementation-checklist-urutan-eksekusi)
12. [Definisi "Done" untuk MVP](#12-definisi-done-untuk-mvp)

---

## 1. Perintah Memahami Codebase

> **Tujuan:** Sebelum menulis satu baris kode pun, AI coding agent (Cursor/Claude) harus membaca dan memahami codebase yang sudah ada. Gunakan prompt-prompt berikut secara berurutan.

### 1.1 Prompt — Baca Struktur Monorepo

```
Baca seluruh struktur direktori beresio/ dan beri tahu aku:
1. Apa saja packages dan apps yang ada di monorepo ini?
2. Di mana lokasi Drizzle schema (biasanya di packages/shared/src/schema)?
3. Di mana lokasi API routes untuk Hono.js (apps/api/src)?
4. Di mana lokasi Next.js app router pages (apps/app/src/app)?
5. Apakah sudah ada folder untuk dashboard, CRM, atau customers?
6. Apakah sudah ada file mock data (apps/app/lib/mock/)?

Tampilkan hasilnya sebagai tree struktur, dan tandai file yang paling relevan
dengan dashboard dan customer data.
```

### 1.2 Prompt — Audit Drizzle Schema yang Ada

```
Baca file packages/shared/src/schema/index.ts (atau semua file .ts di folder schema).
Beri tahu aku:
1. Tabel apa saja yang sudah ada? List semua beserta kolom utamanya.
2. Apakah sudah ada tabel: orders, customers, branches, inventory_items?
3. Apakah organization_id dan branch_id sudah ada sebagai foreign key di tabel transaksi?
4. Apakah sudah ada enum untuk status order?
5. Apakah sudah ada relasi (relations()) untuk tabel-tabel tersebut?

JANGAN ubah apapun, hanya baca dan laporkan.
```

### 1.3 Prompt — Audit API Routes yang Ada

```
Baca semua file di apps/api/src/routes/ (atau folder yang setara).
Beri tahu aku:
1. Endpoint apa saja yang sudah ada? List method + path-nya (GET /api/xxx).
2. Apakah sudah ada endpoint untuk: orders, customers, branches, dashboard?
3. Apakah ada middleware untuk auth (Better Auth) dan tenant isolation?
4. Bagaimana cara Hono.js di-deploy? Apakah menggunakan Cloudflare Workers?
5. Apakah sudah ada validasi Zod di request handler?

JANGAN ubah apapun, hanya baca dan laporkan.
```

### 1.4 Prompt — Audit Dashboard Frontend yang Ada

```
Baca semua file di apps/app/src/app/dashboard/ (atau path setara).
Beri tahu aku:
1. Komponen apa saja yang sudah ada di dashboard?
2. KPI cards apa yang sudah dirender? Apakah data-nya masih mock/hardcoded?
3. Apakah sudah ada TanStack Query untuk fetching data dashboard?
4. Apakah ada file mock data di apps/app/lib/mock/dashboard.ts?
5. Apakah sidebar sudah config-driven atau masih hardcoded?
6. Apakah ada komponen chart? Library apa yang digunakan (Recharts/Chart.js)?

Tampilkan struktur komponen yang ada sekarang.
```

### 1.5 Prompt — Audit Better Auth & Org Context

```
Baca konfigurasi Better Auth di apps/app (biasanya auth.ts atau lib/auth.ts).
Beri tahu aku:
1. Plugin apa saja yang diaktifkan? Apakah Organization Plugin sudah aktif?
2. Bagaimana cara mendapat organizationId dari session saat ini?
3. Apakah ada middleware yang mengeset organizationId ke request context?
4. Bagaimana cara akses currentOrganization di Server Component?
5. Apakah ada store Zustand untuk org context?

Ini penting untuk memastikan semua API call ter-scope ke organization yang benar.
```

### 1.6 Prompt — Identifikasi File yang Perlu Dibuat vs Dimodifikasi

```
Berdasarkan hasil audit sebelumnya, buat daftar:

PERLU DIBUAT (belum ada):
- [ ] File/folder apa yang perlu dibuat dari nol?

PERLU DIMODIFIKASI (sudah ada, perlu update):
- [ ] File apa yang perlu diubah tanpa merusak yang lain?

SUDAH SESUAI (tidak perlu disentuh):
- [ ] File apa yang sudah benar dan tidak perlu diubah?

Fokus pada scope: Dashboard KPI cards, CRM module (/crm), 
dan API endpoints untuk keduanya.
```

---

## 2. Analisis Current State

### 2.1 Screenshot Analysis

Berdasarkan screenshot yang ada, dashboard saat ini memiliki:

| Widget | Status | Masalah |
|--------|--------|---------|
| Total Revenue | ⚠️ Ada, data Rp 0 | Data belum terkoneksi ke orders table |
| Total Customers | ⚠️ Ada, data 0 | Data belum terkoneksi ke customers table |
| Active Sessions | ❌ Tidak relevan | Ini metrik teknis, bukan bisnis. Hapus. |
| Security Alerts | ❌ Tidak relevan | Owner tidak peduli ini. Hapus. |
| Tren Revenue | ⚠️ Ada, kosong | UI ready, data belum terkoneksi |
| Revenue per Cabang | ⚠️ Ada, kosong | UI ready, data belum terkoneksi |
| Sorotan Utama | ⚠️ Placeholder | Perlu diisi dengan actionable insights |
| Operasional | ⚠️ "Belum ada cabang aktif" | Perlu terkoneksi ke branches table |
| Akses & Tim | ✅ Tampil owner | Sudah benar |

### 2.2 Sidebar Analysis

**Sidebar saat ini:**
```
MENU DASAR
  Inventory
  Report

MENU RETAIL
  POS
  Pelanggan

Organisasi
  Indomarettt (dot merah)
```

**Masalah:**
1. Tidak ada link ke Dashboard sendiri
2. "Pelanggan" ada tapi kemungkinan belum ada halaman CRM penuh
3. Tidak ada menu Pesanan, Delivery, Cabang, Tim
4. Kategorisasi menu tidak mencerminkan alur kerja owner
5. Tidak ada link ke Settings

---

## 3. Gap Analysis vs Kompetitor

### 3.1 Moka POS Dashboard Features

Moka POS (kompetitor utama, 30k+ merchants) memiliki di dashboard-nya:
- Omzet hari ini + perbandingan kemarin
- Jumlah transaksi
- Rata-rata nilai transaksi
- Top produk terlaris
- Grafik penjualan per jam
- Daftar transaksi terbaru

### 3.2 ESB (Enterprise Solutions) Dashboard Features

ESB memiliki:
- Revenue per cabang (real-time)
- Customer count + new customers
- Delivery performance (on-time rate)
- Inventory alert (low stock)
- Staff activity

### 3.3 Gap Matrix Beres vs Kompetitor

| Feature | Moka | ESB | Pawoon | **Beres Current** | **Beres Target MVP** |
|---------|------|-----|--------|-------------------|----------------------|
| Omzet hari ini | ✅ | ✅ | ✅ | ⚠️ (UI ada, data kosong) | ✅ |
| Jumlah transaksi | ✅ | ✅ | ✅ | ❌ | ✅ |
| Pelanggan baru | ⚠️ | ✅ | ❌ | ❌ | ✅ |
| Top produk | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| Revenue per cabang | ❌ | ✅ | ❌ | ⚠️ (UI ada) | ✅ |
| Low stock alert | ⚠️ | ✅ | ❌ | ❌ | ✅ |
| Transaksi terbaru | ✅ | ✅ | ✅ | ❌ | ✅ |
| CRM dasar | ✅ | ✅ | ✅ | ❌ | ✅ ← **TAMBAH** |
| Delivery tracking | ❌ | ⚠️ | ❌ | ❌ | 🔄 (Phase 2) |

**Kesimpulan:** Beres harus setara Moka di features dasar sebelum bisa positioning sebagai "lebih baik". CRM adalah **blocker** untuk parity.

---

## 4. Revised PRD: Dashboard MVP

### 4.1 Tujuan

Dashboard `app.beres.io/dashboard` adalah **halaman pertama yang dilihat Owner/Admin** setelah login. Harus menjawab pertanyaan:

> *"Bagaimana bisnisku hari ini?"*

### 4.2 KPI Cards (Section Atas)

Ganti 4 KPI cards yang ada dengan:

#### Card 1 — Omzet Hari Ini
```
Label: "Omzet Hari Ini"
Value: Rp [total_revenue_today]
Sub: "vs kemarin: [+/-X%] [arrow icon]"
Icon: DollarSign (lucide-react)
Color: Hijau jika positif, Merah jika negatif
```

#### Card 2 — Pesanan Hari Ini
```
Label: "Pesanan Hari Ini"  
Value: [orders_count_today]
Sub: "[pending_count] menunggu aksi"
Icon: ShoppingBag (lucide-react)
Action: Klik → /orders
```

#### Card 3 — Pelanggan Baru
```
Label: "Pelanggan Baru"
Value: [new_customers_today]
Sub: "Total: [total_customers]"
Icon: Users (lucide-react)
Action: Klik → /crm
```

#### Card 4 — Cabang Aktif
```
Label: "Cabang Aktif"
Value: [active_branches] / [total_branches]
Sub: "Semua operasional normal" ATAU "X cabang bermasalah"
Icon: Store (lucide-react)
Action: Klik → /branches
```

### 4.3 Charts Section (Baris Kedua)

#### Chart 1 — Tren Omzet (kiri, 2/3 lebar)
```
Type: Line chart (Recharts atau Chart.js — sesuai yang sudah ada di codebase)
Period toggle: 7H (hari ini per jam) | 7D | 30D | 3M
X-axis: Waktu
Y-axis: Rp (formatted: "1.5jt", "500rb")
Data source: GET /api/dashboard/revenue-trend?period=7d
```

#### Chart 2 — Revenue per Cabang (kanan, 1/3 lebar)
```
Type: Horizontal bar chart
Data: [{branch_name, revenue}] diurutkan descending
Warna: Sesuai brand color Beres (oranye dari screenshot)
Data source: GET /api/dashboard/revenue-by-branch
```

### 4.4 Operational Panel (Baris Ketiga)

#### Panel Kiri — Pesanan Terbaru
```
Title: "Pesanan Terbaru"
Content: List 5 transaksi terakhir
Columns: No. Pesanan | Pelanggan | Total | Status | Waktu
Action: "Lihat semua" → /orders
Data source: GET /api/orders?limit=5&sort=desc
```

#### Panel Kanan — Alerts & Actions
```
Title: "Perlu Perhatian"
Items (berurutan prioritas):
  1. 🔴 [X] produk stok habis → /inventory
  2. 🟡 [X] pesanan pending > 30 menit → /orders
  3. 🟢 Info: [X] pelanggan baru hari ini → /crm

Jika semua clear: "✅ Semua berjalan normal"
```

#### Panel Tambahan — Top 5 Produk (opsional di MVP)
```
Title: "Produk Terlaris Hari Ini"
Content: List nama produk + jumlah terjual
Data source: GET /api/dashboard/top-products?limit=5
```

### 4.5 Data Refresh Strategy

```
Polling interval per widget:
─────────────────────────────
KPI Cards          → setiap 30 detik (TanStack Query refetchInterval)
Charts             → setiap 5 menit (tidak perlu real-time)
Pesanan Terbaru    → setiap 30 detik
Alerts Panel       → setiap 60 detik

CATATAN: Tidak pakai WebSocket/SSE untuk dashboard MVP.
Polling sudah cukup untuk Owner yang tidak monitor detik per detik.
WebSocket masuk Phase 2 untuk staff operasional.
```

### 4.6 Loading & Empty States

```
Loading: Skeleton loader untuk setiap card/chart (shadcn/ui Skeleton)
Empty (baru setup): 
  - KPI cards: "Rp 0" dengan sub "Mulai catat transaksi pertama"
  - Chart: Ilustrasi + CTA "Buat pesanan pertama"
  - Cabang kosong: "Tambah cabang pertama" → /settings/branches/new
Error:
  - Toast error + tombol "Coba lagi"
  - Jangan crash seluruh dashboard jika 1 widget error
```

---

## 5. New Module: CRM MVP

> **Kenapa CRM masuk MVP?**  
> Moka, ESB, Pawoon semua punya customer database. Tanpa CRM, Beres tidak punya data pelanggan yang bisa digunakan untuk:
> - Widget "Pelanggan Baru" di dashboard
> - Riwayat pembelian saat proses POS (buka transaksi lama)
> - Future: loyalty program, kampanye marketing

### 5.1 Halaman CRM — `/crm`

#### Layout
```
Header: "Pelanggan" | [+ Tambah Pelanggan] [Import CSV]
Search bar: "Cari nama, telepon, atau email..."
Filter: Semua | Aktif | Tidak Aktif | Pelanggan Baru (7 hari)
Sort: Terbaru | Omzet Tertinggi | Nama A-Z

Table columns:
  Nama | No. Telepon | Email | Total Pembelian | Pesanan | Terakhir Beli | Aksi
```

#### Customer Row Actions
```
[Lihat Detail] → /crm/[id]
[Buat Pesanan] → /pos?customer_id=[id]
[⋮] → Edit | Nonaktifkan
```

#### Pagination
```
Default: 20 per halaman
Options: 20 | 50 | 100
```

### 5.2 Halaman Detail Pelanggan — `/crm/[id]`

#### Section 1 — Profil
```
Avatar (inisial nama)
Nama lengkap [Edit inline]
No. Telepon [Edit inline]  
Email [Edit inline]
Bergabung sejak: [created_at formatted]
Status: Aktif / Tidak Aktif [Toggle]
```

#### Section 2 — KPI Mini
```
4 cards kecil:
- Total Pembelian (lifetime)
- Jumlah Pesanan
- Rata-rata Nilai Pesanan
- Pembelian Terakhir (X hari lalu)
```

#### Section 3 — Riwayat Pesanan
```
Table: No. Pesanan | Tanggal | Items | Total | Status | Cabang
Sort: Terbaru ke terlama
Pagination: 10 per halaman
```

#### Section 4 — Alamat (untuk delivery)
```
List alamat tersimpan
[+ Tambah Alamat]
Bisa set "Alamat Utama"
```

### 5.3 Flow Tambah Pelanggan

```
Option A — Manual dari /crm:
  Klik "+ Tambah Pelanggan"
  Form modal: Nama*, Telepon*, Email (opsional)
  Submit → POST /api/customers
  Redirect ke /crm/[new_id]

Option B — Auto dari POS:
  Saat kasir input nomor telepon di POS
  Sistem cek: apakah nomor sudah terdaftar?
    YES → load data pelanggan otomatis
    NO  → prompt "Daftarkan pelanggan baru?" 
         → simpan dengan nama + telepon saja

Option C — Import CSV (P2, bukan MVP):
  Upload CSV dengan format: nama,telepon,email
  Preview 10 baris pertama
  Konfirmasi → import
```

### 5.4 Integrasi CRM ke Dashboard

```
Dashboard Widget "Pelanggan Baru":
  Query: SELECT COUNT(*) FROM customers 
         WHERE organization_id = ? 
         AND created_at >= CURRENT_DATE
         AND created_at < CURRENT_DATE + 1

Dashboard Widget "Total Pelanggan":
  Query: SELECT COUNT(*) FROM customers 
         WHERE organization_id = ?
         AND is_active = true
```

---

## 6. Backend Architecture & API Contracts

### 6.1 Tech Stack Reminder

```
apps/api  → Hono.js on Cloudflare Workers
  ⚠️ WAJIB pakai drizzle-orm/neon-http (bukan WebSocket)
  ⚠️ Better Auth hanya di apps/app (Next.js), BUKAN di apps/api
  ⚠️ Organization context didapat dari request header atau JWT claim

apps/app  → Next.js 15 App Router
  → Server Components untuk initial data fetch
  → TanStack Query untuk client-side polling & mutations
  → Zustand untuk UI state (org context, sidebar open/close)
```

### 6.2 Auth & Tenant Isolation Pattern

```typescript
// Pattern yang harus diikuti di SETIAP route Hono:

// apps/api/src/middleware/auth.ts
export const authMiddleware = async (c: Context, next: Next) => {
  // Ambil token dari Authorization header
  const token = c.req.header('Authorization')?.replace('Bearer ', '')
  
  // Verifikasi session (call ke Better Auth di apps/app atau decode JWT)
  const session = await verifyToken(token)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  
  // Set ke context agar bisa diakses di handler
  c.set('userId', session.userId)
  c.set('organizationId', session.organizationId) // WAJIB ada
  
  await next()
}

// Di setiap handler, SELALU filter by organizationId:
app.get('/api/customers', authMiddleware, async (c) => {
  const orgId = c.get('organizationId') // Dari middleware, BUKAN dari query param
  
  const customers = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.organizationId, orgId)) // ← WAJIB
    .limit(20)
  
  return c.json({ data: customers })
})
```

### 6.3 API Endpoints — Dashboard

#### `GET /api/dashboard/summary`

**Purpose:** Satu endpoint untuk semua KPI cards (mengurangi jumlah request)

**Query params:** `?org_id` (atau dari context)

**Response:**
```typescript
{
  revenue: {
    today: number,          // Rp total hari ini
    yesterday: number,      // Rp total kemarin
    change_pct: number,     // Persentase perubahan
    change_direction: 'up' | 'down' | 'flat'
  },
  orders: {
    today: number,          // Jumlah pesanan hari ini
    pending: number,        // Pesanan belum diproses
    change_pct: number
  },
  customers: {
    total: number,          // Total pelanggan aktif
    new_today: number       // Baru daftar hari ini
  },
  branches: {
    active: number,         // Cabang status aktif
    total: number           // Total semua cabang
  },
  alerts: {
    low_stock_count: number,     // Produk stok < threshold
    overdue_orders_count: number // Pesanan pending > 30 menit
  }
}
```

**SQL logic (Drizzle):**
```typescript
// Semua query dijalankan PARALEL dengan Promise.all untuk performa
const [revenueToday, revenueYesterday, ordersToday, ...] = await Promise.all([
  
  // Revenue hari ini
  db.select({ total: sum(orders.totalAmount) })
    .from(orders)
    .where(and(
      eq(orders.organizationId, orgId),
      gte(orders.createdAt, startOfDay(new Date())),
      eq(orders.status, 'completed')
    )),
  
  // Revenue kemarin
  db.select({ total: sum(orders.totalAmount) })
    .from(orders)
    .where(and(
      eq(orders.organizationId, orgId),
      gte(orders.createdAt, startOfDay(subDays(new Date(), 1))),
      lt(orders.createdAt, startOfDay(new Date())),
      eq(orders.status, 'completed')
    )),
  
  // ... query lainnya
])
```

#### `GET /api/dashboard/revenue-trend`

**Query params:** `?period=7d` (options: `today`, `7d`, `30d`, `3m`)

**Response:**
```typescript
{
  period: '7d',
  data: [
    { label: '20 Mar', value: 1500000 },
    { label: '21 Mar', value: 2300000 },
    // ...
  ]
}
```

#### `GET /api/dashboard/revenue-by-branch`

**Response:**
```typescript
{
  data: [
    { branch_id: 'xxx', branch_name: 'Jakarta', revenue: 5000000 },
    { branch_id: 'yyy', branch_name: 'Bandung', revenue: 3200000 },
  ]
}
```

#### `GET /api/dashboard/top-products`

**Query params:** `?limit=5&period=today`

**Response:**
```typescript
{
  data: [
    { product_id: 'xxx', product_name: 'Kopi Susu', qty_sold: 45, revenue: 675000 },
    // ...
  ]
}
```

### 6.4 API Endpoints — CRM

#### `GET /api/customers`

**Query params:** `?search=&status=active&sort=latest&page=1&limit=20`

**Response:**
```typescript
{
  data: [
    {
      id: string,
      name: string,
      phone: string,
      email: string | null,
      total_spent: number,
      total_orders: number,
      last_order_at: string | null,
      created_at: string,
      is_active: boolean
    }
  ],
  pagination: {
    page: number,
    limit: number,
    total: number,
    total_pages: number
  }
}
```

#### `POST /api/customers`

**Body:**
```typescript
{
  name: string,        // required, min 2 char
  phone: string,       // required, format Indonesia (+62/08xx)
  email?: string       // optional
}
```

**Response:** Customer object yang baru dibuat + `201 Created`

#### `GET /api/customers/:id`

**Response:**
```typescript
{
  customer: {
    id: string,
    name: string,
    phone: string,
    email: string | null,
    total_spent: number,
    total_orders: number,
    last_order_at: string | null,
    created_at: string,
    is_active: boolean,
    addresses: Address[]
  },
  recent_orders: Order[]  // 10 terbaru
}
```

#### `PATCH /api/customers/:id`

**Body:** (semua opsional, hanya field yang dikirim yang diupdate)
```typescript
{
  name?: string,
  phone?: string,
  email?: string,
  is_active?: boolean
}
```

#### `POST /api/customers/lookup`

**Purpose:** Cek pelanggan dari POS saat input nomor telepon

**Body:** `{ phone: string }`

**Response:**
```typescript
// Jika ketemu:
{ found: true, customer: { id, name, phone, total_orders, total_spent } }

// Jika tidak ketemu:
{ found: false }
```

---

## 7. Database Schema (Drizzle ORM)

### 7.1 Tabel yang Perlu Dicek Dulu

Sebelum buat migration, pastikan tabel ini SUDAH ADA atau belum:

```
Checklist (jalankan via Drizzle Studio atau psql):
□ organizations   → harusnya sudah ada (Better Auth Organization plugin)
□ branches        → harusnya sudah ada
□ orders          → mungkin sudah ada sebagian
□ order_items     → mungkin sudah ada
□ customers       → kemungkinan BELUM ada
□ products        → mungkin sudah ada
□ inventory_items → kemungkinan BELUM ada
```

### 7.2 Schema: customers Table

```typescript
// packages/shared/src/schema/customers.ts
// BUAT FILE BARU, jangan edit yang sudah ada

import {
  pgTable, uuid, varchar, text, boolean,
  timestamp, decimal, integer, index
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations' // sesuaikan path

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Info dasar
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),    // Format: 08xx atau +628xx
  email: varchar('email', { length: 255 }),
  notes: text('notes'),
  
  // Denormalized counters untuk performa dashboard
  // Artinya: nilai ini di-update setiap kali ada transaksi baru,
  // sehingga dashboard tidak perlu SUM() besar setiap query
  totalSpent: decimal('total_spent', { precision: 15, scale: 2 })
    .default('0').notNull(),
  totalOrders: integer('total_orders').default(0).notNull(),
  lastOrderAt: timestamp('last_order_at'),
  
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index untuk query yang sering dipakai
  orgIdx: index('customers_org_idx').on(table.organizationId),
  phoneIdx: index('customers_phone_idx').on(table.phone),
  createdAtIdx: index('customers_created_at_idx').on(table.createdAt),
}))

// Type inference (otomatis dari schema, tidak perlu tulis manual)
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
```

### 7.3 Schema: customer_addresses Table

```typescript
// packages/shared/src/schema/customer_addresses.ts

export const customerAddresses = pgTable('customer_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  
  label: varchar('label', { length: 50 }).default('Rumah'), // "Rumah", "Kantor", dll
  fullAddress: text('full_address').notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  isDefault: boolean('is_default').default(false).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  customerIdx: index('addresses_customer_idx').on(table.customerId),
}))
```

### 7.4 Schema: orders Table (jika belum ada)

> **PENTING:** Cek dulu apakah tabel ini sudah ada. Jika sudah ada, jangan buat ulang — hanya tambahkan kolom yang belum ada via migration.

```typescript
// packages/shared/src/schema/orders.ts
// HANYA buat jika belum ada

import { pgEnum } from 'drizzle-orm/pg-core'

export const orderStatusEnum = pgEnum('order_status', [
  'pending',    // Baru dibuat, belum diproses
  'processing', // Sedang diproses kitchen/staff
  'ready',      // Siap diambil/dikirim
  'completed',  // Selesai & dibayar
  'cancelled',  // Dibatalkan
])

export const orderTypeEnum = pgEnum('order_type', [
  'dine_in',   // Makan di tempat
  'takeaway',  // Bawa pulang
  'delivery',  // Dikirim
])

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 20 }).notNull().unique(),
  // Contoh format: ORD-20260322-0001
  
  organizationId: uuid('organization_id').notNull()
    .references(() => organizations.id),
  branchId: uuid('branch_id').notNull()
    .references(() => branches.id),
  customerId: uuid('customer_id')
    .references(() => customers.id), // Nullable: transaksi tanpa pelanggan terdaftar
  
  orderType: orderTypeEnum('order_type').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  discountAmount: decimal('discount_amount', { precision: 15, scale: 2 }).default('0'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  
  notes: text('notes'),
  createdBy: uuid('created_by'), // userId kasir
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  orgBranchIdx: index('orders_org_branch_idx').on(table.organizationId, table.branchId),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  statusIdx: index('orders_status_idx').on(table.status),
  customerIdx: index('orders_customer_idx').on(table.customerId),
}))
```

### 7.5 Relasi (Drizzle Relations)

```typescript
// packages/shared/src/schema/relations.ts

import { relations } from 'drizzle-orm'

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  addresses: many(customerAddresses),
  orders: many(orders),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [orders.organizationId],
    references: [organizations.id],
  }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}))
```

### 7.6 Migration Command

```bash
# Setelah update schema, generate migration:
cd packages/shared
pnpm drizzle-kit generate

# Review file migration yang dibuat di drizzle/migrations/
# Pastikan tidak ada DROP TABLE yang tidak diinginkan

# Apply ke database:
pnpm drizzle-kit push
# ATAU untuk production gunakan migrate() di aplikasi
```

### 7.7 Trigger / Counter Update Pattern

```typescript
// Setiap kali order status berubah ke 'completed',
// UPDATE customers.total_spent dan total_orders
// Ini dilakukan di service layer (bukan trigger DB) untuk portabilitas

// apps/api/src/services/order.service.ts
export async function completeOrder(orderId: string, db: DrizzleDB) {
  // 1. Update order status
  const [order] = await db
    .update(orders)
    .set({ 
      status: 'completed', 
      completedAt: new Date() 
    })
    .where(eq(orders.id, orderId))
    .returning()
  
  // 2. Update customer counters jika ada customerId
  if (order.customerId) {
    await db
      .update(customers)
      .set({
        totalOrders: sql`${customers.totalOrders} + 1`,
        totalSpent: sql`${customers.totalSpent} + ${order.totalAmount}`,
        lastOrderAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, order.customerId))
  }
  
  return order
}
```

---

## 8. Frontend Architecture

### 8.1 Struktur Folder yang Diharapkan

```
apps/app/
├── src/
│   ├── app/
│   │   ├── (dashboard)/           ← Route group (tidak muncul di URL)
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx       ← Server Component (initial fetch)
│   │   │   │   └── _components/   ← Komponen khusus dashboard
│   │   │   │       ├── KPICards.tsx
│   │   │   │       ├── RevenueChart.tsx
│   │   │   │       ├── BranchRevenueChart.tsx
│   │   │   │       ├── RecentOrders.tsx
│   │   │   │       └── AlertsPanel.tsx
│   │   │   │
│   │   │   ├── crm/               ← CRM module
│   │   │   │   ├── page.tsx       ← List pelanggan
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx   ← Detail pelanggan
│   │   │   │   └── _components/
│   │   │   │       ├── CustomerTable.tsx
│   │   │   │       ├── CustomerForm.tsx
│   │   │   │       └── OrderHistory.tsx
│   │   │   │
│   │   │   └── layout.tsx         ← Shared layout (sidebar + header)
│   │   │
│   ├── lib/
│   │   ├── api/                   ← API client functions
│   │   │   ├── dashboard.ts       ← fetchDashboardSummary(), dll
│   │   │   └── customers.ts       ← fetchCustomers(), createCustomer(), dll
│   │   │
│   │   ├── mock/
│   │   │   ├── dashboard.ts       ← Mock data untuk development
│   │   │   └── customers.ts       ← Mock data customers
│   │   │
│   │   └── query-keys.ts          ← Centralized TanStack Query keys
│   │
│   └── components/
│       └── ui/                    ← shadcn/ui components (sudah ada)
```

### 8.2 Pattern: Server Component + Client Component

```typescript
// apps/app/src/app/(dashboard)/dashboard/page.tsx
// Server Component: initial data fetch, tidak ada useState/useEffect

import { DashboardClient } from './_components/DashboardClient'
import { fetchDashboardSummary } from '@/lib/api/dashboard'
import { getServerSession } from '@/lib/auth' // Better Auth server helper

export default async function DashboardPage() {
  const session = await getServerSession()
  
  // Initial fetch di server (lebih cepat, tidak ada loading flash)
  const initialData = await fetchDashboardSummary(session.organizationId)
  
  // Pass ke Client Component untuk polling selanjutnya
  return <DashboardClient initialData={initialData} />
}
```

```typescript
// apps/app/src/app/(dashboard)/dashboard/_components/DashboardClient.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchDashboardSummary } from '@/lib/api/dashboard'
import { useOrganizationStore } from '@/lib/stores/organization'

export function DashboardClient({ initialData }) {
  const { organizationId } = useOrganizationStore()
  
  const { data } = useQuery({
    queryKey: ['dashboard', 'summary', organizationId],
    queryFn: () => fetchDashboardSummary(organizationId),
    initialData,               // Gunakan data dari server sebagai initial
    refetchInterval: 30_000,   // Polling setiap 30 detik
    staleTime: 25_000,         // Anggap data stale setelah 25 detik
  })
  
  return (
    <div className="space-y-6">
      <KPICards data={data} />
      <div className="grid grid-cols-3 gap-6">
        <RevenueChart className="col-span-2" orgId={organizationId} />
        <BranchRevenueChart orgId={organizationId} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <RecentOrders orgId={organizationId} />
        <AlertsPanel data={data?.alerts} />
      </div>
    </div>
  )
}
```

### 8.3 Query Keys Convention

```typescript
// apps/app/src/lib/query-keys.ts
// Centralize agar tidak typo dan mudah invalidate

export const queryKeys = {
  dashboard: {
    summary: (orgId: string) => ['dashboard', 'summary', orgId],
    revenueTrend: (orgId: string, period: string) => ['dashboard', 'revenue-trend', orgId, period],
    revenueByBranch: (orgId: string) => ['dashboard', 'revenue-by-branch', orgId],
    topProducts: (orgId: string) => ['dashboard', 'top-products', orgId],
  },
  customers: {
    list: (orgId: string, params: object) => ['customers', orgId, params],
    detail: (orgId: string, id: string) => ['customers', orgId, id],
  },
  orders: {
    list: (orgId: string, params: object) => ['orders', orgId, params],
    detail: (orgId: string, id: string) => ['orders', orgId, id],
  },
} as const
```

### 8.4 API Client Functions

```typescript
// apps/app/src/lib/api/dashboard.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL // URL ke apps/api

export async function fetchDashboardSummary(orgId: string) {
  const res = await fetch(`${API_BASE}/api/dashboard/summary`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`, // Helper untuk ambil token
      'X-Organization-Id': orgId,
    },
    next: { revalidate: 30 }, // Next.js cache: revalidate setiap 30 detik
  })
  
  if (!res.ok) throw new Error('Failed to fetch dashboard summary')
  return res.json()
}

export async function fetchRevenueTrend(orgId: string, period: '7d' | '30d' | '3m') {
  const res = await fetch(
    `${API_BASE}/api/dashboard/revenue-trend?period=${period}`,
    { headers: getAuthHeaders(orgId) }
  )
  return res.json()
}
```

---

## 9. Data Flow & Korelasi Antar Modul

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW DIAGRAM                           │
│                                                                     │
│  POS (Kasir Input Pesanan)                                         │
│       │                                                             │
│       ├──→ orders table (INSERT)                                   │
│       │         │                                                   │
│       │         ├──→ order_items table (INSERT)                    │
│       │         │                                                   │
│       │         └──→ customers table (UPDATE total_spent, count)   │
│       │                   │                                         │
│       │                   └──→ Dashboard Widget "Pelanggan Baru"   │
│       │                                                             │
│       ├──→ inventory_items table (UPDATE qty - sold)               │
│       │         │                                                   │
│       │         └──→ Dashboard Widget "Low Stock Alert"            │
│       │                                                             │
│       └──→ Dashboard Widget "Omzet Hari Ini" (sum orders.total)   │
│                                                                     │
│  CRM (Owner Buka /crm)                                             │
│       │                                                             │
│       └──→ GET /api/customers → customers table                    │
│                   │                                                 │
│                   └──→ GET /api/customers/:id                      │
│                               │                                     │
│                               └──→ orders table (riwayat)          │
│                                                                     │
│  Branches                                                           │
│       │                                                             │
│       └──→ branches table → Dashboard Widget "Revenue per Cabang" │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.1 Korelasi Lengkap Antar Tabel

| Sumber Event | Tabel yang Diupdate | Widget Dashboard yang Terpengaruh |
|---|---|---|
| Order completed | orders ✅, customers.total_spent ✅ | Omzet Hari Ini, Pelanggan |
| Customer baru | customers ✅ | Pelanggan Baru |
| Stock berkurang | inventory_items ✅ | Low Stock Alert |
| Branch ditambah | branches ✅ | Cabang Aktif |
| Order pending lama | orders (query) | Perlu Perhatian panel |

---

## 10. Revised Sidebar & Navigation

### 10.1 Config-Driven Sidebar Structure

```typescript
// apps/app/src/lib/config/sidebar.ts
// Sidebar harus config-driven agar bisa difilter by role dan business type

export type SidebarItem = {
  label: string
  href: string
  icon: string        // Nama icon dari lucide-react
  badge?: string      // Untuk notifikasi count
  requiredPermission?: string  // RBAC: sembunyikan jika tidak punya permission
  businessTypes?: ('fnb' | 'retail' | 'laundry' | 'salon')[] // Filter by bisnis
}

export type SidebarSection = {
  title: string
  items: SidebarItem[]
}

export const sidebarConfig: SidebarSection[] = [
  {
    title: 'MENU DASAR',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        requiredPermission: 'dashboard:view',
      },
      {
        label: 'Laporan',
        href: '/reports',
        icon: 'BarChart3',
        requiredPermission: 'reports:view',
      },
    ],
  },
  {
    title: 'OPERASIONAL',
    items: [
      {
        label: 'Pesanan',
        href: '/orders',
        icon: 'ShoppingBag',
        badge: 'pending_count', // Dynamic badge dari store
        requiredPermission: 'pos:read',
      },
      {
        label: 'POS',
        href: '/pos',
        icon: 'Monitor',
        requiredPermission: 'pos:create',
      },
      {
        label: 'Pickup & Delivery',
        href: '/fulfillment',
        icon: 'Truck',
        requiredPermission: 'delivery:read',
      },
    ],
  },
  {
    title: 'BISNIS',
    items: [
      {
        label: 'Pelanggan',     // ← CRM
        href: '/crm',
        icon: 'Users',
        requiredPermission: 'customers:read',
      },
      {
        label: 'Inventori',
        href: '/inventory',
        icon: 'Package',
        requiredPermission: 'inventory:read',
      },
    ],
  },
  {
    title: 'PENGATURAN',
    items: [
      {
        label: 'Tim & Akses',
        href: '/settings/team',
        icon: 'UserCog',
        requiredPermission: 'users:read',
      },
      {
        label: 'Cabang',
        href: '/settings/branches',
        icon: 'Store',
        requiredPermission: 'branches:read',
      },
      {
        label: 'Pengaturan',
        href: '/settings',
        icon: 'Settings',
        requiredPermission: 'settings:org:read',
      },
    ],
  },
]
```

### 10.2 Sidebar Component Pattern

```typescript
// apps/app/src/components/layout/Sidebar.tsx
'use client'

import { usePermissions } from '@/lib/hooks/usePermissions'
import { sidebarConfig } from '@/lib/config/sidebar'
import { usePendingOrdersCount } from '@/lib/hooks/useOrders'

export function Sidebar() {
  const { hasPermission } = usePermissions()
  const pendingCount = usePendingOrdersCount() // Polling count untuk badge
  
  const filteredConfig = sidebarConfig.map(section => ({
    ...section,
    items: section.items.filter(item => 
      !item.requiredPermission || hasPermission(item.requiredPermission)
    )
  })).filter(section => section.items.length > 0)
  
  return (
    <aside className="w-[200px] border-r">
      {filteredConfig.map(section => (
        <SidebarSection 
          key={section.title} 
          section={section}
          pendingCount={pendingCount}
        />
      ))}
    </aside>
  )
}
```

---

## 11. Implementation Checklist (Urutan Eksekusi)

> **Prinsip:** UI-first dengan mock data → sambungkan ke API → API ke DB.  
> Jangan blokir frontend karena backend belum selesai.

### Phase 1 — Audit & Setup (Lakukan PERTAMA)

```
□ Step 1: Jalankan prompt audit codebase (Section 1 dokumen ini)
□ Step 2: Dokumentasikan tabel yang sudah ada di DB
□ Step 3: Dokumentasikan API endpoint yang sudah ada
□ Step 4: Dokumentasikan komponen dashboard yang sudah ada
□ Step 5: Identifikasi file mana yang akan dimodifikasi vs dibuat baru
```

### Phase 2 — Database Schema

```
□ Step 6: Cek apakah customers table sudah ada
  → Jika belum: buat schema di packages/shared/src/schema/customers.ts
□ Step 7: Cek apakah orders table sudah ada dengan kolom yang diperlukan
  → Jika belum lengkap: tambah kolom via migration (jangan drop)
□ Step 8: Buat customer_addresses table
□ Step 9: Update relations.ts untuk tambah relasi baru
□ Step 10: Generate & apply migration (drizzle-kit generate → push)
□ Step 11: Seed mock data untuk development (5-10 customers, 20 orders)
```

### Phase 3 — Backend API

```
□ Step 12: Buat auth middleware untuk Hono (jika belum ada)
□ Step 13: Buat endpoint GET /api/dashboard/summary
□ Step 14: Buat endpoint GET /api/dashboard/revenue-trend
□ Step 15: Buat endpoint GET /api/dashboard/revenue-by-branch
□ Step 16: Buat endpoint GET /api/customers (list + pagination + search)
□ Step 17: Buat endpoint POST /api/customers
□ Step 18: Buat endpoint GET /api/customers/:id
□ Step 19: Buat endpoint PATCH /api/customers/:id
□ Step 20: Buat endpoint POST /api/customers/lookup
□ Step 21: Test semua endpoint dengan Hoppscotch/Postman
```

### Phase 4 — Frontend Dashboard

```
□ Step 22: Update KPI cards (ganti Active Sessions & Security Alerts)
□ Step 23: Sambungkan KPI cards ke GET /api/dashboard/summary
□ Step 24: Tambah polling 30 detik untuk KPI cards
□ Step 25: Sambungkan Tren Revenue chart ke GET /api/dashboard/revenue-trend
□ Step 26: Sambungkan Revenue per Cabang ke GET /api/dashboard/revenue-by-branch
□ Step 27: Buat komponen RecentOrders (list 5 terbaru)
□ Step 28: Buat komponen AlertsPanel (low stock + pending orders)
□ Step 29: Update "Operasional" panel dengan data cabang aktif
□ Step 30: Pastikan semua empty state dan loading state sudah benar
```

### Phase 5 — Frontend CRM

```
□ Step 31: Buat halaman /crm dengan CustomerTable component
□ Step 32: Implementasi search dan filter
□ Step 33: Buat form modal "Tambah Pelanggan"
□ Step 34: Sambungkan ke GET /api/customers
□ Step 35: Sambungkan form ke POST /api/customers
□ Step 36: Buat halaman /crm/[id] (detail pelanggan)
□ Step 37: Tampilkan riwayat pesanan di detail pelanggan
□ Step 38: Tambah menu "Pelanggan" di sidebar (jika belum ada)
```

### Phase 6 — Koneksi CRM ↔ Dashboard

```
□ Step 39: Pastikan widget "Pelanggan Baru" di dashboard terkoneksi ke customers table
□ Step 40: Pastikan setelah tambah pelanggan, dashboard auto-refresh
  (Gunakan queryClient.invalidateQueries(['dashboard', 'summary', orgId]))
□ Step 41: Test end-to-end flow: buat pelanggan → lihat di dashboard
```

### Phase 7 — Testing & Polish

```
□ Step 42: Test di mobile viewport (responsive)
□ Step 43: Test empty state (baru daftar, belum ada data)
□ Step 44: Test error state (API down, koneksi lambat)
□ Step 45: Test dengan 2 organisasi berbeda (pastikan data terisolasi)
□ Step 46: Test RBAC: kasir tidak bisa akses CRM jika tidak punya permission
□ Step 47: Performance check: dashboard harus load < 2 detik
```

---

## 12. Definisi "Done" untuk MVP

### Dashboard ✅ Done jika:

1. **KPI Cards** menampilkan data real dari database (bukan hardcoded/mock)
2. **Tren Revenue** chart bisa toggle 7D/30D/3M dan data berubah
3. **Revenue per Cabang** menampilkan data per cabang yang ada
4. **Pesanan Terbaru** menampilkan 5 transaksi terakhir
5. **Alerts Panel** menampilkan low stock dan pesanan pending jika ada
6. **Loading state** tampil saat data sedang dimuat (skeleton)
7. **Empty state** tampil dengan pesan informatif saat data kosong
8. **Auto-refresh** setiap 30 detik tanpa reload halaman
9. **Data terisolasi** per organisasi (org A tidak bisa lihat data org B)

### CRM ✅ Done jika:

1. Halaman `/crm` menampilkan list pelanggan dengan search dan filter
2. Bisa **tambah pelanggan** baru dari form modal
3. Bisa **lihat detail** pelanggan termasuk riwayat pesanan
4. Bisa **edit** nama, telepon, email pelanggan
5. Widget "Pelanggan Baru" di dashboard terkoneksi ke data CRM
6. Dari POS, bisa **lookup pelanggan** by nomor telepon
7. **RBAC**: hanya user dengan permission `customers:read` yang bisa akses

### Tidak Masuk MVP (Defer ke Phase 2):

- ❌ Import CSV pelanggan
- ❌ Export data pelanggan
- ❌ Segmentasi pelanggan (RFM)
- ❌ Loyalty points/tier
- ❌ Kampanye email/WhatsApp
- ❌ Customer self-ordering (QR code) → sudah ada spec tersendiri
- ❌ Top 5 produk terlaris di dashboard (P2)
- ❌ Grafik per jam di dashboard (P2)

---

## Appendix A — Prompt untuk AI Coding Agent

### Prompt: Buat Dashboard Summary Endpoint

```
Baca terlebih dahulu:
1. File schema di packages/shared/src/schema/ — list semua tabel
2. File route yang sudah ada di apps/api/src/routes/
3. Pattern auth middleware yang sudah ada

Kemudian buat endpoint GET /api/dashboard/summary di apps/api dengan:
- Hono.js framework
- drizzle-orm/neon-http (BUKAN WebSocket)
- Filter by organizationId dari auth context (BUKAN dari query param)
- Semua query dijalankan paralel dengan Promise.all
- Return: { revenue, orders, customers, branches, alerts } sesuai kontrak API di dokumen

Aturan:
- JANGAN hapus atau modifikasi endpoint yang sudah ada
- JANGAN mengubah schema yang sudah ada
- Gunakan TypeScript strict, tidak ada 'any'
- Tambahkan komentar untuk query yang kompleks

Verifikasi: Setelah selesai, tunjukkan curl command untuk test endpoint ini.
```

### Prompt: Buat CRM List Page

```
Baca terlebih dahulu:
1. Halaman dashboard yang sudah ada sebagai referensi pattern
2. Komponen Table yang sudah dipakai (shadcn/ui DataTable atau custom?)
3. Cara TanStack Query dipakai di halaman lain
4. File query-keys.ts jika ada

Kemudian buat halaman /crm (apps/app/src/app/(dashboard)/crm/page.tsx) dengan:
- Server Component untuk initial fetch
- Client Component untuk interaksi (search, filter, pagination)
- CustomerTable komponen dengan kolom: Nama, Telepon, Total Pembelian, Pesanan, Terakhir Beli, Aksi
- Search by nama/telepon (debounce 300ms)
- Filter: Semua | Aktif | Pelanggan Baru (7 hari)
- Pagination: 20 per halaman
- Tombol "+ Tambah Pelanggan" yang buka modal form
- Loading state: skeleton
- Empty state: ilustrasi + teks informatif

Aturan:
- Gunakan komponen shadcn/ui yang sudah ada di codebase (cek dulu)
- Ikuti pattern yang sudah ada di halaman lain
- JANGAN install library baru tanpa konfirmasi
- Semua teks UI dalam Bahasa Indonesia
```

---

*Dokumen ini adalah living document. Update setiap kali ada perubahan signifikan pada implementasi.*

**Last Updated:** March 22, 2026  
**Maintainer:** Riyan  
**Next Review:** Setelah Phase 4 selesai
