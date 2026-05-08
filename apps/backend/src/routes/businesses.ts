import { Hono } from 'hono'
import { and, asc, eq } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'
import { errors, ok } from '../lib/errors'
import { getUserId } from '../lib/auth-context'
import { parseJsonRecord } from '../lib/safe-json'
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

type RoleInfo = {
    id: string
    slug: string
    name: string
}

type NavigationPayload = {
    business: {
        id: string
        name: string
        type: string
        mode?: string | null
        config: Record<string, unknown>
    }
    role: RoleInfo | null
    navigationBase: NavItem[]
    navigationVertical: NavItem[]
    navigation: NavItem[]
    permissions: string[]
}

const NAVIGATION_CACHE_TTL_MS = 30_000
const navigationCache = new Map<string, { expiresAt: number; payload: NavigationPayload }>()

export function clearNavigationCacheForTests() {
    navigationCache.clear()
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
            label: 'Pelanggan Laundry',
            icon: 'heart-handshake',
            path: '/laundry/customers',
            submenu: [
                { id: 'customers', label: 'Daftar Pelanggan Laundry', icon: 'users', path: '/laundry/customers', permissionsAny: ['crm.read', 'order.read'] },
                { id: 'tags', label: 'Tags', icon: 'tags', path: '/crm/tags', permissionsAny: ['crm.manage'] },
            ],
            permissionsAny: ['crm.read', 'crm.manage', 'order.read'],
        },
        order: {
            id: 'order',
            label: 'Order Cucian',
            icon: 'basket',
            path: '/laundry/orders',
            submenu: [
                { id: 'overview', label: 'Ringkasan Laundry', icon: 'layout-dashboard', path: '/laundry', permissionsAny: ['order.read', 'report.read'] },
                { id: 'create', label: 'Tambah Order', icon: 'plus', path: '/laundry/orders/new', permissionsAny: ['order.create'] },
                { id: 'list', label: 'Daftar Order', icon: 'list', path: '/laundry/orders', permissionsAny: ['order.read'] },
                { id: 'services', label: 'Layanan', icon: 'box', path: '/laundry/services', permissionsAny: ['laundry.service.manage', 'order.read'] },
            ],
            permissionsAny: ['order.read', 'order.create'],
        },
        pickup: {
            id: 'pickup',
            label: 'Pickup Laundry',
            icon: 'truck',
            path: '/laundry/orders',
            permissionsAny: ['pickup.read', 'pickup.manage'],
        },
        inventory: {
            id: 'inventory',
            label: 'Inventory Laundry',
            icon: 'box',
            path: '/inventory',
            permissionsAny: ['inventory.read', 'inventory.manage'],
        },
        laporan: {
            id: 'laporan',
            label: 'Laporan Laundry',
            icon: 'chart',
            path: '/laundry/reports',
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
            label: 'Pelanggan F&B',
            icon: 'heart-handshake',
            path: '/crm',
            submenu: [
                { id: 'customers', label: 'Daftar Pelanggan F&B', icon: 'users', path: '/crm', permissionsAny: ['crm.read'] },
                { id: 'tags', label: 'Tags', icon: 'tags', path: '/crm/tags', permissionsAny: ['crm.manage'] },
            ],
            permissionsAny: ['crm.read', 'crm.manage'],
        },
        order: {
            id: 'order',
            label: 'Order F&B',
            icon: 'basket',
            path: '/order',
            permissionsAny: ['order.read', 'order.create', 'order.manage'],
        },
        inventory: {
            id: 'inventory',
            label: 'Inventory F&B',
            icon: 'box',
            path: '/inventory',
            permissionsAny: ['inventory.read', 'inventory.manage'],
        },
        laporan: {
            id: 'laporan',
            label: 'Laporan F&B',
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
            label: 'Pelanggan Retail',
            icon: 'heart-handshake',
            path: '/crm',
            submenu: [
                { id: 'customers', label: 'Daftar Pelanggan Retail', icon: 'users', path: '/crm', permissionsAny: ['crm.read'] },
                { id: 'tags', label: 'Tags', icon: 'tags', path: '/crm/tags', permissionsAny: ['crm.manage'] },
            ],
            permissionsAny: ['crm.read', 'crm.manage'],
        },
        order: {
            id: 'order',
            label: 'Order Retail',
            icon: 'basket',
            path: '/order',
            permissionsAny: ['order.read', 'order.create'],
        },
        inventory: {
            id: 'inventory',
            label: 'Inventory Retail',
            icon: 'box',
            path: '/inventory',
            permissionsAny: ['inventory.read', 'inventory.manage'],
        },
        laporan: {
            id: 'laporan',
            label: 'Laporan Retail',
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
    'cabang',
    'tim',
    'pengaturan',
] as const

// ============================================
// VERTICAL MODULES - Business type specific
// ============================================
const VERTICAL_MODULES_BY_TYPE: Record<string, string[]> = {
    laundry: ['crm', 'order', 'inventory', 'laporan', 'pickup'],
    fnb: ['crm', 'order', 'inventory', 'laporan', 'meja', 'menu'],
    retail: ['crm', 'order', 'inventory', 'laporan', 'products', 'suppliers'],
}

const BUSINESS_TYPE_ALIASES: Record<string, keyof typeof NAV_REGISTRY> = {
    caffe: 'fnb',
    food: 'fnb',
    service: 'retail',
    other: 'retail',
}

