/**
 * TypeScript Types for Multi-Business Support
 * 
 * This file contains type definitions for:
 * - Business configuration
 * - Navigation items
 * - Business modules
 * - User business access
 */

// ============================================
// Enums
// ============================================

/**
 * Business Type Enum
 */
export type BusinessType = 'laundry' | 'fnb' | 'retail';

/**
 * Module Keys - Available modules per business type
 */
export type ModuleKey = 
    | 'laundry'
    | 'dashboard'
    | 'crm'
    | 'order'
    | 'inventory'
    | 'laporan'
    | 'cabang'
    | 'tim'
    | 'pengaturan'
    | 'pickup'
    | 'meja'
    | 'menu'
    | 'products'
    | 'suppliers';

/**
 * User Role in Business
 */
export type BusinessRole = 'owner' | 'admin' | 'staff' | 'viewer';

// ============================================
// Business Configuration Types
// ============================================

/**
 * Business Settings
 */
export interface BusinessSettings {
    currency?: string;
    timezone?: string;
    taxRate?: number;
    language?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
    };
    customFields?: Record<string, unknown>;
}

/**
 * Business Configuration
 * Main configuration object for a business
 */
export interface BusinessConfig {
    /** Business unique identifier */
    id: string;
    /** Reference to organization (for auth/team) */
    organizationId?: string;
    /** Business display name */
    name: string;
    /** URL-friendly slug */
    slug: string;
    /** Business type classification */
    businessType: BusinessType;
    /** Business description */
    description?: string;
    /** Logo URL */
    logoUrl?: string;
    /** Contact phone */
    phone?: string;
    /** Contact email */
    email?: string;
    /** Business address */
    address?: string;
    /** Is business active */
    isActive: boolean;
    /** Business-specific settings */
    settings: BusinessSettings;
    /** Active modules for this business */
    modules: BusinessModule[];
    /** Creation timestamp */
    createdAt: Date | string;
    /** Last update timestamp */
    updatedAt: Date | string;
}

// ============================================
// Navigation Types
// ============================================

/**
 * Navigation Item Icon
 * Supports Lucide icon names
 */
export type NavIcon = 
    | 'ShoppingCart' 
    | 'MapPin' 
    | 'Package' 
    | 'Users' 
    | 'BarChart3'
    | 'CreditCard'
    | 'UserCog'
    | 'LineChart'
    | 'Tag'
    | 'Settings'
    | 'Home'
    | 'LayoutDashboard'
    | 'FileText'
    | 'HelpCircle';

/**
 * Navigation Item
 * Used for sidebar/menu navigation
 */
export interface NavItem {
    /** Unique key for the nav item */
    key: string;
    /** Display label */
    label: string;
    /** Icon name (Lucide) */
    icon: NavIcon;
    /** Route path */
    href: string;
    /** Display order */
    order: number;
    /** Is item active/visible */
    isActive: boolean;
    /** Required module key (for permission check) */
    moduleKey?: ModuleKey;
    /** Child items (for nested navigation) */
    children?: NavItem[];
    /** Badge count (for notifications) */
    badge?: number;
    /** Required role to access */
    requiredRole?: BusinessRole[];
}

/**
 * Navigation Configuration
 * Complete navigation structure for a business
 */
export interface NavConfig {
    /** Business ID */
    businessId: string;
    /** Business type (affects available items) */
    businessType: BusinessType;
    /** Top-level navigation items */
    items: NavItem[];
    /** Footer/quick actions */
    quickActions?: NavItem[];
}

// ============================================
// Business Module Types
// ============================================

/**
 * Module Settings
 * Module-specific configuration
 */
export interface ModuleSettings {
    icon?: NavIcon;
    defaultView?: string;
    enableNotifications?: boolean;
    lowStockAlert?: boolean;
    enableLoyalty?: boolean;
    defaultPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    [key: string]: unknown;
}

/**
 * Business Module
 * Represents an active module in a business
 */
export interface BusinessModule {
    /** Module unique identifier */
    id: string;
    /** Reference to business */
    businessId: string;
    /** Module key identifier */
    moduleKey: ModuleKey;
    /** Display name */
    moduleName: string;
    /** Is module active */
    isActive: boolean;
    /** Module settings */
    settings: ModuleSettings;
    /** Display order */
    displayOrder: number;
    /** Creation timestamp */
    createdAt: Date | string;
    /** Last update timestamp */
    updatedAt: Date | string;
}

