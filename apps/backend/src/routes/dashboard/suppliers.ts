import { Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../../middleware/auth'
import { getOrgId } from '../../lib/auth-context'
import { errors, ok } from '../../lib/errors'
import { and, asc, desc, eq, ilike, sql, or, inArray } from 'drizzle-orm'
import { suppliers, products } from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

const createSupplierSchema = z.object({
    name: z.string().trim().min(1, 'Nama pemasok wajib diisi'),
    code: z.string().optional().nullable(),
    contactName: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    bankAccountNumber: z.string().optional().nullable(),
    bankAccountName: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
})

const updateSupplierSchema = z.object({
    name: z.string().trim().min(1, 'Nama pemasok wajib diisi').optional(),
    code: z.string().optional().nullable(),
    contactName: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    bankName: z.string().optional().nullable(),
    bankAccountNumber: z.string().optional().nullable(),
    bankAccountName: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
}).superRefine((value, ctx) => {
    if (
        value.name === undefined
        && value.code === undefined
        && value.contactName === undefined
        && value.email === undefined
        && value.phone === undefined
        && value.address === undefined
        && value.city === undefined
        && value.province === undefined
        && value.postalCode === undefined
        && value.bankName === undefined
        && value.bankAccountNumber === undefined
        && value.bankAccountName === undefined
        && value.notes === undefined
        && value.isActive === undefined
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tidak ada field yang diupdate',
            path: [],
        })
    }
})

function getValidationMessage(error: z.ZodError, fallback = 'Invalid payload') {
    return error.issues[0]?.message ?? fallback
}

export const suppliersRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/dashboard/suppliers
// List all suppliers with filters, search, and pagination
suppliersRouter.get('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        // Query params
        const search = c.req.query('search')?.trim()
        const status = c.req.query('status') // 'active' | 'inactive' | 'all'
        const city = c.req.query('city')?.trim()
        const sortBy = c.req.query('sortBy') || 'name'
        const sortOrder = c.req.query('sortOrder') || 'asc'
        const page = Math.max(1, Number(c.req.query('page') || 1))
        const limit = Math.min(MAX_LIMIT, Math.max(1, Number(c.req.query('limit') || DEFAULT_LIMIT)))
        const offset = (page - 1) * limit

        // Build conditions
        const conditions = [eq(suppliers.organizationId, orgId)]
        
        if (search) {
            const searchCondition = or(
                ilike(suppliers.name, `%${search}%`),
                ilike(suppliers.code, `%${search}%`),
                ilike(suppliers.contactName, `%${search}%`),
                ilike(suppliers.email, `%${search}%`),
                ilike(suppliers.phone, `%${search}%`)
            )
            if (searchCondition) {
                conditions.push(searchCondition)
            }
        }
        
        if (city) {
            conditions.push(ilike(suppliers.city, `%${city}%`))
        }
        
        if (status === 'active') {
            conditions.push(eq(suppliers.isActive, true))
        } else if (status === 'inactive') {
            conditions.push(eq(suppliers.isActive, false))
        }

        // Get total count
        const [{ count: totalCount }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(suppliers)
            .where(and(...conditions))

        // Build sort
        let orderBy
        switch (sortBy) {
            case 'name':
                orderBy = sortOrder === 'asc' ? asc(suppliers.name) : desc(suppliers.name)
                break
            case 'code':
                orderBy = sortOrder === 'asc' ? asc(suppliers.code) : desc(suppliers.code)
                break
            case 'createdAt':
                orderBy = sortOrder === 'asc' ? asc(suppliers.createdAt) : desc(suppliers.createdAt)
                break
            default:
                orderBy = asc(suppliers.name)
        }

        // Fetch suppliers
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
                province: suppliers.province,
                postalCode: suppliers.postalCode,
                bankName: suppliers.bankName,
                bankAccountNumber: suppliers.bankAccountNumber,
                bankAccountName: suppliers.bankAccountName,
                notes: suppliers.notes,
                isActive: suppliers.isActive,
                createdAt: suppliers.createdAt,
                updatedAt: suppliers.updatedAt,
            })
            .from(suppliers)
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset)

        // Get product count for each supplier
        const supplierIds = rows.map((r: any) => r.id)
        let productCounts: Map<string, number> = new Map()
        
        if (supplierIds.length > 0) {
            const counts = await db
                .select({
                    supplierId: products.supplierId,
                    count: sql<number>`count(*)`,
                })
                .from(products)
                .where(and(
                    inArray(products.supplierId, supplierIds),
                    eq(products.organizationId, orgId)
                ))
                .groupBy(products.supplierId)

            for (const c of counts) {
                if (c.supplierId) {
                    productCounts.set(c.supplierId, Number(c.count))
                }
            }
        }

        // Build response
        const data = rows.map((row: any) => ({
            ...row,
            productCount: productCounts.get(row.id) || 0,
        }))

        return ok(c, {
            data,
            meta: {
                total: Number(totalCount),
                page,
                limit,
                totalPages: Math.ceil(Number(totalCount) / limit),
            },
        })
    } catch (err: any) {
        console.error('[suppliers/list]', err)
        return errors.internal(c)
    }
})

