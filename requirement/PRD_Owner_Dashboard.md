# PRD: Owner HQ Dashboard — Beres.io

**Surface:** `app.beres.io/dashboard`  
**Role:** OWNER (primary), ADMIN (read-only beberapa section)  
**Status:** NOT STARTED  
**Priority:** P0 — MVP Critical  
**Last Updated:** March 2026

---

## Overview

Owner tidak bisa memantau bisnis secara real-time tanpa menelepon tiap cabang. Dashboard ini adalah "command center" Owner — satu layar yang menunjukkan kondisi operasional, performa bisnis, siapa yang punya akses apa, dan status langganan Beres.

---

## Phase Breakdown

| Phase | Scope | Tujuan |
|-------|-------|--------|
| **Phase 1 — Schema & API** | Hono endpoints, DB queries | Data layer siap |
| **Phase 2 — Frontend Shell** | Layout, navigasi, static UI | Tampilan kebayang, no real data |
| **Phase 3 — Data Integration** | Hubungkan API ke UI | Semua widget live |
| **Phase 4 — Real-time Layer** | SSE activity feed, polling | Live updates |

> Dokumen ini fokus pada **Phase 2: Frontend Shell**.

---

## Phase 2 — Frontend Shell

### Tujuan

Bangun tampilan dashboard lengkap dengan **mock/static data** terlebih dahulu. Semua layout, komponen, state kosong, skeleton, dan responsivitas selesai di phase ini — sebelum menyentuh API.

**Definisi "done" Phase 2:**
- Semua section/widget ter-render dengan data statis
- Layout responsif (desktop + tablet)
- Loading skeleton untuk setiap widget
- Empty state untuk setiap widget
- Navigasi antar section berfungsi
- RBAC guard (halaman redirect kalau bukan OWNER/ADMIN)

---

### 2.1 Layout Shell

**Route:** `app/(dashboard)/page.tsx`

```
┌─────────────────────────────────────────────────────┐
│  [Logo Beres]    [Org Selector ▼]        [User Menu] │  ← Topbar
├──────────┬──────────────────────────────────────────┤
│          │  [KPI Strip — 5 cards]                   │
│  Sidebar │  ──────────────────────────────────────  │
│          │  [Revenue Chart]  [Orders Chart]         │
│  - Home  │  ──────────────────────────────────────  │
│  - ...   │  [RBAC Overview]  [Billing Panel]        │
│          │  ──────────────────────────────────────  │
│          │  [Activity Feed]                         │
└──────────┴──────────────────────────────────────────┘
```

**Komponen yang perlu dibuat:**
- `DashboardLayout` — wrapper dengan sidebar + topbar
- `OrgSelector` — dropdown pilih organisasi (kalau user punya >1 org)
- `DashboardPage` — grid layout semua sections

**Tech notes:**
- Gunakan CSS Grid (`grid-cols-12`) untuk layout 2-kolom
- Sidebar menggunakan shadcn `Sheet` untuk mobile (collapsible)
- Topbar sticky dengan `z-50`

---

### 2.2 KPI Strip

**Posisi:** Top of content area, full-width  
**Layout:** 5 cards horizontal, scroll horizontal di mobile

| Card | Icon | Value (mock) | Delta Badge |
|------|------|-------------|-------------|
| Revenue Hari Ini | `DollarSign` | Rp 2.450.000 | ↑12% vs kemarin |
| Order Aktif | `Package` | 14 | ↑3 vs kemarin |
| Siap Pickup | `CheckCircle` | 6 | — |
| Staff Online | `Users` | 8 | — |
| Low Stock Alert | `AlertTriangle` | 3 items | merah kalau >0 |

**Komponen:** `KPICard`
```tsx
// Props
interface KPICardProps {
  label: string
  value: string | number
  icon: LucideIcon
  delta?: { value: number; isPositive: boolean }
  variant?: 'default' | 'warning' | 'danger'
  isLoading?: boolean
}
```

