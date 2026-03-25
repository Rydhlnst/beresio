import { Hono } from 'hono'
import { and, asc, eq } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { errors, ok } from '../lib/errors'
import { getUserId } from '../lib/auth-context'
import {
    member,
    organization,
    rolePermissions,
    roles,
} from '@beresio/db'

type Bindings = { DATABASE_URL: string; BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }
type Variables = { db: any; user: any; session: any }

type NavItem = {
    id: string
    label: string
    icon: string
    path: string
    badge?: string | null
    submenu?: NavItem[]
    permissionsAny?: string[]
}

const NAV_REGISTRY: Record<string, Record<string, NavItem>> = {
    laundry: {
        dashboard: {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'layout-dashboard',
            path: '/dashboard',
            permissionsAny: ['dashboard.read'],
        },
        crm: {
            id: 'crm',
            label: 'Pelanggan',
            icon: 'heart-handshake',
            path: '/crm',
            submenu: [
                { id: 'customers', label: 'Daftar Pelanggan', icon: 'users', path: '/crm', permissionsAny: ['crm.read'] },
                { id: 'tags', label: 'Tags', icon: 'tags', path: '/crm/tags', permissionsAny: ['crm.manage'] },
            ],
            permissionsAny: ['crm.read', 'crm.manage'],
        },
        order: {
            id: 'order',
            label: 'Order Cucian',
            icon: 'basket',
            path: '/order',
            submenu: [
                { id: 'create', label: 'Tambah Order', icon: 'plus', path: '/order/create', permissionsAny: ['order.create'] },
                { id: 'list', label: 'Daftar Order', icon: 'list', path: '/order', permissionsAny: ['order.read'] },
            ],
            permissionsAny: ['order.read', 'order.create'],
        },
        pickup: {
            id: 'pickup',
            label: 'Pickup',
            icon: 'truck',
            path: '/pickup',
            permissionsAny: ['pickup.read', 'pickup.manage'],
        },
        inventory: {
            id: 'inventory',
            label: 'Inventory',
            icon: 'box',
            path: '/inventory',
            permissionsAny: ['inventory.read', 'inventory.manage'],
        },
        laporan: {
            id: 'laporan',
            label: 'Laporan',
            icon: 'chart',
            path: '/laporan',
            permissionsAny: ['report.read'],
        },
        cabang: {
            id: 'cabang',
            label: 'Cabang',
            icon: 'building',
            path: '/cabang',
            permissionsAny: ['branch.read', 'branch.manage'],
        },
        tim: {
            id: 'tim',
            label: 'Tim',
            icon: 'users',
            path: '/tim',
            submenu: [
                { id: 'members', label: 'Anggota Tim', icon: 'users', path: '/tim', permissionsAny: ['team.read'] },
                { id: 'roles', label: 'Role & Akses', icon: 'shield', path: '/tim/roles', permissionsAny: ['team.manage'] },
            ],
            permissionsAny: ['team.read', 'team.manage'],
        },
        pengaturan: {
            id: 'pengaturan',
            label: 'Pengaturan',
            icon: 'settings',
            path: '/pengaturan',
            permissionsAny: ['settings.read', 'settings.manage'],
        },
    },
    fnb: {
        dashboard: {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'layout-dashboard',
            path: '/dashboard',
            permissionsAny: ['dashboard.read'],
        },
        crm: {
            id: 'crm',
            label: 'Pelanggan',
            icon: 'heart-handshake',
            path: '/crm',
            submenu: [
                { id: 'customers', label: 'Daftar Pelanggan', icon: 'users', path: '/crm', permissionsAny: ['crm.read'] },
                { id: 'tags', label: 'Tags', icon: 'tags', path: '/crm/tags', permissionsAny: ['crm.manage'] },
            ],
            permissionsAny: ['crm.read', 'crm.manage'],
        },
        order: {
            id: 'order',
            label: 'Order',
            icon: 'basket',
            path: '/order',
            permissionsAny: ['order.read', 'order.create'],
        },
        inventory: {
            id: 'inventory',
            label: 'Inventory',
            icon: 'box',
            path: '/inventory',
            permissionsAny: ['inventory.read', 'inventory.manage'],
        },
        laporan: {
            id: 'laporan',
            label: 'Laporan',
            icon: 'chart',
            path: '/laporan',
            permissionsAny: ['report.read'],
        },
        cabang: {
            id: 'cabang',
            label: 'Cabang',
            icon: 'building',
            path: '/cabang',
            permissionsAny: ['branch.read', 'branch.manage'],
        },
        tim: {
            id: 'tim',
            label: 'Tim',
            icon: 'users',
            path: '/tim',
            permissionsAny: ['team.read', 'team.manage'],
        },
        pengaturan: {
            id: 'pengaturan',
            label: 'Pengaturan',
            icon: 'settings',
            path: '/pengaturan',
            permissionsAny: ['settings.read', 'settings.manage'],
        },
        meja: {
            id: 'meja',
            label: 'Manajemen Meja',
            icon: 'grid',
            path: '/meja',
            permissionsAny: ['tables.read', 'tables.manage'],
        },
        menu: {
            id: 'menu',
            label: 'Menu & Resep',
            icon: 'book-open',
            path: '/menu',
            permissionsAny: ['menu.read', 'menu.manage'],
        },
    },
    retail: {
        dashboard: {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'layout-dashboard',
            path: '/dashboard',
            permissionsAny: ['dashboard.read'],
        },
        crm: {
            id: 'crm',
            label: 'Pelanggan',
            icon: 'heart-handshake',
            path: '/crm',
            submenu: [
                { id: 'customers', label: 'Daftar Pelanggan', icon: 'users', path: '/crm', permissionsAny: ['crm.read'] },
                { id: 'tags', label: 'Tags', icon: 'tags', path: '/crm/tags', permissionsAny: ['crm.manage'] },
            ],
            permissionsAny: ['crm.read', 'crm.manage'],
        },
        order: {
            id: 'order',
            label: 'Order',
            icon: 'basket',
            path: '/order',
            permissionsAny: ['order.read', 'order.create'],
        },
        inventory: {
            id: 'inventory',
            label: 'Inventory',
            icon: 'box',
            path: '/inventory',
            permissionsAny: ['inventory.read', 'inventory.manage'],
        },
        laporan: {
            id: 'laporan',
            label: 'Laporan',
            icon: 'chart',
            path: '/laporan',
            permissionsAny: ['report.read'],
        },
        cabang: {
            id: 'cabang',
            label: 'Cabang',
            icon: 'building',
            path: '/cabang',
            permissionsAny: ['branch.read', 'branch.manage'],
        },
        tim: {
            id: 'tim',
            label: 'Tim',
            icon: 'users',
            path: '/tim',
            permissionsAny: ['team.read', 'team.manage'],
        },
        pengaturan: {
            id: 'pengaturan',
            label: 'Pengaturan',
            icon: 'settings',
            path: '/pengaturan',
            permissionsAny: ['settings.read', 'settings.manage'],
        },
        products: {
            id: 'products',
            label: 'Katalog Produk',
            icon: 'box',
            path: '/products',
            permissionsAny: ['products.read', 'products.manage'],
        },
        suppliers: {
            id: 'suppliers',
            label: 'Pemasok',
            icon: 'users',
            path: '/suppliers',
            permissionsAny: ['suppliers.read', 'suppliers.manage'],
        },
    },
}