// GET /api/dashboard/suppliers/:id
// Get single supplier detail
suppliersRouter.get('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const supplierId = c.req.param('id')

        const [row] = await db
            .select({
                id: suppliers.id,
                name: suppliers.name,
                code: suppliers.code,
                contactName: suppliers.contactName,
                email: suppliers.email,
                phone: suppliers.phone,
                address: suppliers.address,
                city: suppliers.city,
                province: suppliers.province,
                postalCode: suppliers.postalCode,
                bankName: suppliers.bankName,
                bankAccountNumber: suppliers.bankAccountNumber,
                bankAccountName: suppliers.bankAccountName,
                notes: suppliers.notes,
                isActive: suppliers.isActive,
                createdAt: suppliers.createdAt,
                updatedAt: suppliers.updatedAt,
            })
            .from(suppliers)
            .where(and(
                eq(suppliers.id, supplierId),
                eq(suppliers.organizationId, orgId)
            ))
            .limit(1)

        if (!row) {
            return errors.notFound(c, 'Supplier not found')
        }

        // Get product count
        const [{ count: productCount }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(
                eq(products.supplierId, supplierId),
                eq(products.organizationId, orgId)
            ))

        return ok(c, {
            ...row,
            productCount: Number(productCount),
        })
    } catch (err: any) {
        console.error('[suppliers/detail]', err)
        return errors.internal(c)
    }
})

// POST /api/dashboard/suppliers
// Create new supplier
suppliersRouter.post('/', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const body = await c.req.json().catch(() => null)
        const parsedBody = createSupplierSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }

        const parsed = parsedBody.data
        const name = parsed.name
        const code = parsed.code?.trim()
        
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

        // Create supplier
        const [created] = await db
            .insert(suppliers)
            .values({
                organizationId: orgId,
                name,
                code: code || null,
                contactName: parsed.contactName?.trim() || null,
                email: parsed.email?.trim() || null,
                phone: parsed.phone?.trim() || null,
                address: parsed.address?.trim() || null,
                city: parsed.city?.trim() || null,
                province: parsed.province?.trim() || null,
                postalCode: parsed.postalCode?.trim() || null,
                bankName: parsed.bankName?.trim() || null,
                bankAccountNumber: parsed.bankAccountNumber?.trim() || null,
                bankAccountName: parsed.bankAccountName?.trim() || null,
                notes: parsed.notes?.trim() || null,
                isActive: parsed.isActive !== false,
            })
            .returning()

        return ok(c, {
            id: created.id,
            name: created.name,
            code: created.code,
            contactName: created.contactName,
            email: created.email,
            phone: created.phone,
            isActive: created.isActive,
            createdAt: created.createdAt,
        })
    } catch (err: any) {
        console.error('[suppliers/create]', err)
        return errors.internal(c)
    }
})

