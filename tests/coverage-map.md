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
| AC-12-OK | Idempotensi outbox insert per `(domainEventId, channel)` diverifikasi lewat conflict guard `onConflictDoNothing` | `apps/backend/src/routes/dashboard/laundry.test.ts` | OK Covered |

## Success Index
- Total skenario PRD: 12
- Ter-cover: 12
- Success Index: 100.00%

## Gap yang Masih Perlu Ditutup
- (None)

---

# Test Coverage Map - API Request & Server Action Audit (2026-04-25)

| ID Skenario | Deskripsi | Target | Status |
|---|---|---|---|
| AC-API-01-OK | Backend API test suite (`vitest`) berjalan end-to-end | `apps/backend/src/**/*.test.ts` | OK Executed |
| AC-API-02-OK | Semua backend API tests harus pass | `apps/backend/src/**/*.test.ts` | OK Covered (241 passed / 241 total) |
| AC-API-03-OK | Tidak ada unhandled runtime error saat API tests | `apps/backend/src/**/*.test.ts` | OK Covered |
| AC-API-04-OK | Next API route web dapat di-typecheck | `apps/web/app/api/health/route.ts` | OK Covered |
| AC-API-05-OK | Next API route auth web dapat di-typecheck | `apps/web/app/api/auth/[...all]/route.ts` | OK Covered |
| AC-API-06-OK | Next API route auth app lolos typecheck | `apps/app/app/api/auth/[...all]/route.ts` | OK Covered |
| AC-SA-01-OK | Server Action web lolos typecheck | `apps/web/app/(auth)/actions.ts` | OK Covered |
| AC-SA-02-OK | Server Action order lolos typecheck | `apps/order/app/order/_actions.ts` | OK Covered |
| AC-SA-03-OK | Seluruh Server Action app lolos typecheck | `apps/app/app/**/_actions*.ts` | OK Covered |
| AC-SA-04-ERR | Ada unit tests khusus untuk Server Action | `apps/app`, `apps/web`, `apps/order` | ERR Not Covered (belum ada test files) |

## Success Index
- Total skenario PRD: 10
- Ter-cover: 9
- Success Index: 90.00%

## Gap Prioritas
- Tambahkan unit tests khusus Server Actions (saat ini belum ada) untuk `apps/app`, `apps/web`, dan `apps/order`.

---

# Test Coverage Map - Web Email (Resend) (2026-05-07)

| ID Skenario | Deskripsi | Target | Status |
|---|---|---|---|
| AC-EMAIL-01-OK | `sendAccountCreatedSuccessEmail` mengirim ke `to: ["rydhlnst@gmail.com"]` + return `{ success: true, id }` | `apps/web/lib/email/resend.test.ts` | OK Covered |
| AC-EMAIL-02-OK | `sendWishlistSuccessEmail` mengirim ke `to: ["rydhlnst@gmail.com"]` + subject tepat | `apps/web/lib/email/resend.test.ts` | OK Covered |
| AC-EMAIL-03-ERR | `RESEND_API_KEY` kosong -> return error `"RESEND_API_KEY belum di-set"` | `apps/web/lib/email/resend.test.ts` | ERR Covered |
| AC-EMAIL-04-ERR | Resend API balikin `error.message` -> di-surface ke caller | `apps/web/lib/email/resend.test.ts` | ERR Covered |
| AC-EMAIL-05-ERR | Template render throw -> return error message + tidak call Resend | `apps/web/lib/email/resend.test.ts` | ERR Covered |

## Success Index
- Total skenario PRD: 5
- Ter-cover: 5
- Success Index: 100.00%
