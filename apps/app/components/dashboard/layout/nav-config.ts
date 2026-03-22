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
    config: Record<string, unknown>;
  };
  navigationBase?: BusinessNavItem[];
  navigationVertical?: BusinessNavItem[];
  navigation: BusinessNavItem[];
  permissions: string[];
};