// PATCH /api/dashboard/suppliers/:id
// Update supplier
suppliersRouter.patch('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const supplierId = c.req.param('id')
        const body = await c.req.json().catch(() => null)
        const parsedBody = updateSupplierSchema.safeParse(body)
        if (!parsedBody.success) {
            return errors.badRequest(c, getValidationMessage(parsedBody.error))
        }
        const parsed = parsedBody.data

        // Check supplier exists
        const [existing] = await db
            .select({ id: suppliers.id, code: suppliers.code })
            .from(suppliers)
            .where(and(
                eq(suppliers.id, supplierId),
                eq(suppliers.organizationId, orgId)
            ))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Pemasok tidak ditemukan')

        // Check code uniqueness if changing
        const newCode = parsed.code?.trim()
        if (newCode && newCode !== existing.code) {
            const [duplicate] = await db
                .select({ id: suppliers.id })
                .from(suppliers)
                .where(and(
                    eq(suppliers.organizationId, orgId),
                    eq(suppliers.code, newCode)
                ))
                .limit(1)
            if (duplicate) return errors.badRequest(c, 'Kode pemasok sudah digunakan')
        }

        // Build updates
        const updates: any = {}
        
        if (parsed.name !== undefined) updates.name = parsed.name.trim()
        if (newCode !== undefined) updates.code = newCode || null
        if (parsed.contactName !== undefined) updates.contactName = parsed.contactName?.trim() || null
        if (parsed.email !== undefined) updates.email = parsed.email?.trim() || null
        if (parsed.phone !== undefined) updates.phone = parsed.phone?.trim() || null
        if (parsed.address !== undefined) updates.address = parsed.address?.trim() || null
        if (parsed.city !== undefined) updates.city = parsed.city?.trim() || null
        if (parsed.province !== undefined) updates.province = parsed.province?.trim() || null
        if (parsed.postalCode !== undefined) updates.postalCode = parsed.postalCode?.trim() || null
        if (parsed.bankName !== undefined) updates.bankName = parsed.bankName?.trim() || null
        if (parsed.bankAccountNumber !== undefined) updates.bankAccountNumber = parsed.bankAccountNumber?.trim() || null
        if (parsed.bankAccountName !== undefined) updates.bankAccountName = parsed.bankAccountName?.trim() || null
        if (parsed.notes !== undefined) updates.notes = parsed.notes?.trim() || null
        if (parsed.isActive !== undefined) updates.isActive = parsed.isActive

        const [updated] = await db
            .update(suppliers)
            .set(updates)
            .where(and(
                eq(suppliers.id, supplierId),
                eq(suppliers.organizationId, orgId)
            ))
            .returning()

        return ok(c, {
            id: updated.id,
            name: updated.name,
            code: updated.code,
            contactName: updated.contactName,
            email: updated.email,
            phone: updated.phone,
            isActive: updated.isActive,
            updatedAt: updated.updatedAt,
        })
    } catch (err: any) {
        console.error('[suppliers/update]', err)
        return errors.internal(c)
    }
})

// DELETE /api/dashboard/suppliers/:id
// Delete supplier
suppliersRouter.delete('/:id', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)
        const supplierId = c.req.param('id')

        // Check supplier exists
        const [existing] = await db
            .select({ id: suppliers.id })
            .from(suppliers)
            .where(and(
                eq(suppliers.id, supplierId),
                eq(suppliers.organizationId, orgId)
            ))
            .limit(1)

        if (!existing) return errors.notFound(c, 'Pemasok tidak ditemukan')

        // Check if supplier has products
        const [{ count: productCount }] = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(and(
                eq(products.supplierId, supplierId),
                eq(products.organizationId, orgId)
            ))

        if (productCount > 0) {
            return errors.badRequest(c, 'Tidak dapat menghapus pemasok yang memiliki produk. Silakan hapus atau pindahkan produk terlebih dahulu.')
        }

        // Delete supplier
        await db
            .delete(suppliers)
            .where(and(
                eq(suppliers.id, supplierId),
                eq(suppliers.organizationId, orgId)
            ))

        return ok(c, { deleted: true })
    } catch (err: any) {
        console.error('[suppliers/delete]', err)
        return errors.internal(c)
    }
})

// GET /api/dashboard/suppliers/cities
// Get all unique cities for filter
suppliersRouter.get('/cities', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const orgId = await getOrgId(c)

        const rows = await db
            .selectDistinct({
                city: suppliers.city,
            })
            .from(suppliers)
            .where(and(
                eq(suppliers.organizationId, orgId),
                sql`${suppliers.city} IS NOT NULL`
            ))
            .orderBy(asc(suppliers.city))

        return ok(c, { 
            data: rows.map((r: any) => r.city).filter(Boolean) 
        })
    } catch (err: any) {
        console.error('[suppliers/cities]', err)
        return errors.internal(c)
    }
})