// ============================================
// BASE MODULES - Common to ALL business types
// ============================================
const BASE_MODULES = [
    'dashboard',
    'crm',
    'order',
    'inventory',
    'laporan',
    'cabang',
    'tim',
    'pengaturan',
] as const

// ============================================
// VERTICAL MODULES - Business type specific
// ============================================
const VERTICAL_MODULES_BY_TYPE: Record<string, string[]> = {
    laundry: ['pickup'],
    fnb: ['meja', 'menu'],
    retail: ['products', 'suppliers'],
}

const BUSINESS_TYPE_ALIASES: Record<string, keyof typeof NAV_REGISTRY> = {
    caffe: 'fnb',
    food: 'fnb',
    service: 'retail',
    other: 'retail',
}

function normalizeBusinessType(input: string | null | undefined): keyof typeof NAV_REGISTRY {
    if (input && input in NAV_REGISTRY) return input as keyof typeof NAV_REGISTRY
    if (input && input in BUSINESS_TYPE_ALIASES) return BUSINESS_TYPE_ALIASES[input]
    return 'retail'
}

function hasAnyPermission(item: NavItem, permissions: string[]) {
    if (permissions.length === 0) return true
    if (!item.permissionsAny || item.permissionsAny.length === 0) return true
    return item.permissionsAny.some((perm) => permissions.includes(perm))
}

