import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, asc, desc, eq, ilike, inArray, sql, ne } from 'drizzle-orm'
import {
    products,
    productCategories,
    suppliers,
    inventoryProducts,
    inventoryStocks,
    branches,
    productVariants,
    inventoryVariantStocks,
} from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export const productsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// ============================================
// PRODUCTS ENDPOINTS
// ============================================

// GET /api/dashboard/products
// List all products with filters, search, and pagination
productsRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        // Query params
        const search = c.req.query('search')?.trim()
        const categoryId = c.req.query('categoryId')
        const supplierId = c.req.query('supplierId')
        const status = c.req.query('status') // 'active' | 'inactive'
        const stockStatus = c.req.query('stockStatus') // 'ok' | 'low' | 'out'
        const sortBy = c.req.query('sortBy') || 'createdAt'
        const sortOrder = c.req.query('sortOrder') || 'desc'
        const page = Math.max(1, Number(c.req.query('page') || 1))
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number(c.req.query('limit') || DEFAULT_LIMIT)))
        const offset = (page - 1) * limit

        // Build conditions
        const conditions = [eq(products.organizationId, orgId)]
        
        if (search) {
            const q = `%${search}%`
            conditions.push(sql`(
                ${products.name} ilike ${q}
                or ${products.sku} ilike ${q}
                or coalesce(${products.barcode}, '') ilike ${q}
            )`)
        }
        
        if (categoryId) {
            conditions.push(eq(products.categoryId, categoryId))
        }
        
        if (supplierId) {
            conditions.push(eq(products.supplierId, supplierId))
        }
        
        if (status === 'active') {
            conditions.push(eq(products.isActive, true))
        } else if (status === 'inactive') {
            conditions.push(eq(products.isActive, false))
        }

        // Get total count
        const [{ count }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(...conditions))

        // Build sort
        let orderBy
        switch (sortBy) {
            case 'name':
                orderBy = sortOrder === 'asc' ? asc(products.name) : desc(products.name)
                break
            case 'price':
                orderBy = sortOrder === 'asc' ? asc(products.salePrice) : desc(products.salePrice)
                break
            case 'stock':
                // Will sort after fetching
                orderBy = desc(products.createdAt)
                break
            default:
                orderBy = sortOrder === 'asc' ? asc(products.createdAt) : desc(products.createdAt)
        }

        // Fetch products
        const rows = await db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
                barcode: products.barcode,
                basePrice: products.basePrice,
                salePrice: products.salePrice,
                costPrice: products.costPrice,
                imageUrl: products.imageUrl,
                isActive: products.isActive,
                isFeatured: products.isFeatured,
                soldCount: products.soldCount,
                inventoryProductId: products.inventoryProductId,
                categoryId: products.categoryId,
                supplierId: products.supplierId,
                createdAt: products.createdAt,
                categoryName: productCategories.name,
                supplierName: suppliers.name,
            })
            .from(products)
            .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
            .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset)

        // Get stock quantities for products with inventory link
        const inventoryIds = rows
            .filter((r: any) => r.inventoryProductId)
            .map((r: any) => r.inventoryProductId)

        let stockMap = new Map<string, number>()
        
        if (inventoryIds.length > 0) {
            const stocks = await db
                .select({
                    productId: inventoryStocks.productId,
                    quantity: inventoryStocks.quantity,
                })
                .from(inventoryStocks)
                .where(inArray(inventoryStocks.productId, inventoryIds))

            // Aggregate stocks by product
            for (const stock of stocks) {
                const current = stockMap.get(stock.productId) || 0
                stockMap.set(stock.productId, current + Number(stock.quantity))
            }
        }

        // Build response
        const data = rows.map((row: any) => {
            const stockQuantity = row.inventoryProductId 
                ? (stockMap.get(row.inventoryProductId) || 0)
                : null

            // Determine stock status
            let stockStatus = 'unknown'
            if (stockQuantity !== null) {
                if (stockQuantity === 0) stockStatus = 'out'
                else if (stockQuantity <= 10) stockStatus = 'low'
                else stockStatus = 'ok'
            }

            return {
                id: row.id,
                name: row.name,
                sku: row.sku,
                barcode: row.barcode,
                pricing: {
                    basePrice: Number(row.basePrice || 0),
                    salePrice: row.salePrice ? Number(row.salePrice) : null,
                    costPrice: row.costPrice ? Number(row.costPrice) : null,
                },
                stock: {
                    quantity: stockQuantity,
                    status: stockStatus,
                },
                imageUrl: row.imageUrl,
                isActive: row.isActive,
                isFeatured: row.isFeatured,
                soldCount: Number(row.soldCount || 0),
                category: row.categoryId ? {
                    id: row.categoryId,
                    name: row.categoryName,
                } : null,
                supplier: row.supplierId ? {
                    id: row.supplierId,
                    name: row.supplierName,
                } : null,
                createdAt: row.createdAt,
            }
        })

        // Filter by stock status if specified
        let filteredData = data
        if (stockStatus && stockStatus !== 'unknown') {
            filteredData = data.filter((p: any) => p.stock.status === stockStatus)
        }

        return ok(c, {
            data: filteredData,
            meta: {
                total: Number(count),
                page,
                limit,
                totalPages: Math.ceil(Number(count) / limit),
            },
        })
    } catch (err: any) {
        console.error('[products/list]', err)
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/products
// Create new product
productsRouter.post('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        // Validation
        const name = body?.name?.trim()
        if (!name) return errors.badRequest(c, 'Nama produk wajib diisi')

        const sku = body?.sku?.trim()
        const barcode = body?.barcode?.trim()

        // Check SKU uniqueness
        if (sku) {
            const [existingSku] = await db
                .select({ id: products.id })
                .from(products)
                .where(and(
                    eq(products.organizationId, orgId),
                    eq(products.sku, sku)
                ))
                .limit(1)
            if (existingSku) return errors.badRequest(c, 'SKU sudah digunakan')
        }

        // Check barcode uniqueness
        if (barcode) {
            const [existingBarcode] = await db
                .select({ id: products.id })
                .from(products)
                .where(and(
                    eq(products.organizationId, orgId),
                    eq(products.barcode, barcode)
                ))
                .limit(1)
            if (existingBarcode) return errors.badRequest(c, 'Barcode sudah digunakan')
        }

        // Create product
        const [created] = await db
            .insert(products)
            .values({
                organizationId: orgId,
                name,
                sku: sku || null,
                barcode: barcode || null,
                categoryId: body?.categoryId || null,
                supplierId: body?.supplierId || null,
                basePrice: Number(body?.basePrice || 0),
                salePrice: body?.salePrice ? Number(body.salePrice) : null,
                costPrice: body?.costPrice ? Number(body.costPrice) : null,
                description: body?.description?.trim() || null,
                shortDescription: body?.shortDescription?.trim() || null,
                weight: body?.weight ? Number(body.weight) : null,
                imageUrl: body?.imageUrl || null,
                isActive: body?.isActive !== false,
                isFeatured: body?.isFeatured === true,
            })
            .returning()

        return ok(c, {
            id: created.id,
            name: created.name,
            sku: created.sku,
            barcode: created.barcode,
            pricing: {
                basePrice: Number(created.basePrice),
                salePrice: created.salePrice,
                costPrice: created.costPrice,
            },
            isActive: created.isActive,
            categoryId: created.categoryId,
            supplierId: created.supplierId,
            createdAt: created.createdAt,
        })
    } catch (err: any) {
        console.error('[products/create]', err)
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/products/:id
// Update product
productsRouter.patch('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const productId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        // Check product exists
        const [existing] = await db
            .select({ id: products.id, sku: products.sku, barcode: products.barcode })
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, orgId)
            ))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Produk tidak ditemukan')

        // Check SKU uniqueness if changing
        const newSku = body?.sku?.trim()
        if (newSku && newSku !== existing.sku) {
            const [duplicate] = await db
                .select({ id: products.id })
                .from(products)
                .where(and(
                    eq(products.organizationId, orgId),
                    eq(products.sku, newSku)
                ))
                .limit(1)
            if (duplicate) return errors.badRequest(c, 'SKU sudah digunakan')
        }

        // Check barcode uniqueness if changing
        const newBarcode = body?.barcode?.trim()
        if (newBarcode && newBarcode !== existing.barcode) {
            const [duplicate] = await db
                .select({ id: products.id })
                .from(products)
                .where(and(
                    eq(products.organizationId, orgId),
                    eq(products.barcode, newBarcode)
                ))
                .limit(1)
            if (duplicate) return errors.badRequest(c, 'Barcode sudah digunakan')
        }

        // Build updates
        const updates: any = {}
        
        if (body?.name !== undefined) updates.name = body.name.trim()
        if (newSku !== undefined) updates.sku = newSku || null
        if (newBarcode !== undefined) updates.barcode = newBarcode || null
        if (body?.categoryId !== undefined) updates.categoryId = body.categoryId || null
        if (body?.supplierId !== undefined) updates.supplierId = body.supplierId || null
        if (body?.basePrice !== undefined) updates.basePrice = Number(body.basePrice)
        if (body?.salePrice !== undefined) updates.salePrice = body.salePrice ? Number(body.salePrice) : null
        if (body?.costPrice !== undefined) updates.costPrice = body.costPrice ? Number(body.costPrice) : null
        if (body?.description !== undefined) updates.description = body.description?.trim() || null
        if (body?.shortDescription !== undefined) updates.shortDescription = body.shortDescription?.trim() || null
        if (body?.weight !== undefined) updates.weight = body.weight ? Number(body.weight) : null
        if (body?.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null
        if (body?.isActive !== undefined) updates.isActive = body.isActive
        if (body?.isFeatured !== undefined) updates.isFeatured = body.isFeatured

        if (Object.keys(updates).length === 0) {
            return errors.badRequest(c, 'Tidak ada field yang diupdate')
        }

        const [updated] = await db
            .update(products)
            .set(updates)
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, orgId)
            ))
            .returning()

        return ok(c, {
            id: updated.id,
            name: updated.name,
            sku: updated.sku,
            barcode: updated.barcode,
            pricing: {
                basePrice: Number(updated.basePrice),
                salePrice: updated.salePrice,
                costPrice: updated.costPrice,
            },
            isActive: updated.isActive,
            isFeatured: updated.isFeatured,
            categoryId: updated.categoryId,
            supplierId: updated.supplierId,
            updatedAt: updated.updatedAt,
        })
    } catch (err: any) {
        console.error('[products/update]', err)
        return errors.internal(c, err.message)
    }
})

