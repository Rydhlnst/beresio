# Dashboard API Routes - Testing & Seeding

## Unit Tests

### Running Tests

```bash
# Run all tests
cd apps/backend
pnpm test

# Run specific test file
pnpm test products.test.ts

# Run with coverage
pnpm test --coverage
```

### Test Files

| File | Description |
|------|-------------|
| `products.test.ts` | Tests for Products CRUD API |
| `upload.test.ts` | Tests for Image Upload API |
| `branches.test.ts` | Tests for Branches API |
| `rbac.test.ts` | Tests for Role-Based Access Control |
| `team.test.ts` | Tests for Team Management |
| `test-utils.ts` | Mock utilities for testing |

### Test Coverage

#### Products API
- ✅ GET / - List products with pagination
- ✅ GET /?search= - Search products
- ✅ GET /?stockStatus= - Filter by stock status
- ✅ GET /:id - Get product detail
- ✅ POST / - Create product
- ✅ PATCH /:id - Update product
- ✅ DELETE /:id - Delete product
- ✅ GET /categories - List categories
- ✅ GET /suppliers - List suppliers

#### Upload API
- ✅ POST /image - Upload single image
- ✅ POST /multiple - Upload multiple images
- ✅ DELETE /image - Delete image (mock)

## Database Seeding

### Prerequisites

1. Database connection string in `.env`
2. Organization ID (optional, defaults to "default_org_id")

### Seeding Products

```bash
cd packages/db

# Seed with default organization
pnpm db:seed:products

# Seed with specific organization
pnpm db:seed:products org_your_org_id
```

### Seeding Other Data

```bash
# Seed roles and permissions
pnpm db:seed:roles

# Seed business data
pnpm db:seed:business
```

### Seed Data Overview

#### Categories (8 items)
- Elektronik
- Fashion
- Makanan & Minuman
- Kesehatan & Kecantikan
- Rumah Tangga
- Olahraga
- Buku & Alat Tulis
- Mainan & Hobi

#### Suppliers (8 items)
- PT Indofood
- PT Unilever Indonesia
- PT Samsung Electronics
- PT Nestlé Indonesia
- PT Mayora Indah
- PT Wings Surya
- PT Coca-Cola Indonesia
- PT Indocement

#### Products (10 items)
Sample products across different categories with realistic pricing and data.

## Mock Data

Tests use in-memory mocks for database operations. See `test-utils.ts` for implementation details.

### Creating New Tests

```typescript
import { describe, expect, it, vi } from "vitest";
import { createDbMock, createTestApp } from "./test-utils";

// Mock auth (required)
vi.mock("../../middleware/auth", () => ({
    authMiddleware: async (c: any, next: any) => {
        c.set("user", { id: "user-1" });
        c.set("session", { activeOrganizationId: "org-1" });
        await next();
    },
}));

vi.mock("../../lib/auth-context", () => ({
    getOrgId: vi.fn(async () => "org-1"),
}));

import { yourRouter } from "./your-router";
const createApp = (db: any) => createTestApp(yourRouter, "/api/path", db);

describe("your routes", () => {
    it("does something", async () => {
        const db = createDbMock({
            selectResults: [[{ id: "1", name: "Test" }]],
        });
        const app = createApp(db);
        
        const res = await app.request("/api/path");
        const body = await res.json();
        
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });
});
```

## Environment Variables for Testing

```env
DATABASE_URL=postgresql://...
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

## CI/CD Integration

Tests are designed to run in CI environments without requiring actual database connections.
