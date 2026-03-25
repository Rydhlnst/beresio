export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  birthDate?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  source?: string | null;
  status: 'active' | 'inactive' | 'vip';
  loyaltyPoints: number;
  loyaltyTier: string;
  totalSpentRp: number;
  preferences?: Record<string, any> | null;
  tags?: CustomerTag[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithDetails extends Customer {
  notes: CustomerNote[];
  interactions: CustomerInteraction[];
  analytics: CustomerAnalytics | null;
}

export interface CustomerTag {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  createdAt: string;
}

export interface CustomerNote {
  id: string;
  note: string;
  createdAt: string;
  createdBy?: string | null;
}

export interface CustomerInteraction {
  id: string;
  type: 'call' | 'visit' | 'order' | 'complaint' | 'feedback' | 'other';
  notes: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface CustomerAnalytics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt?: string | null;
  firstOrderAt?: string | null;
  orderFrequencyDays?: number | null;
  totalInteractions: number;
  lastInteractionAt?: string | null;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedCustomers {
  data: (Customer & { analytics?: Partial<CustomerAnalytics>; tags: CustomerTag[] })[];
  meta: PaginationMeta;
}

export interface CRMOverviewAnalytics {
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
}