// DELETE /api/dashboard/products/:id
// Delete product (soft delete by marking inactive or hard delete)
productsRouter.delete('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const productId = c.req.param('id')

        // Check product exists
        const [existing] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, orgId)
            ))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Produk tidak ditemukan')

        // Delete product
        await db
            .delete(products)
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, orgId)
            ))

        return ok(c, { deleted: true })
    } catch (err: any) {
        console.error('[products/delete]', err)
        return errors.internal(c, err.message)
    }
})

// ============================================
// VARIANTS ENDPOINTS
// ============================================

// GET /api/dashboard/products/:id/variants
productsRouter.get('/:id/variants', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const productId = c.req.param('id')

        const [productRow] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(eq(products.id, productId), eq(products.organizationId, orgId)))
            .limit(1)

        if (!productRow) return errors.notFound(c, 'Product not found')

        const rows = await db
            .select({
                id: productVariants.id,
                sku: productVariants.sku,
                barcode: productVariants.barcode,
                option1: productVariants.option1,
                option2: productVariants.option2,
                option3: productVariants.option3,
                price: productVariants.price,
                compareAtPrice: productVariants.compareAtPrice,
                costPrice: productVariants.costPrice,
                imageUrl: productVariants.imageUrl,
                sortOrder: productVariants.sortOrder,
                isActive: productVariants.isActive,
                createdAt: productVariants.createdAt,
                updatedAt: productVariants.updatedAt,
            })
            .from(productVariants)
            .where(and(
                eq(productVariants.organizationId, orgId),
                eq(productVariants.productId, productId)
            ))
            .orderBy(asc(productVariants.sortOrder), asc(productVariants.createdAt))

        return ok(c, { data: rows })
    } catch (err: any) {
        console.error('[products/variants/list]', err)
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/products/:id/variants
productsRouter.post('/:id/variants', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const productId = c.req.param('id')
        const body = await c.req.json().catch(() => null)

        const [productRow] = await db
            .select({ id: products.id })
            .from(products)
            .where(and(eq(products.id, productId), eq(products.organizationId, orgId)))
            .limit(1)

        if (!productRow) return errors.notFound(c, 'Product not found')

        const sku = body?.sku?.trim()
        const barcode = body?.barcode?.trim()

        if (sku) {
            const [existingSku] = await db
                .select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.organizationId, orgId),
                    eq(productVariants.sku, sku)
                ))
                .limit(1)
            if (existingSku) return errors.badRequest(c, 'SKU varian sudah digunakan')
        }

        if (barcode) {
            const [existingBarcode] = await db
                .select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.organizationId, orgId),
                    eq(productVariants.barcode, barcode)
                ))
                .limit(1)
            if (existingBarcode) return errors.badRequest(c, 'Barcode varian sudah digunakan')
        }

        const [created] = await db
            .insert(productVariants)
            .values({
                organizationId: orgId,
                productId,
                sku: sku || null,
                barcode: barcode || null,
                option1: body?.option1?.trim() || null,
                option2: body?.option2?.trim() || null,
                option3: body?.option3?.trim() || null,
                price: body?.price !== undefined ? Number(body.price) : null,
                compareAtPrice: body?.compareAtPrice !== undefined ? Number(body.compareAtPrice) : null,
                costPrice: body?.costPrice !== undefined ? Number(body.costPrice) : null,
                imageUrl: body?.imageUrl || null,
                sortOrder: body?.sortOrder !== undefined ? Number(body.sortOrder) : 0,
                isActive: body?.isActive !== false,
            })
            .returning()

        return ok(c, created)
    } catch (err: any) {
        console.error('[products/variants/create]', err)
        return errors.internal(c, err.message)
    }
})

