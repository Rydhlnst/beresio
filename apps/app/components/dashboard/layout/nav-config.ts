export type BusinessType = "laundry" | "fnb" | "retail";

export type BusinessNavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | null;
  submenu?: BusinessNavItem[];
};

export type BusinessNavResponse = {
  business: {
    id: string;
    name: string;
    type: BusinessType;
    mode?: "single" | "multi";
    config: Record<string, unknown>;
  };
  role?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  navigationBase?: BusinessNavItem[];
  navigationVertical?: BusinessNavItem[];
  navigation: BusinessNavItem[];
  permissions: string[];
};
