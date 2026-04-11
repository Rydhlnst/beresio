# Test Coverage Map - Dashboard Route Modules (Gap Closure)

| ID Skenario | Modul | Endpoint/Behavior | Test File | Status |
|---|---|---|---|---|
| AC-ACT-01 | activities | GET list + pagination metadata | `src/routes/dashboard/activities.test.ts` | OK Covered |
| AC-ACT-02 | activities | GET handles internal error | `src/routes/dashboard/activities.test.ts` | OK Covered |
| AC-BIL-01 | billing | GET status returns plan/usage/payments | `src/routes/dashboard/billing.test.ts` | OK Covered |
| AC-BIL-02 | billing | POST upgrade rejects invalid plan | `src/routes/dashboard/billing.test.ts` | OK Covered |
| AC-CUS-01 | customers | GET list customers | `src/routes/dashboard/customers.test.ts` | OK Covered |
| AC-CUS-02 | customers | POST rejects missing required fields | `src/routes/dashboard/customers.test.ts` | OK Covered |
| AC-CUS-03 | customers | GET detail returns 404 when missing | `src/routes/dashboard/customers.test.ts` | OK Covered |
| AC-ORG-01 | organization | GET returns profile + parsed metadata | `src/routes/dashboard/organization.test.ts` | OK Covered |
| AC-ORG-02 | organization | PATCH returns 404 when org missing | `src/routes/dashboard/organization.test.ts` | OK Covered |
| AC-PERF-01 | performance | GET trend returns mapped revenue points | `src/routes/dashboard/performance.test.ts` | OK Covered |
| AC-PERF-02 | performance | GET branches handles internal error | `src/routes/dashboard/performance.test.ts` | OK Covered |
| AC-PICK-01 | pickup | GET list pickup orders | `src/routes/dashboard/pickup.test.ts` | OK Covered |
| AC-PICK-02 | pickup | PATCH status rejects invalid status | `src/routes/dashboard/pickup.test.ts` | OK Covered |
| AC-REP-01 | reports | GET catalog returns report list | `src/routes/dashboard/reports.test.ts` | OK Covered |
| AC-REP-02 | reports | GET summary rejects invalid date range | `src/routes/dashboard/reports.test.ts` | OK Covered |
| AC-HL-01 | highlights | POST creates highlight | `src/routes/dashboard/highlights.test.ts` | OK Covered |
| AC-HL-02 | highlights | POST rejects missing title | `src/routes/dashboard/highlights.test.ts` | OK Covered |
| AC-SET-01 | settings | PATCH profile updates user profile | `src/routes/dashboard/settings.test.ts` | OK Covered |
| AC-SET-02 | settings | PATCH notifications rejects invalid payload | `src/routes/dashboard/settings.test.ts` | OK Covered |
| AC-SUP-01 | suppliers | GET list with pagination + product count | `src/routes/dashboard/suppliers.test.ts` | OK Covered |
| AC-SUP-02 | suppliers | POST rejects missing supplier name | `src/routes/dashboard/suppliers.test.ts` | OK Covered |
| AC-TRX-01 | transactions | GET list transactions | `src/routes/dashboard/transactions.test.ts` | OK Covered |
| AC-TRX-02 | transactions | POST rejects invalid status | `src/routes/dashboard/transactions.test.ts` | OK Covered |
| AC-CRM-01 | crm | GET customers paginated + tag mapping | `src/routes/dashboard/crm.test.ts` | OK Covered |
| AC-CRM-02 | crm | POST customer rejects invalid payload | `src/routes/dashboard/crm.test.ts` | OK Covered |
| AC-CRM-03 | crm | GET analytics overview returns aggregate metrics | `src/routes/dashboard/crm.test.ts` | OK Covered |
| AC-CRM-04 | crm | DELETE customer returns 404 when missing | `src/routes/dashboard/crm.test.ts` | OK Covered |

## Success Index
- Total skenario: 27
- Ter-cover: 27
- Success Index: 100%

## Catatan
- Map ini mencakup module dashboard yang sebelumnya belum memiliki unit test.
- Test existing yang sudah ada sebelum task ini tetap dipertahankan dan tidak diubah.

---

# Test Coverage Map - Laundry Module