// PATCH /api/dashboard/products/variants/:variantId
productsRouter.patch('/variants/:variantId', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const variantId = c.req.param('variantId')
        const body = await c.req.json().catch(() => null)

        const [existing] = await db
            .select({
                id: productVariants.id,
                sku: productVariants.sku,
                barcode: productVariants.barcode,
            })
            .from(productVariants)
            .where(and(eq(productVariants.id, variantId), eq(productVariants.organizationId, orgId)))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Variant not found')

        const newSku = body?.sku?.trim()
        if (newSku && newSku !== existing.sku) {
            const [duplicate] = await db
                .select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.organizationId, orgId),
                    eq(productVariants.sku, newSku),
                    ne(productVariants.id, variantId)
                ))
                .limit(1)
            if (duplicate) return errors.badRequest(c, 'SKU varian sudah digunakan')
        }

        const newBarcode = body?.barcode?.trim()
        if (newBarcode && newBarcode !== existing.barcode) {
            const [duplicate] = await db
                .select({ id: productVariants.id })
                .from(productVariants)
                .where(and(
                    eq(productVariants.organizationId, orgId),
                    eq(productVariants.barcode, newBarcode),
                    ne(productVariants.id, variantId)
                ))
                .limit(1)
            if (duplicate) return errors.badRequest(c, 'Barcode varian sudah digunakan')
        }

        const updates: any = {}
        if (body?.sku !== undefined) updates.sku = newSku || null
        if (body?.barcode !== undefined) updates.barcode = newBarcode || null
        if (body?.option1 !== undefined) updates.option1 = body.option1?.trim() || null
        if (body?.option2 !== undefined) updates.option2 = body.option2?.trim() || null
        if (body?.option3 !== undefined) updates.option3 = body.option3?.trim() || null
        if (body?.price !== undefined) updates.price = body.price !== null ? Number(body.price) : null
        if (body?.compareAtPrice !== undefined) updates.compareAtPrice = body.compareAtPrice !== null ? Number(body.compareAtPrice) : null
        if (body?.costPrice !== undefined) updates.costPrice = body.costPrice !== null ? Number(body.costPrice) : null
        if (body?.imageUrl !== undefined) updates.imageUrl = body.imageUrl || null
        if (body?.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder)
        if (body?.isActive !== undefined) updates.isActive = body.isActive

        if (Object.keys(updates).length === 0) {
            return errors.badRequest(c, 'Tidak ada field yang diupdate')
        }

        const [updated] = await db
            .update(productVariants)
            .set(updates)
            .where(and(eq(productVariants.id, variantId), eq(productVariants.organizationId, orgId)))
            .returning()

        return ok(c, updated)
    } catch (err: any) {
        console.error('[products/variants/update]', err)
        return errors.internal(c, err.message)
    }
})