**States yang harus dibuat:**
- Normal (dengan data)
- Loading (skeleton `w-24 h-6 animate-pulse`)
- Warning/Danger (border merah untuk Low Stock)

---

### 2.3 Business Performance Section

**Layout:** 2 kolom di desktop, 1 kolom di mobile

#### Chart 1 — Revenue Trend (kiri, 60% lebar)
- Library: **Recharts** `<LineChart>`
- X-axis: tanggal (7 hari terakhir)
- Y-axis: Rupiah (formatted: `Rp 2.4jt`)
- Toggle time range: `7D | 30D | 3M` — `<SegmentedControl>` di atas chart
- Mock data: array 7 titik angka random

#### Chart 2 — Revenue per Cabang (kanan, 40% lebar)
- Library: Recharts `<BarChart>` horizontal
- Y-axis: nama cabang
- X-axis: revenue
- Mock: 3 cabang dengan nilai berbeda

**Komponen:**
- `RevenueTrendChart` — wraps Recharts + time range selector
- `RevenueBranchChart` — wraps Recharts horizontal bar
- `ChartCard` — wrapper card dengan title + optional actions slot

**Empty state:** Ilustrasi kecil + teks "Belum ada transaksi di periode ini"

---

### 2.4 RBAC Overview Panel

**Posisi:** Kiri bawah (col-span-6 di desktop)

**Layout dalam card:**
```
┌─────────────────────────────────┐
│ 👥 Akses & Tim          [Kelola →]
├─────────────────────────────────┤
│ Role chips:                     │
│  [Owner 1] [Admin 2] [Kasir 5]  │
│  [Staff 8] [Driver 3]           │
├─────────────────────────────────┤
│ ⚠️  2 undangan pending          │
│ 🔴 Cabang "Medan" tanpa Manager │
├─────────────────────────────────┤
│ Aktivitas terbaru:              │
│ • Admin menambah Kasir baru 2j  │
│ • Role "Supervisor" dibuat 1h   │
└─────────────────────────────────┘
```

**Komponen:**
- `RBACOverviewCard`
- `RoleChip` — badge kecil dengan nama role + jumlah user
- `CoverageGapAlert` — alert merah kalau ada cabang tanpa role kritis

**"Kelola →"** link ke `/settings/access` (navigasi saja, tidak perlu dibangun di phase ini)

**Empty state:** "Belum ada anggota tim. Undang yang pertama →"

---

### 2.5 Billing & Subscription Panel

**Posisi:** Kanan bawah (col-span-6 di desktop)

**Layout dalam card:**
```
┌─────────────────────────────────┐
│ 💼 Langganan                    │
├─────────────────────────────────┤
│ Professional Plan  ✅ Aktif     │
│ Rp 799.000 / bulan              │
│ Tagihan berikutnya: 28 Apr 2026 │
├─────────────────────────────────┤
│ Penggunaan:                     │
│ Cabang  ██████░░  3/5           │
│ Users   ████████  12/20         │
├─────────────────────────────────┤
│ Invoice terakhir:               │
│ Mar 2026  Rp 799.000  [Unduh]   │
│ Feb 2026  Rp 799.000  [Unduh]   │
├─────────────────────────────────┤
│ [Lihat Semua Invoice]           │
└─────────────────────────────────┘
```

**Komponen:**
- `BillingPanelCard`
- `UsageBar` — progress bar dengan label `used/max`
- `InvoiceRow` — baris invoice dengan tombol download (disabled di phase ini)

**Upgrade nudge:** Muncul kalau usage bar ≥80% — banner kuning soft di atas card:
> "Hampir penuh! Cabang kamu 4/5. Upgrade untuk tumbuh lebih jauh."

---

### 2.6 Activity Feed

**Posisi:** Full-width di bawah semua card

**Layout:** Feed list, max-height dengan scroll, terbaru di atas

