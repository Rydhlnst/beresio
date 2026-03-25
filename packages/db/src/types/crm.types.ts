import { z } from "zod";

/**
 * Customer Types
 */
export const genderEnum = z.enum(["male", "female", "other"]);
export const customerStatusEnum = z.enum(["active", "inactive", "vip"]);
export const customerInteractionTypeEnum = z.enum([
    "call",
    "visit",
    "order",
    "complaint",
    "feedback",
    "other",
]);

export const customerSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string(),
    name: z.string().min(1).max(150),
    phone: z.string().min(1).max(20),
    email: z.string().email().optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    birthDate: z.date().optional().nullable(),
    gender: genderEnum.optional().nullable(),
    source: z.string().max(50).optional().nullable(),
    status: customerStatusEnum.default("active"),
    loyaltyPoints: z.number().default(0),
    loyaltyTier: z.string().max(20).default("regular"),
    totalSpentRp: z.number().default(0),
    preferences: z.record(z.any()).optional().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Customer = z.infer<typeof customerSchema>;

/**
 * Customer Tag Types
 */
export const customerTagSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string(),
    name: z.string().min(1).max(80),
    slug: z.string().min(1).max(80),
    color: z.string().max(24).optional().nullable(),
    createdAt: z.date(),
});

export type CustomerTag = z.infer<typeof customerTagSchema>;

/**
 * Customer Note Types
 */
export const customerNoteSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string(),
    customerId: z.string().uuid(),
    note: z.string().min(1),
    createdBy: z.string().optional().nullable(),
    createdAt: z.date(),
});

export type CustomerNote = z.infer<typeof customerNoteSchema>;

/**
 * Customer Interaction Types
 */
export const customerInteractionSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string(),
    customerId: z.string().uuid(),
    type: customerInteractionTypeEnum,
    notes: z.string().min(1),
    metadata: z.record(z.any()).optional().nullable(),
    createdBy: z.string().optional().nullable(),
    createdAt: z.date(),
});

export type CustomerInteraction = z.infer<typeof customerInteractionSchema>;

/**
 * Customer Analytics Types
 */
export const customerAnalyticsSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string(),
    customerId: z.string().uuid(),
    totalOrders: z.number().default(0),
    totalSpent: z.number().default(0),
    averageOrderValue: z.number().default(0),
    lastOrderAt: z.date().optional().nullable(),
    firstOrderAt: z.date().optional().nullable(),
    orderFrequencyDays: z.number().optional().nullable(),
    totalInteractions: z.number().default(0),
    lastInteractionAt: z.date().optional().nullable(),
    updatedAt: z.date(),
});

export type CustomerAnalytics = z.infer<typeof customerAnalyticsSchema>;

/**
 * Extended Types with Relations
 */
export type CustomerWithTags = Customer & {
    tags?: CustomerTag[];
};

export type CustomerWithDetails = Customer & {
    tags?: CustomerTag[];
    notes?: CustomerNote[];
    interactions?: CustomerInteraction[];
    analytics?: CustomerAnalytics | null;
};

/**
 * Input Validation Schemas
 */
export const createCustomerSchema = z.object({
    name: z.string().min(1).max(150),
    phone: z.string().min(1).max(20),
    email: z.string().email().optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    birthDate: z.string().datetime().or(z.date()).optional().nullable(),
    gender: genderEnum.optional().nullable(),
    source: z.string().max(50).optional().nullable(),
    status: customerStatusEnum.optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    preferences: z.record(z.any()).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial();

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const createCustomerTagSchema = z.object({
    name: z.string().min(1).max(80),
    slug: z.string().min(1).max(80),
    color: z.string().max(24).optional(),
});

export type CreateCustomerTagInput = z.infer<typeof createCustomerTagSchema>;

export const updateCustomerTagSchema = createCustomerTagSchema.partial();

export type UpdateCustomerTagInput = z.infer<typeof updateCustomerTagSchema>;

export const createCustomerNoteSchema = z.object({
    note: z.string().min(1),
});

export type CreateCustomerNoteInput = z.infer<typeof createCustomerNoteSchema>;

export const createCustomerInteractionSchema = z.object({
    type: customerInteractionTypeEnum,
    notes: z.string().min(1),
    metadata: z.record(z.any()).optional(),
});

export type CreateCustomerInteractionInput = z.infer<typeof createCustomerInteractionSchema>;

/**
 * Query Parameter Schemas
 */
export const listCustomersQuerySchema = z.object({
    page: z.string().transform(Number).default("1"),
    limit: z.string().transform(Number).default("25"),
    search: z.string().optional(),
    tagId: z.string().uuid().optional(),
    status: customerStatusEnum.optional(),
    sortBy: z.enum(["name", "createdAt", "totalSpentRp", "lastOrderAt"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

/**
 * Response Types
 */
export type PaginationMeta = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type PaginatedResponse<T> = {
    data: T[];
    meta: PaginationMeta;
};

export type CRMOverviewAnalytics = {
    totalCustomers: number;
    newCustomersThisMonth: number;
    activeCustomers: number;
    vipCustomers: number;
    inactiveCustomers: number;
    averageLifetimeValue: number;
    topCustomers: Array<{
        id: string;
        name: string;
        totalSpent: number;
        totalOrders: number;
    }>;
};

export type CustomerDetailAnalytics = {
    customer: CustomerWithDetails;
    analytics: CustomerAnalytics | null;
    recentOrders: Array<{
        id: string;
        orderNumber: string;
        total: number;
        status: string;
        createdAt: Date;
    }>;
    interactionHistory: CustomerInteraction[];
};