// DELETE /api/dashboard/products/variants/:variantId
productsRouter.delete('/variants/:variantId', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const variantId = c.req.param('variantId')

        const [existing] = await db
            .select({ id: productVariants.id })
            .from(productVariants)
            .where(and(eq(productVariants.id, variantId), eq(productVariants.organizationId, orgId)))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Variant not found')

        const [stockRow] = await db
            .select({ quantity: inventoryVariantStocks.quantity })
            .from(inventoryVariantStocks)
            .where(and(
                eq(inventoryVariantStocks.organizationId, orgId),
                eq(inventoryVariantStocks.variantId, variantId)
            ))
            .limit(1)

        if (stockRow && Number(stockRow.quantity ?? 0) > 0) {
            return errors.badRequest(c, 'Cannot delete variant with existing stock')
        }

        await db
            .delete(productVariants)
            .where(and(eq(productVariants.id, variantId), eq(productVariants.organizationId, orgId)))

        return ok(c, { deleted: true })
    } catch (err: any) {
        console.error('[products/variants/delete]', err)
        return errors.internal(c, err.message)
    }
})

// ============================================
// CATEGORIES ENDPOINTS
// ============================================

// GET /api/dashboard/products/categories
productsRouter.get('/categories', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        const rows = await db
            .select({
                id: productCategories.id,
                name: productCategories.name,
                slug: productCategories.slug,
                description: productCategories.description,
                parentId: productCategories.parentId,
                sortOrder: productCategories.sortOrder,
                isActive: productCategories.isActive,
                createdAt: productCategories.createdAt,
            })
            .from(productCategories)
            .where(and(
                eq(productCategories.organizationId, orgId),
                eq(productCategories.isActive, true)
            ))
            .orderBy(asc(productCategories.sortOrder), asc(productCategories.name))

        return ok(c, { data: rows })
    } catch (err: any) {
        console.error('[products/categories]', err)
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/products/categories
productsRouter.post('/categories', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const name = body?.name?.trim()
        if (!name) return errors.badRequest(c, 'Nama kategori wajib diisi')

        const [created] = await db
            .insert(productCategories)
            .values({
                organizationId: orgId,
                name,
                slug: body?.slug?.trim() || null,
                description: body?.description?.trim() || null,
                parentId: body?.parentId || null,
                sortOrder: body?.sortOrder ? Number(body.sortOrder) : 0,
            })
            .returning()

        return ok(c, {
            id: created.id,
            name: created.name,
            slug: created.slug,
            description: created.description,
            parentId: created.parentId,
            sortOrder: created.sortOrder,
        })
    } catch (err: any) {
        console.error('[products/categories/create]', err)
        return errors.internal(c, err.message)
    }
})