// ============================================
// User Access Types
// ============================================

/**
 * User Business Access
 * Maps user to business with role
 */
export interface UserBusinessAccess {
    /** Access record ID */
    id: string;
    /** User ID */
    userId: string;
    /** Business ID */
    businessId: string;
    /** User role in this business */
    role: BusinessRole;
    /** Is this the currently active business for user */
    isCurrentActive: boolean;
    /** Creation timestamp */
    createdAt: Date | string;
    /** Last update timestamp */
    updatedAt: Date | string;
}

/**
 * User with Business Context
 * Extended user type with business access info
 */
export interface UserWithBusinessContext {
    userId: string;
    email: string;
    name?: string;
    /** All accessible businesses */
    businesses: {
        businessId: string;
        businessName: string;
        businessType: BusinessType;
        role: BusinessRole;
        isCurrentActive: boolean;
    }[];
    /** Currently active business */
    currentBusiness?: {
        businessId: string;
        businessName: string;
        businessType: BusinessType;
        role: BusinessRole;
    };
}

// ============================================
// API Response Types
// ============================================

/**
 * Business Modules Query Result
 * Response type for: SELECT * FROM business_modules WHERE business_id = 'xxx'
 */
export interface BusinessModulesQueryResult {
    modules: BusinessModule[];
    businessType: BusinessType;
}

/**
 * Business List Response
 */
export interface BusinessListResponse {
    businesses: BusinessConfig[];
    total: number;
}

/**
 * Module Config By Business Type
 * Predefined modules for each business type
 */
export interface ModuleConfigByBusinessType {
    laundry: ModuleKey[];
    fnb: ModuleKey[];
    retail: ModuleKey[];
}

/**
 * Default modules for each business type
 */
export const DEFAULT_MODULES_BY_TYPE: ModuleConfigByBusinessType = {
    laundry: ['dashboard', 'laundry', 'crm', 'order', 'inventory', 'laporan', 'cabang', 'tim', 'pengaturan', 'pickup'],
    fnb: ['dashboard', 'crm', 'order', 'inventory', 'laporan', 'cabang', 'tim', 'pengaturan', 'meja', 'menu'],
    retail: ['dashboard', 'crm', 'order', 'inventory', 'laporan', 'cabang', 'tim', 'pengaturan', 'products', 'suppliers'],
};

// ============================================
// Database Schema Types (Drizzle InferType helpers)
// ============================================

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// These would be used with the actual table schemas
// Example: export type Business = InferSelectModel<typeof businesses>;
// Example: export type NewBusiness = InferInsertModel<typeof businesses>;

/**
 * Business Type guard
 */
export function isValidBusinessType(type: string): type is BusinessType {
    return ['laundry', 'fnb', 'retail'].includes(type);
}

/**
 * Module Key guard
 */
export function isValidModuleKey(key: string): key is ModuleKey {
    return [
        'laundry',
        'dashboard', 'crm', 'order', 'inventory', 'laporan',
        'cabang', 'tim', 'pengaturan', 'pickup', 'meja',
        'menu', 'products', 'suppliers'
    ].includes(key);
}

// ============================================
// FnB Domain Event Contract
// ============================================

export const FNB_DOMAIN_EVENT_TYPES = [
    "ORDER_CREATED",
    "ORDER_CONFIRMED",
    "ORDER_PREPARING",
    "ORDER_READY",
    "ORDER_COMPLETED",
    "PAYMENT_SETTLED",
    "TABLE_SESSION_OPENED",
    "TABLE_SESSION_CLOSED",
] as const;

export type FnbDomainEventType = typeof FNB_DOMAIN_EVENT_TYPES[number];

export interface DomainEventEnvelope {
    eventId: string;
    sequence: number;
    organizationId: string;
    branchId: string | null;
    aggregateType: "order" | "table_session" | "payment";
    aggregateId: string;
    eventType: FnbDomainEventType;
    occurredAt: Date;
    actorId: string | null;
    idempotencyKey: string | null;
    payload: Record<string, unknown>;
}