```
┌─────────────────────────────────────────────────────┐
│ 📡 Aktivitas Real-time       [Filter: Semua ▼]      │
├─────────────────────────────────────────────────────┤
│ 🟢 Order #LDR-0421 selesai — Cabang Medan    2 menit│
│ 👤 Budi (Kasir) login — Cabang Bandung      5 menit │
│ 📦 Stok "Pewangi Lavender" habis — Medan   12 menit │
│ 🟡 Order #LDR-0418 terlambat pickup        18 menit │
└─────────────────────────────────────────────────────┘
```

**Komponen:**
- `ActivityFeedCard` — wrapper dengan filter dropdown
- `ActivityItem` — satu baris event dengan icon, deskripsi, timestamp, badge cabang

**Filter options (UI only, belum functional):** Semua / Order / Staff / Alert

**Mock data:** 10 item statis dengan tipe bervariasi

**Empty state:** "Belum ada aktivitas hari ini"

---

### 2.7 Shared Components Checklist

Komponen ini dipakai di banyak tempat, buat dulu sebelum section-specific:

| Komponen | Dipakai di |
|----------|-----------|
| `SectionCard` | Semua card section |
| `StatSkeleton` | Loading state semua widget |
| `EmptyState` | Semua widget saat tidak ada data |
| `DeltaBadge` | KPI cards |
| `UsageBar` | Billing panel |
| `TimeRangeSelector` | Revenue chart |

---

### 2.8 File Structure

```
apps/app/
├── app/
│   └── (dashboard)/
│       ├── layout.tsx          ← DashboardLayout
│       └── page.tsx            ← DashboardPage (grid)
└── components/
    └── dashboard/
        ├── kpi-strip/
        │   ├── kpi-strip.tsx
        │   └── kpi-card.tsx
        ├── performance/
        │   ├── revenue-trend-chart.tsx
        │   └── revenue-branch-chart.tsx
        ├── rbac-overview/
        │   ├── rbac-overview-card.tsx
        │   └── role-chip.tsx
        ├── billing/
        │   ├── billing-panel-card.tsx
        │   └── usage-bar.tsx
        ├── activity-feed/
        │   ├── activity-feed-card.tsx
        │   └── activity-item.tsx
        └── shared/
            ├── section-card.tsx
            ├── stat-skeleton.tsx
            ├── empty-state.tsx
            ├── delta-badge.tsx
            └── time-range-selector.tsx
```

---

### 2.9 Mock Data File

Buat satu file mock data terpusat untuk semua widget:

```
apps/app/lib/mock/dashboard.ts
```

Isi: semua static data untuk KPI, chart, RBAC, billing, activity feed. Ini yang nanti diganti dengan API call di Phase 3.

---

### 2.10 RBAC Guard

Di `layout.tsx`, tambahkan guard:

```tsx
// Pseudo-code
const session = await auth.getSession()
if (!session || !['OWNER', 'ADMIN'].includes(session.user.role)) {
  redirect('/unauthorized')
}
```

> **Note:** Better Auth Organization Plugin sudah handle ini. Tinggal tambahkan middleware check.

---

## Out of Scope — Phase 2

| Item | Kapan |
|------|-------|
| API calls / real data | Phase 3 |
| SSE live updates | Phase 4 |
| Export/download invoice | Post-MVP |
| Mobile responsive detail | Phase 3 (fine-tune) |
| Dark mode | Post-MVP |

---

## Definition of Done — Phase 2

- [ ] DashboardLayout render di `/dashboard`
- [ ] Semua 5 KPI cards render dengan mock data + delta badge
- [ ] Revenue Trend Chart render + time range toggle berfungsi (hanya ganti mock data)
- [ ] Revenue per Cabang Chart render
- [ ] RBAC Overview Card render dengan role chips + gap alert
- [ ] Billing Panel render dengan usage bars
- [ ] Activity Feed render dengan 10 item mock
- [ ] Semua widget punya loading skeleton
- [ ] Semua widget punya empty state
- [ ] Responsif di 1280px dan 768px
- [ ] RBAC guard aktif (redirect kalau bukan OWNER/ADMIN)