const PRIVILEGED_LAUNDRY_ROLE_SLUGS = new Set(['owner', 'admin', 'branch_manager'])
const IMPLIED_LAUNDRY_BASE_PERMISSIONS = ['dashboard.read', 'branch.read', 'team.read', 'settings.read']
const IMPLIED_LAUNDRY_SINGLE_TENANT_MANAGEMENT_PERMISSIONS = [
    'crm.read',
    'order.read',
    'order.create',
    'inventory.read',
    'report.read',
    'pickup.read',
    'laundry.service.manage',
]

function normalizeBusinessType(input: string | null | undefined): keyof typeof NAV_REGISTRY {
    if (input && input in NAV_REGISTRY) return input as keyof typeof NAV_REGISTRY
    if (input && Object.prototype.hasOwnProperty.call(BUSINESS_TYPE_ALIASES, input)) {
        return BUSINESS_TYPE_ALIASES[input as keyof typeof BUSINESS_TYPE_ALIASES] ?? 'retail'
    }
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
        const cacheKey = `${businessId}:${userId}`
        const cached = navigationCache.get(cacheKey)
        if (cached && cached.expiresAt > Date.now()) {
            return ok(c, cached.payload)
        }

        const [membership] = await db
            .select({
                id: member.id,
                roleId: member.roleId,
                roleLegacy: member.role,
                roleSlug: roles.slug,
                roleName: roles.name,
            })
            .from(member)
            .leftJoin(roles, eq(member.roleId, roles.id))
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
                mode: organization.mode,
                metadata: organization.metadata,
            })
            .from(organization)
            .where(eq(organization.id, businessId))
            .limit(1)

        if (!orgRow) {
            return errors.notFound(c, 'Business not found')
        }

        const config = parseJsonRecord(orgRow.metadata)

        let roleId: string | null = membership.roleId ?? null
        let role: RoleInfo | null =
            roleId && membership.roleSlug
                ? {
                    id: roleId,
                    slug: membership.roleSlug,
                    name: membership.roleName ?? toFallbackLabel(membership.roleSlug),
                }
                : null
        if (!roleId && membership.roleLegacy) {
            const [roleRow] = await db
                .select({ id: roles.id, slug: roles.slug, name: roles.name })
                .from(roles)
                .where(and(eq(roles.organizationId, businessId), eq(roles.slug, membership.roleLegacy)))
                .limit(1)
            roleId = roleRow?.id ?? null
            if (roleRow) {
                role = roleRow as RoleInfo
            }
        }

        const permissionsRows = roleId
            ? await db
                .select({ permission: rolePermissions.permission })
                .from(rolePermissions)
                .where(eq(rolePermissions.roleId, roleId))
            : []

        const permissions = permissionsRows
            .map((row: { permission?: string }) => row.permission)
            .filter((permission: string | undefined): permission is string => typeof permission === 'string')

        if (!role && membership.roleLegacy) {
            role = {
                id: roleId ?? membership.roleLegacy,
                slug: membership.roleLegacy,
                name: toFallbackLabel(membership.roleLegacy),
            }
        }

        const normalizedType = normalizeBusinessType(orgRow.businessType)
        const roleSlug = (role?.slug ?? membership.roleLegacy ?? '').toLowerCase()
        const hasExplicitPermissions = permissions.length > 0
        const effectivePermissionsSet = new Set<string>(permissions)
        if (normalizedType === 'laundry' && PRIVILEGED_LAUNDRY_ROLE_SLUGS.has(roleSlug)) {
            for (const permission of IMPLIED_LAUNDRY_BASE_PERMISSIONS) {
                effectivePermissionsSet.add(permission)
            }

            // Single-tenant laundry organizations often start with legacy owner/admin roles
            // that have no role_permissions rows yet. Keep the management modules visible.
            if (orgRow.mode === 'single' && !hasExplicitPermissions && (roleSlug === 'owner' || roleSlug === 'admin')) {
                for (const permission of IMPLIED_LAUNDRY_SINGLE_TENANT_MANAGEMENT_PERMISSIONS) {
                    effectivePermissionsSet.add(permission)
                }
            }
        }
        const effectivePermissions = [...effectivePermissionsSet]
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
                const submenu = item.submenu.filter((sub) => hasAnyPermission(sub, effectivePermissions))
                return { ...item, submenu }
            })
            .filter((item) => hasAnyPermission(item, effectivePermissions))

        const navigationBase = applyPermissions(mapToNav(baseModuleKeys))
        const navigationVertical = applyPermissions(mapToNav(verticalModuleKeys))
        const navigation: NavItem[] = [...navigationBase, ...navigationVertical]

        const payload: NavigationPayload = {
            business: {
                id: orgRow.id,
                name: orgRow.name,
                type: normalizedType,
                mode: orgRow.mode,
                config,
            },
            role,
            navigationBase,
            navigationVertical,
            navigation,
            permissions: effectivePermissions,
        }

        navigationCache.set(cacheKey, {
            expiresAt: Date.now() + NAVIGATION_CACHE_TTL_MS,
            payload,
        })

        return ok(c, payload)
    } catch (err: any) {
        console.error('[businesses/navigation]', err)
        return errors.internal(c, err.message)
    }
})