function toFallbackLabel(key: string) {
    return key
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const businessesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/businesses/:id/navigation
businessesRouter.get('/:id/navigation', authMiddleware, async (c) => {
    try {
        const db = c.get('db')
        const businessId = c.req.param('id')
        const userId = getUserId(c)

        const [membership] = await db
            .select({
                id: member.id,
                roleId: member.roleId,
                roleLegacy: member.role,
            })
            .from(member)
            .where(and(eq(member.organizationId, businessId), eq(member.userId, userId)))
            .limit(1)

        if (!membership) {
            return errors.forbidden(c, 'No access to this business')
        }

        const [orgRow] = await db
            .select({
                id: organization.id,
                name: organization.name,
                businessType: organization.businessType,
                metadata: organization.metadata,
            })
            .from(organization)
            .where(eq(organization.id, businessId))
            .limit(1)

        if (!orgRow) {
            return errors.notFound(c, 'Business not found')
        }

        let config: Record<string, any> = {}
        if (orgRow.metadata) {
            try {
                config = JSON.parse(orgRow.metadata)
            } catch {
                config = {}
            }
        }

        let roleId: string | null = membership.roleId ?? null
        if (!roleId && membership.roleLegacy) {
            const [roleRow] = await db
                .select({ id: roles.id })
                .from(roles)
                .where(and(eq(roles.organizationId, businessId), eq(roles.slug, membership.roleLegacy)))
                .limit(1)
            roleId = roleRow?.id ?? null
        }

        const permissionsRows = roleId
            ? await db
                .select({ permission: rolePermissions.permission })
                .from(rolePermissions)
                .where(eq(rolePermissions.roleId, roleId))
            : []

        const permissions = permissionsRows.map((row: any) => row.permission)

        const normalizedType = normalizeBusinessType(orgRow.businessType)
        const registry = NAV_REGISTRY[normalizedType] ?? {}
        
        // Gabungkan base modules + vertical modules untuk business type ini
        const verticalModules = VERTICAL_MODULES_BY_TYPE[normalizedType] ?? []
        const allModuleKeys = [...BASE_MODULES, ...verticalModules]
        
        // Filter hanya modul yang tersedia di registry
        const availableModuleKeys = allModuleKeys.filter((key) => key in registry)
        
        // Pisahkan base dan vertical
        const isBaseKey = (key: string) => BASE_MODULES.includes(key as any)
        const baseModuleKeys = availableModuleKeys.filter(isBaseKey)
        const verticalModuleKeys = availableModuleKeys.filter((key) => !isBaseKey(key))

        const mapToNav = (keys: string[]) => keys.map((key) => registry[key] ?? {
            id: key,
            label: toFallbackLabel(key),
            icon: 'grid',
            path: `/${key}`,
        })

        const applyPermissions = (items: NavItem[]) => items
            .map((item) => {
                if (!item.submenu) return item
                const submenu = item.submenu.filter((sub) => hasAnyPermission(sub, permissions))
                return { ...item, submenu }
            })
            .filter((item) => hasAnyPermission(item, permissions))

        const navigationBase = applyPermissions(mapToNav(baseModuleKeys))
        const navigationVertical = applyPermissions(mapToNav(verticalModuleKeys))
        const navigation: NavItem[] = [...navigationBase, ...navigationVertical]

        return ok(c, {
            business: {
                id: orgRow.id,
                name: orgRow.name,
                type: normalizedType,
                config,
            },
            navigationBase,
            navigationVertical,
            navigation,
            permissions,
        })
    } catch (err: any) {
        console.error('[businesses/navigation]', err)
        return errors.internal(c, err.message)
    }
})