// ============================================
// SUPPLIERS ENDPOINTS
// ============================================

// GET /api/dashboard/products/suppliers
productsRouter.get('/suppliers', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        const rows = await db
            .select({
                id: suppliers.id,
                name: suppliers.name,
                code: suppliers.code,
                contactName: suppliers.contactName,
                email: suppliers.email,
                phone: suppliers.phone,
                address: suppliers.address,
                city: suppliers.city,
                isActive: suppliers.isActive,
                createdAt: suppliers.createdAt,
            })
            .from(suppliers)
            .where(and(
                eq(suppliers.organizationId, orgId),
                eq(suppliers.isActive, true)
            ))
            .orderBy(asc(suppliers.name))

        return ok(c, { data: rows })
    } catch (err: any) {
        console.error('[products/suppliers]', err)
        return errors.internal(c, err.message)
    }
})

// POST /api/dashboard/products/suppliers
productsRouter.post('/suppliers', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)

        const name = body?.name?.trim()
        if (!name) return errors.badRequest(c, 'Nama pemasok wajib diisi')

        const code = body?.code?.trim()
        
        // Check code uniqueness
        if (code) {
            const [existing] = await db
                .select({ id: suppliers.id })
                .from(suppliers)
                .where(and(
                    eq(suppliers.organizationId, orgId),
                    eq(suppliers.code, code)
                ))
                .limit(1)
            if (existing) return errors.badRequest(c, 'Kode pemasok sudah digunakan')
        }

        const [created] = await db
            .insert(suppliers)
            .values({
                organizationId: orgId,
                name,
                code: code || null,
                contactName: body?.contactName?.trim() || null,
                email: body?.email?.trim() || null,
                phone: body?.phone?.trim() || null,
                address: body?.address?.trim() || null,
                city: body?.city?.trim() || null,
                province: body?.province?.trim() || null,
                postalCode: body?.postalCode?.trim() || null,
            })
            .returning()

        return ok(c, {
            id: created.id,
            name: created.name,
            code: created.code,
            contactName: created.contactName,
            email: created.email,
            phone: created.phone,
        })
    } catch (err: any) {
        console.error('[products/suppliers/create]', err)
        return errors.internal(c, err.message)
    }
})

