# Dashboard Analysis - Route & Action Report

## Summary

Berikut analisis lengkap route di `(dashboard)` beserta status action/button yang sudah ada dan yang masih perlu dikembangkan.

---

## 1. DASHBOARD (`/dashboard`)

### Routes Available
| Route | Status | Keterangan |
|-------|--------|------------|
| `/dashboard` | ✅ Ready | Main dashboard page |
| `/dashboard/highlights` | ✅ Ready | Highlight management |
| `/dashboard/highlights/new` | ✅ Ready | Create new highlight |
| `/dashboard/highlights/[id]` | ✅ Ready | Edit highlight |
| `/dashboard/reports` | ✅ Ready | Reports page |

### Actions (Backend)
| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `/api/dashboard/activities` | GET | ✅ | Activity feed |
| `/api/dashboard/kpis` | GET | ✅ | KPI data |
| `/api/dashboard/performance` | GET | ✅ | Performance metrics |
| `/api/dashboard/highlights` | GET/POST | ✅ | List/Create highlights |
| `/api/dashboard/highlights/:id` | PATCH/DELETE | ✅ | Update/Delete highlight |
| `/api/dashboard/reports` | GET | ✅ | Reports data |

### Missing Actions/Buttons
- [ ] **Filter Button** - Filter dashboard by date range
- [ ] **Export Button** - Export dashboard data to PDF/Excel
- [ ] **Refresh Button** - Manual refresh data
- [ ] **Customize Widget Button** - Drag-drop widget customization

---

## 2. ORDER (`/order`)

### Routes Available
| Route | Status | Keterangan |
|-------|--------|------------|
| `/order` | ✅ Ready | Order list page |

### Actions (Frontend `_actions/orders.ts`)
| Action | Status | Keterangan |
|--------|--------|------------|
| `createOrderAction` | ✅ | Create new order |
| `updateOrderAction` | ✅ | Update order status/payment |
| `updateOrderItemsAction` | ✅ | Update order items |

### Actions (Backend)
| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `/api/dashboard/orders` | GET/POST | ✅ | List/Create orders |
| `/api/dashboard/orders/:id` | GET/PATCH | ✅ | Get/Update order |
| `/api/dashboard/orders/:id/items` | PATCH | ✅ | Update order items |
| `/api/dashboard/branches` | GET | ✅ | Get branches for filter |
| `/api/dashboard/customers` | GET | ✅ | Get customers for filter |

### Missing Actions/Buttons
- [ ] **Delete Order Button** - Backend ada tapi belum di frontend
- [ ] **Bulk Action Button** - Bulk update status/payment
- [ ] **Print Invoice Button** - Print order invoice
- [ ] **Export Orders Button** - Export to CSV/Excel
- [ ] **Duplicate Order Button** - Copy existing order
- [ ] **Order Timeline View** - Visual timeline of order progress

---

## 3. PICKUP (`/pickup`)

### Routes Available
| Route | Status | Keterangan |
|-------|--------|------------|
| `/pickup` | ✅ Ready | Pickup/Delivery tracking |

### Actions (Backend)
| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `/api/dashboard/pickup` | GET | ✅ | List pickup orders |
| `/api/dashboard/pickup/:id` | GET | ✅ | Get pickup detail |
| `/api/dashboard/pickup/:id/status` | PATCH | ✅ | Update pickup status |
| `/api/dashboard/pickup/:id/assign-driver` | PATCH | ✅ | Assign driver |

### Missing Actions/Buttons
- [ ] **Create Pickup Button** - Form untuk buat pickup baru
- [ ] **Update ETA Button** - Update estimasi waktu
- [ ] **Notify Customer Button** - Kirim notifikasi ke pelanggan
- [ ] **Pickup History Button** - Lihat riwayat pickup
- [ ] **Route Optimization Button** - Optimize rute driver

---

## 4. INVENTORY (`/inventory`)

### Routes Available
| Route | Status | Keterangan |
|-------|--------|------------|
| `/inventory` | ✅ Ready | Inventory management |

### Actions (Frontend `_actions/inventory.ts`)
| Action | Status | Keterangan |
|--------|--------|------------|
| `createProductAction` | ❌ MISSING | Create new product |
| `updateProductAction` | ❌ MISSING | Update product |
| `deleteProductAction` | ❌ MISSING | Delete product |
| `createAdjustmentAction` | ❌ MISSING | Stock adjustment |
| `createTransferAction` | ❌ MISSING | Transfer stock |
| `updateTransferAction` | ❌ MISSING | Approve/reject transfer |

