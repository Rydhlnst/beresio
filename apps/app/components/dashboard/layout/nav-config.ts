export type NavIconKey =
  | "layout-dashboard"
  | "package"
  | "receipt"
  | "bar-chart-3"
  | "users"
  | "git-branch"
  | "settings"
  | "truck";

export type NavItem = {
  key: string;
  label: string;
  iconKey: NavIconKey;
  href: string;
  roles: string[];
  verticals?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", roles: ["owner", "branch_manager"], href: "/dashboard", iconKey: "layout-dashboard" },
  { key: "order", label: "Order", roles: ["owner", "branch_manager", "cashier"], href: "/order", iconKey: "package" },
  { key: "inventory", label: "Inventory", roles: ["owner", "branch_manager"], href: "/inventory", iconKey: "receipt" },
  { key: "laporan", label: "Laporan", roles: ["owner"], href: "/laporan", iconKey: "bar-chart-3" },
  { key: "tim", label: "Tim & Akses", roles: ["owner"], href: "/tim", iconKey: "users" },
  { key: "cabang", label: "Cabang", roles: ["owner"], href: "/cabang", iconKey: "git-branch" },
  { key: "pengaturan", label: "Pengaturan", roles: ["owner", "branch_manager"], href: "/pengaturan", iconKey: "settings" },
  { key: "pickup", label: "Pickup & Delivery", roles: ["owner", "branch_manager"], verticals: ["laundry"], href: "/pickup", iconKey: "truck" },
];