| ID Skenario | Deskripsi | Target | Status |
|---|---|---|---|
| AC-SVC-01 | List layanan laundry per cabang | `dashboard/laundry.ts#/services GET` | OK Covered |
| AC-SVC-02 | Buat layanan laundry baru | `dashboard/laundry.ts#/services POST` | OK Covered |
| AC-SVC-03 | Update layanan yang tidak ada -> 404 | `dashboard/laundry.ts#/services PATCH` | OK Covered |
| AC-ORD-01 | Buat order walk-in + pembayaran awal | `dashboard/laundry.ts#/orders POST` | OK Covered |
| AC-ORD-02 | Pickup tanpa phone/address ditolak | `dashboard/laundry.ts#/orders POST` | OK Covered |
| AC-ORD-03 | customerId tanpa fallback data ditolak | `dashboard/laundry.ts#/orders POST` | OK Covered |
| AC-ORD-04 | List order per cabang | `dashboard/laundry.ts#/orders GET` | OK Covered |
| AC-ORD-05 | Detail order memuat item/payment/timeline | `dashboard/laundry.ts#/orders/:id GET` | OK Covered |
| AC-STS-01 | Update status invalid transition ditolak | `dashboard/laundry.ts#/orders/:id/status PATCH` | OK Covered |
| AC-STS-02 | Update status valid enqueue outbox | `dashboard/laundry.ts#/orders/:id/status PATCH` | OK Covered |
| AC-DRV-01 | Driver tak boleh assign driver lain | `dashboard/laundry.ts#/orders/:id/driver PATCH` | OK Covered |
| AC-DRV-02 | Assign driver derive nama dari user profile | `dashboard/laundry.ts#/orders/:id/driver PATCH` | OK Covered |
| AC-DRV-03 | Assign unknown driver -> 400 | `dashboard/laundry.ts#/orders/:id/driver PATCH` | OK Covered |
| AC-PAY-01 | Catat pembayaran parsial | `dashboard/laundry.ts#/orders/:id/payments POST` | OK Covered |
| AC-PAY-02 | Overpayment ditolak | `dashboard/laundry.ts#/orders/:id/payments POST` | OK Covered |
| AC-PAY-03 | Ambil riwayat pembayaran order | `dashboard/laundry.ts#/orders/:id/payments GET` | OK Covered |
| AC-RCP-01 | Receipt memuat thermal payload + WA text | `dashboard/laundry.ts#/orders/:id/receipt GET` | OK Covered |
| AC-REP-01 | Summary report aggregate values | `dashboard/laundry.ts#/reports/summary GET` | OK Covered |
| AC-REP-02 | Orders by status grouped benar | `dashboard/laundry.ts#/reports/orders-by-status GET` | OK Covered |
| AC-REP-03 | Outstanding payments list | `dashboard/laundry.ts#/reports/outstanding-payments GET` | OK Covered |
| AC-MET-01 | Metrics runtime + outbox count | `dashboard/laundry.ts#/reports/metrics GET` | OK Covered |
| AC-WA-01 | WA template tanpa branchId ditolak | `dashboard/laundry.ts#/settings/wa-template GET` | OK Covered |
| AC-WA-02 | WA template bisa diupdate role valid | `dashboard/laundry.ts#/settings/wa-template PATCH` | OK Covered |
| AC-OUTBOX-01 | Dispatch worker kirim queued -> sent | `internal/laundry-workers.ts#/notifications/dispatch` | OK Covered |
| AC-OUTBOX-02 | Dispatch worker gagal -> dead_letter by max attempts | `internal/laundry-workers.ts#/notifications/dispatch` | OK Covered |
| AC-OUTBOX-03 | Dispatch worker dry-run tanpa provider | `internal/laundry-workers.ts#/notifications/dispatch` | OK Covered |
| AC-OUTBOX-04 | Dispatch worker wajib internal key | `internal/laundry-workers.ts#/notifications/dispatch` | OK Covered |
| AC-SSE-01 | Stream order via SSE | `dashboard/laundry.ts#/stream/orders GET` | OK Covered |

## Success Index (Laundry)
- Total skenario: 28
- Ter-cover: 28
- Success Index: 100%

---

# Test Coverage Map - Multi-Branch Mode Routing + Dashboard Scope

| ID Skenario | Deskripsi | Target | Status |
|---|---|---|---|
| AC-MODE-01 | Organization payload memuat `mode` | `dashboard/organization.ts#/ GET` | OK Covered |
| AC-MODE-02 | Owner bisa upgrade `single -> multi` | `dashboard/organization.ts#/ PATCH` | OK Covered |
| AC-MODE-03 | Non-owner tidak boleh ubah mode | `dashboard/organization.ts#/ PATCH` | OK Covered |
| AC-MODE-04 | Downgrade `multi -> single` ditolak | `dashboard/organization.ts#/ PATCH` | OK Covered |
| AC-MODE-05 | Businesses navigation payload memuat `business.mode` | `routes/businesses.ts#/:id/navigation GET` | OK Covered |
| AC-MODE-06 | Performance trend sukses saat scope branch valid | `dashboard/performance.ts#/trend GET` | OK Covered |
| AC-MODE-07 | Performance trend ditolak saat user tidak punya branch access | `dashboard/performance.ts#/trend GET` | OK Covered |
| AC-MODE-08 | Performance trend ditolak saat meminta branch yang tidak diakses | `dashboard/performance.ts#/trend GET` | OK Covered |
| AC-MODE-09 | KPI endpoint mengembalikan metrik utama sesuai scope | `dashboard/kpis.ts#/ GET` | OK Covered |
| AC-MODE-10 | KPI endpoint menangani error DB dengan aman | `dashboard/kpis.ts#/ GET` | OK Covered |
| AC-MODE-11 | KPI SSE stream emit `kpi` event + heartbeat/retry header | `dashboard/kpis.ts#/stream GET` | ERR Not Covered |
| AC-MODE-12 | Matrix routing app-side (`multi owner`, `multi branch-role`, `single any-role`) | `app/lib/dashboard-routing.server.ts` | ERR Not Covered |

## Success Index (Multi-Branch Mode)
- Total skenario: 12
- Ter-cover: 10
- Success Index: 83.3%