### Actions (Backend)
| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `/api/dashboard/inventory/products` | GET | ✅ | List products |
| `/api/dashboard/inventory/adjustments` | GET/POST | ✅ | List/Create adjustments |
| `/api/dashboard/inventory/transfers` | GET/POST | ✅ | List/Create transfers |
| `/api/dashboard/inventory/transfers/:id` | PATCH | ✅ | Update transfer status |
| `/api/dashboard/branches` | GET | ✅ | List branches |

### Missing Actions/Buttons (Frontend)
- [ ] **Create Product Button** - Form tambah produk baru
- [ ] **Edit Product Button** - Edit detail produk
- [ ] **Delete Product Button** - Hapus produk
- [ ] **Stock Adjustment Button** - Penyesuaian stok manual
- [ ] **Request Transfer Button** - Minta transfer stok
- [ ] **Approve Transfer Button** - Terima/approve transfer
- [ ] **Reject Transfer Button** - Tolak transfer
- [ ] **Stock History Button** - Riwayat perubahan stok
- [ ] **Low Stock Alert Button** - Alert stok menipis
- [ ] **Import Products Button** - Import dari CSV/Excel
- [ ] **Export Inventory Button** - Export data inventory

---

## 5. LAPORAN (`/laporan`)

### Routes Available
| Route | Status | Keterangan |
|-------|--------|------------|
| `/laporan` | ⚠️ PLACEHOLDER | Reports page (client-only) |

### Actions (Backend)
| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `/api/dashboard/reports` | GET | ✅ | Reports data |
| `/api/dashboard/kpis` | GET | ✅ | KPI metrics |

### Missing Actions/Buttons
- [ ] **Generate Report Button** - Generate custom report
- [ ] **Filter Date Button** - Filter by date range
- [ ] **Export PDF Button** - Export to PDF
- [ ] **Export Excel Button** - Export to Excel
- [ ] **Schedule Report Button** - Jadwalkan laporan otomatis
- [ ] **Compare Period Button** - Bandingkan periode
- [ ] **Chart Toggle Button** - Switch chart types
- [ ] **Print Report Button** - Print laporan

---

## 6. CABANG (`/cabang`)

### Routes Available
| Route | Status | Keterangan |
|-------|--------|------------|
| `/cabang` | ✅ Ready | Branch list |
| `/cabang/new` | ✅ Ready | Create branch |
| `/cabang/[id]` | ✅ Ready | Branch detail |
| `/cabang/[id]/pengaturan` | ✅ Ready | Branch settings |

### Actions (Backend)
| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `/api/dashboard/branches` | GET/POST | ✅ | List/Create branches |
| `/api/dashboard/branches/:id` | GET/PATCH/DELETE | ✅ | Get/Update/Delete branch |

### Missing Actions/Buttons
- [ ] **Delete Branch Button** - Hapus cabang
- [ ] **Archive Branch Button** - Arsipkan cabang
- [ ] **Duplicate Branch Button** - Duplikat setting cabang
- [ ] **View Branch Analytics** - Analitik per cabang
- [ ] **Manage Branch Staff** - Kelola staff per cabang

---

## 7. TIM (`/tim`)

### Routes Available
| Route | Status | Keterangan |
|-------|--------|------------|
| `/tim` | ✅ Ready | Team management |
| `/tim/roles` | ✅ Ready | Role list |
| `/tim/roles/new` | ✅ Ready | Create role |
| `/tim/roles/[id]` | ✅ Ready | Edit role |

### Actions (Frontend `actions.ts`)
| Action | Status | Keterangan |
|--------|--------|------------|
| `updateMemberRoleAction` | ✅ | Update member role |
| `updateMemberStatusAction` | ✅ | Activate/deactivate member |
| `resendInviteAction` | ✅ | Resend invitation |
| `cancelInviteAction` | ✅ | Cancel invitation |
| `createInviteAction` | ✅ | Create new invitation |
| `updateMemberBranchesAction` | ❌ MISSING | Assign branch to member |

### Actions (Backend)
| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `/api/dashboard/team/members` | GET | ✅ | List members |
| `/api/dashboard/team/members/:id/role` | PATCH | ✅ | Update member role |
| `/api/dashboard/team/members/:id/status` | PATCH | ✅ | Update member status |
| `/api/dashboard/team/members/:id/branches` | POST | ✅ | Assign branch |
| `/api/dashboard/team/roles` | GET/POST | ✅ | List/Create roles |
| `/api/dashboard/team/roles/:id` | GET | ✅ | Get role detail |
| `/api/dashboard/team/roles/:id/permissions` | GET/PUT | ✅ | Get/Update permissions |
| `/api/dashboard/team/invitations` | GET/POST | ✅ | List/Create invitations |
| `/api/dashboard/team/invitations/:id/resend` | POST | ✅ | Resend invitation |
| `/api/dashboard/team/invitations/:id/cancel` | POST | ✅ | Cancel invitation |