// GET /api/dashboard/products/:id
// Get single product detail
productsRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const productId = c.req.param('id')

        const [row] = await db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
                barcode: products.barcode,
                basePrice: products.basePrice,
                salePrice: products.salePrice,
                costPrice: products.costPrice,
                description: products.description,
                shortDescription: products.shortDescription,
                weight: products.weight,
                dimensions: products.dimensions,
                imageUrl: products.imageUrl,
                images: products.images,
                isActive: products.isActive,
                isFeatured: products.isFeatured,
                soldCount: products.soldCount,
                metaTitle: products.metaTitle,
                metaDescription: products.metaDescription,
                inventoryProductId: products.inventoryProductId,
                categoryId: products.categoryId,
                supplierId: products.supplierId,
                slug: products.slug,
                createdAt: products.createdAt,
                updatedAt: products.updatedAt,
                categoryName: productCategories.name,
                supplierName: suppliers.name,
            })
            .from(products)
            .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
            .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
            .where(and(
                eq(products.id, productId),
                eq(products.organizationId, orgId)
            ))
            .limit(1)

        if (!row) {
            return errors.notFound(c, 'Product not found')
        }

        // Get stock details if linked to inventory
        let stockDetails = null
        if (row.inventoryProductId) {
            const stocks = await db
                .select({
                    branchId: inventoryStocks.branchId,
                    branchName: branches.name,
                    quantity: inventoryStocks.quantity,
                })
                .from(inventoryStocks)
                .leftJoin(branches, eq(inventoryStocks.branchId, branches.id))
                .where(eq(inventoryStocks.productId, row.inventoryProductId))

            const totalQuantity = stocks.reduce((sum: number, s: any) => sum + Number(s.quantity), 0)

            stockDetails = {
                totalQuantity,
                byBranch: stocks.map((s: any) => ({
                    branchId: s.branchId,
                    branchName: s.branchName,
                    quantity: Number(s.quantity),
                })),
            }
        }

        return ok(c, {
            id: row.id,
            name: row.name,
            sku: row.sku,
            barcode: row.barcode,
            slug: row.slug,
            description: row.description,
            shortDescription: row.shortDescription,
            pricing: {
                basePrice: Number(row.basePrice || 0),
                salePrice: row.salePrice ? Number(row.salePrice) : null,
                costPrice: row.costPrice ? Number(row.costPrice) : null,
            },
            physical: {
                weight: row.weight,
                dimensions: row.dimensions,
            },
            media: {
                imageUrl: row.imageUrl,
                images: row.images || [],
            },
            seo: {
                metaTitle: row.metaTitle,
                metaDescription: row.metaDescription,
            },
            stock: stockDetails,
            isActive: row.isActive,
            isFeatured: row.isFeatured,
            soldCount: Number(row.soldCount || 0),
            category: row.categoryId ? {
                id: row.categoryId,
                name: row.categoryName,
            } : null,
            supplier: row.supplierId ? {
                id: row.supplierId,
                name: row.supplierName,
            } : null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        })
    } catch (err: any) {
        console.error('[products/detail]', err)
        return errors.internal(c, err.message)
    }
})
