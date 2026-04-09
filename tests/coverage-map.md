# Test Coverage Map - Laundry Workflow Hardening v1.1

| ID Skenario | Deskripsi | Target | Status |
|---|---|---|---|
| AC-01-OK | Legacy endpoint pickup mengembalikan `410` + replacement metadata | `apps/backend/src/routes/dashboard/pickup.test.ts` | OK Covered |
| AC-02-OK | Header deprecation (`X-Deprecated`, `Sunset`) tersedia | `apps/backend/src/routes/dashboard/pickup.test.ts` | OK Covered |
| AC-03-OK | Rollback guard via feature flag (`ENABLE_LEGACY_PICKUP_ROUTES=true`) masih bisa aktifkan legacy | `apps/backend/src/routes/dashboard/pickup.test.ts` | OK Covered |
| AC-04-ERR | Create order `pickup/drop_off` tanpa phone/address ditolak `400` | `apps/backend/src/routes/dashboard/laundry.test.ts` | ERR Covered |
| AC-05-ERR | `customerId` tanpa fallback phone/address ditolak `400` | `apps/backend/src/routes/dashboard/laundry.test.ts` | ERR Covered |
| AC-06-OK | Assign driver hanya via `driverId`, backend derive `driverName` dari user profile | `apps/backend/src/routes/dashboard/laundry.test.ts` | OK Covered |
| AC-07-ERR | Assign driver dengan `driverId` invalid/non-driver ditolak `400/403` | `apps/backend/src/routes/dashboard/laundry.test.ts` | ERR Covered |
| AC-08-OK | Status transition ke `ready_for_pickup|out_for_delivery|completed` membuat outbox row queued | `apps/backend/src/routes/dashboard/laundry.test.ts` | OK Covered |
| AC-09-OK | Lifecycle regression dasar (`invalid transition` ditolak, `valid transition` diterima) | `apps/backend/src/routes/dashboard/laundry.test.ts` | OK Covered |
| AC-10-OK | Branch unauthorized tetap `403` (guardrail akses branch) | `apps/backend/src/routes/dashboard/laundry.test.ts` | OK Covered |
| AC-11-OK | Metrics endpoint menampilkan deprecated hits / reject rate / outbox queued-failed | `apps/backend/src/routes/dashboard/laundry.test.ts` | OK Covered |
| AC-12-ERR | Idempotensi outbox insert per `(domainEventId, channel)` diverifikasi behavior level API | `apps/backend/src/routes/dashboard/laundry.test.ts` | ERR Not Covered |

## Success Index
- Total skenario PRD: 12
- Ter-cover: 11
- Success Index: 91.67%

## Gap yang Masih Perlu Ditutup
- AC-12: Tambah test integrasi lebih dalam (DB-level assertion untuk `onConflictDoNothing`) agar idempotensi outbox tervalidasi penuh, bukan hanya jalur happy path API.