### Missing Actions/Buttons
- [ ] **Remove Member Button** - Hapus member dari organisasi
- [ ] **Transfer Ownership Button** - Transfer kepemilikan
- [ ] **Bulk Invite Button** - Invite multiple users
- [ ] **Role Template Button** - Gunakan template role
- [ ] **Copy Role Button** - Duplikat role
- [ ] **Member Activity Log** - Lihat aktivitas member

---

## 8. PENGATURAN (`/pengaturan`)

### Routes Available
| Route | Status | Keterangan |
|-------|--------|------------|
| `/pengaturan` | ✅ Ready | Organization settings |
| `/settings` | ⚠️ DUPLICATE | Alternative settings (redundant) |
| `/settings/profile` | ⚠️ DUPLICATE | Profile settings |
| `/settings/billing` | ⚠️ DUPLICATE | Billing settings |
| `/settings/access` | ⚠️ DUPLICATE | Access settings |
| `/settings/notifications` | ⚠️ DUPLICATE | Notification settings |

### Actions (Backend)
| Endpoint | Method | Status | Keterangan |
|----------|--------|--------|------------|
| `/api/dashboard/organization` | GET/PATCH | ✅ | Get/Update organization |
| `/api/dashboard/billing/status` | GET | ✅ | Billing status |

### Missing Actions/Buttons
- [ ] **Delete Organization Button** - Hapus organisasi
- [ ] **Change Business Type Button** - Ganti tipe bisnis
- [ ] **Data Export Button** - Export semua data
- [ ] **Integration Settings** - Pengaturan integrasi (WhatsApp, dll)
- [ ] **Notification Preferences** - Preferensi notifikasi

---

## Priority Development List

### 🔴 HIGH PRIORITY (Core Features Missing)

#### Inventory Module
1. **Create Product Form** - Modal/form untuk tambah produk
2. **Edit Product Form** - Edit detail produk
3. **Stock Adjustment UI** - Form penyesuaian stok
4. **Transfer Request UI** - Form request transfer
5. **Transfer Approval UI** - Approve/reject transfer

#### Order Module
1. **Delete Order Button** - Backend sudah ada, frontend belum
2. **Print Invoice** - Cetak invoice order

#### Laporan Module
1. **Report Filters** - Filter berdasarkan tanggal, cabang, tipe
2. **Export Functions** - Export ke PDF/Excel

### 🟡 MEDIUM PRIORITY (Enhancement)

1. **Pickup Create Form** - Form untuk buat pickup baru
2. **Branch Analytics** - Detail analytics per cabang
3. **Member Branch Assignment** - Assign member ke cabang
4. **Bulk Actions** - Bulk update/delete

### 🟢 LOW PRIORITY (Nice to Have)

1. **Dashboard Widget Customization** - Drag-drop widget
2. **Route Optimization** - Optimize rute pickup
3. **Scheduled Reports** - Laporan otomatis
4. **Role Templates** - Template role siap pakai

---

## Route vs Backend API Mapping

| Frontend Route | Backend API | Status |
|----------------|-------------|--------|
| `/dashboard` | `/api/dashboard/*` | ✅ Matched |
| `/order` | `/api/dashboard/orders` | ✅ Matched |
| `/pickup` | `/api/dashboard/pickup` | ✅ Matched |
| `/inventory` | `/api/dashboard/inventory/*` | ✅ Matched |
| `/laporan` | `/api/dashboard/reports` | ✅ Matched |
| `/cabang` | `/api/dashboard/branches` | ✅ Matched |
| `/tim` | `/api/dashboard/team/*` | ✅ Matched |
| `/pengaturan` | `/api/dashboard/organization` | ✅ Matched |
| `/settings/*` | `/api/dashboard/*` | ⚠️ Redundant |

---

## Notes

1. **Route `/settings`** - Redundant dengan `/pengaturan`, pertimbangkan untuk consolidate
2. **Laporan Page** - Masih placeholder perlu full implementation
3. **Inventory Actions** - Banyak action di backend tapi belum ada UI di frontend
4. **Pickup Module** - Belum ada create pickup form (hanya tracking)
5. **Team Module** - Sudah cukup lengkap, tinggal polish UI
