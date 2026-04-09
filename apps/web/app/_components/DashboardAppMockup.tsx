import {
    Activity,
    Bell,
    Box,
    CircleDollarSign,
    LayoutDashboard,
    ListOrdered,
    MenuSquare,
    Search,
    UserRound,
    Users,
    UtensilsCrossed,
    Truck,
    Package,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";
import { BrowserMockup } from "./BrowserMockup";

export type DashboardTrend = "up" | "down" | "neutral";
export type DashboardPreviewMode = "default" | "compact";

export type DashboardStatIconKey = "revenue" | "orders" | "customers" | "branches" | "stock" | "drivers";
export type DashboardOrderStatus = "processing" | "ready" | "delivered";
export type DashboardNavIconKey =
    | "dashboard"
    | "pos"
    | "inventory"
    | "delivery"
    | "customers"
    | "reports";

export type DashboardStat = {
    label: string;
    value: string;
    change: string;
    trend: DashboardTrend;
    iconKey: DashboardStatIconKey;
};

export type DashboardOrder = {
    id: string;
    customer: string;
    amount: string;
    status: DashboardOrderStatus;
    time: string;
    branch: string;
};

export type DashboardBranch = {
    name: string;
    orders: number;
    revenue: string;
    fill: number;
};

export type DashboardNavItem = {
    label: string;
    iconKey: DashboardNavIconKey;
    active?: boolean;
};

export type DashboardAttentionItem = {
    title: string;
    detail: string;
};

export type DashboardOpsItem = {
    label: string;
    value: string;
};

export type DashboardAppMockupProps = {
    mode?: DashboardPreviewMode;
    className?: string;
    url?: string;
    title?: string;
    pageLabel?: string;
    dateLabel?: string;
    organizationName?: string;
    roleName?: string;
    ownerName?: string;
    ownerSummaryLabel?: string;
    greetingPrefix?: string;
    greetingDescription?: string;
    activeBranchLabel?: string;
    navItems?: DashboardNavItem[];
    verticalNavItems?: DashboardNavItem[];
    stats?: DashboardStat[];
    orders?: DashboardOrder[];
    branches?: DashboardBranch[];
    attentionItems?: DashboardAttentionItem[];
    operationsItems?: DashboardOpsItem[];
};

const NAV_ICONS: Record<DashboardNavIconKey, ComponentType<{ className?: string }>> = {
    dashboard: LayoutDashboard,
    pos: ListOrdered,
    inventory: Box,
    delivery: Activity,
    customers: Users,
    reports: MenuSquare,
};

const KPI_ICONS: Record<DashboardStatIconKey, ComponentType<{ className?: string }>> = {
    revenue: CircleDollarSign,
    orders: Box,
    customers: UserRound,
    branches: Activity,
    stock: Package,
    drivers: Truck,
};

const DEFAULT_NAV_ITEMS: DashboardNavItem[] = [
    { iconKey: "dashboard", label: "Dashboard", active: true },
    { iconKey: "customers", label: "Pelanggan" },
    { iconKey: "pos", label: "Order" },
    { iconKey: "inventory", label: "Inventory" },
    { iconKey: "reports", label: "Laporan" },
    { iconKey: "delivery", label: "Cabang" },
    { iconKey: "customers", label: "Tim" },
    { iconKey: "reports", label: "Pengaturan" },
];

const DEFAULT_VERTICAL_NAV_ITEMS: DashboardNavItem[] = [
    { iconKey: "dashboard", label: "Manajemen Meja" },
    { iconKey: "inventory", label: "Menu & Resep" },
];

const DEFAULT_STATS: DashboardStat[] = [
    { label: "OMZET HARI INI", value: "Rp 0", change: "vs kemarin", trend: "neutral", iconKey: "revenue" },
    { label: "PESANAN HARI INI", value: "0", change: "vs kemarin", trend: "neutral", iconKey: "orders" },
    { label: "PELANGGAN BARU", value: "0", change: "vs kemarin", trend: "neutral", iconKey: "customers" },
    { label: "CABANG AKTIF", value: "0/0", change: "vs kemarin", trend: "neutral", iconKey: "branches" },
];

const DEFAULT_ORDERS: DashboardOrder[] = [
    { id: "ORD-1014", customer: "Beres Kopi Pusat", amount: "Rp 85.000", status: "processing", time: "2 mnt lalu", branch: "Beres Pusat" },
    { id: "ORD-1013", customer: "Beres Fresh Brew", amount: "Rp 120.000", status: "ready", time: "9 mnt lalu", branch: "Beres Pusat" },
    { id: "ORD-1012", customer: "Beres Daily Hub", amount: "Rp 55.000", status: "delivered", time: "16 mnt lalu", branch: "Beres Pusat" },
];

const DEFAULT_BRANCHES: DashboardBranch[] = [
    { name: "Beres Pusat", orders: 0, revenue: "Rp 0", fill: 0 },
    { name: "Beres Raya", orders: 0, revenue: "Rp 0", fill: 0 },
    { name: "Beres Prima", orders: 0, revenue: "Rp 0", fill: 0 },
];

const DEFAULT_ATTENTION_ITEMS: DashboardAttentionItem[] = [
    { title: "Belum ada notifikasi kritis", detail: "Sistem akan menampilkan alert di sini." },
    { title: "Semua operasional normal", detail: "Tidak ada tindakan mendesak saat ini." },
];

const DEFAULT_OPS_ITEMS: DashboardOpsItem[] = [
    { label: "Antrian pickup", value: "0" },
    { label: "Pesanan diproses", value: "0" },
    { label: "SLA tepat waktu", value: "100%" },
];

function StatusBadge({ status }: { status: DashboardOrderStatus }) {
    if (status === "ready") {
        return <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Siap</span>;
    }
    if (status === "processing") {
        return <span className="rounded-full border border-amber-500/30 bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Diproses</span>;
    }
    return <span className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Selesai</span>;
}

function StatCard({ stat }: { stat: DashboardStat }) {
    const Icon = KPI_ICONS[stat.iconKey];
    return (
        <div className="h-full space-y-3 rounded-2xl border border-border/70 bg-background/95 p-4 shadow-[0_8px_24px_hsl(var(--foreground)/0.05)]">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{stat.label}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
            <span className="text-xs text-muted-foreground">{stat.change}</span>
        </div>
    );
}

function Panel({
    title,
    action,
    children,
    className,
}: {
    title: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex h-fit flex-col overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_14px_40px_hsl(var(--foreground)/0.05)]", className)}>
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 px-5">
                <h3 className="flex items-center gap-2 truncate text-sm font-semibold tracking-tight text-foreground">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="truncate">{title}</span>
                </h3>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-5">{children}</div>
        </div>
    );
}

function EmptyCardMessage({ message }: { message: string }) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60">
                <Activity className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-foreground/70">{message}</p>
        </div>
    );
}

export function DashboardAppMockup({
    mode = "default",
    className,
    url = "app.beres.io/dashboard",
    title,
    pageLabel,
    dateLabel,
    organizationName = "Beres One",
    roleName = "Owner",
    ownerName = "Beres Admin",
    ownerSummaryLabel = "Ringkasan Owner",
    greetingPrefix = "Selamat pagi",
    greetingDescription,
    activeBranchLabel = "Beres Pusat",
    navItems = DEFAULT_NAV_ITEMS,
    verticalNavItems = DEFAULT_VERTICAL_NAV_ITEMS,
    stats = DEFAULT_STATS,
    orders = DEFAULT_ORDERS,
    branches = DEFAULT_BRANCHES,
    attentionItems = DEFAULT_ATTENTION_ITEMS,
    operationsItems = DEFAULT_OPS_ITEMS,
}: DashboardAppMockupProps) {
    const resolvedPageLabel = title ?? pageLabel ?? "Dashboard";
    const resolvedGreetingDescription =
        greetingDescription ?? dateLabel ?? "Semua metrik utama bisnis kamu sudah dirangkum real-time di sini.";
    const isCompact = mode === "compact";
    const showSidebar = !isCompact;
    const showOpsRow = !isCompact;
    const showBranchPanel = !isCompact;
    const frameHeight = isCompact
        ? "h-fit min-h-[360px] sm:min-h-[410px] max-h-[500px]"
        : "h-fit min-h-[640px] lg:min-h-[700px] max-h-[760px]";

    return (
        <div className={cn("w-full", className)}>
            <BrowserMockup url={url} innerClassName={cn("bg-secondary/30 overflow-hidden", frameHeight)}>
                <div className={cn("grid h-full min-h-0", showSidebar ? "grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]" : "grid-cols-1")}>
                    <aside className={cn("min-h-0 flex-col border-r border-border/70 bg-sidebar/95", showSidebar ? "hidden md:flex" : "hidden")}>
                        <div className="border-b border-sidebar-border/70 px-4 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                                    <Image src="/logo.svg" alt="Beres" width={16} height={22} className="h-[22px] w-auto" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-[15px] font-semibold text-foreground">{organizationName}</p>
                                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">F &amp; B Dashboard</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4 overflow-hidden px-3 py-4">
                            <div>
                                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Menu Dasar</p>
                                <div className="mt-2 space-y-1">
                                    {navItems.map((item) => {
                                        const Icon = NAV_ICONS[item.iconKey];
                                        return (
                                            <div
                                                key={item.label}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium",
                                                    item.active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Menu F&amp;B</p>
                                <div className="mt-2 space-y-1">
                                    {verticalNavItems.map((item) => (
                                        <div key={item.label} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground">
                                            <UtensilsCrossed className="h-4 w-4" />
                                            <span className="truncate">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-sidebar-border/70 px-3 py-3">
                            <p className="px-2 pb-2 text-[10px] font-semibold text-muted-foreground">Organisasi</p>
                            <div className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">{activeBranchLabel}</div>
                        </div>
                    </aside>

                    <div className="flex min-h-0 flex-col">
                        <div className="flex h-16 shrink-0 items-center gap-4 border-b border-border/70 bg-background/85 px-4 backdrop-blur">
                            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
                                {!showSidebar ? (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                                        <Image src="/logo.svg" alt="Beres" width={14} height={20} className="h-[20px] w-auto" />
                                    </span>
                                ) : null}
                                <span className="truncate font-semibold text-foreground">{organizationName}</span>
                                <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:inline">{roleName}</span>
                                <span className="hidden text-muted-foreground/40 sm:inline">/</span>
                                <span className="hidden truncate font-semibold text-primary/80 sm:inline">{resolvedPageLabel}</span>
                            </div>
                            <div className="ml-auto flex min-w-0 items-center gap-3">
                                <div className={cn("relative min-w-0 items-center", isCompact ? "hidden lg:flex lg:flex-1 lg:max-w-[220px]" : "hidden sm:flex sm:flex-1 sm:max-w-[320px]")}>
                                    <Search className="absolute left-3 h-4 w-4 text-primary/80" />
                                    <div className="h-10 w-full rounded-full border border-border/70 bg-background/85 pl-9 pr-3 text-sm leading-10 text-muted-foreground">
                                        Cari atau ketik perintah
                                    </div>
                                </div>
                                <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/85">
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                    <span className="absolute -right-0.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                                        2
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-2.5 py-1.5">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                                        {ownerName.slice(0, 2).toUpperCase()}
                                    </span>
                                    <span className={cn("max-w-[9rem] truncate text-sm font-semibold text-foreground", isCompact ? "hidden lg:inline" : "hidden sm:inline")}>{ownerName}</span>
                                </div>
                            </div>
                        </div>

                        <div className={cn("min-h-0 flex-1 p-4 lg:p-6", isCompact ? "overflow-hidden" : "overflow-auto")}>
                            <div className={cn("space-y-6", isCompact && "space-y-4")}>
                                <div className={cn("rounded-3xl border border-primary/20 bg-secondary/60 p-6 sm:p-7", isCompact && "rounded-2xl p-4 sm:p-5")}>
                                    <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                                        {ownerSummaryLabel}
                                    </span>
                                    <h2 className={cn("mt-4 text-balance font-semibold leading-[1.04] tracking-tight text-foreground", isCompact ? "text-[clamp(1.35rem,4vw,1.9rem)]" : "text-[clamp(1.8rem,4.8vw,2.65rem)]")}>
                                        {greetingPrefix}, {ownerName}
                                    </h2>
                                    <p className={cn("mt-3 max-w-2xl leading-relaxed text-muted-foreground", isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base")}>{resolvedGreetingDescription}</p>
                                </div>

                                <div className={cn("grid w-full gap-3 items-start", isCompact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}>
                                    {stats.map((stat) => (
                                        <StatCard key={stat.label} stat={stat} />
                                    ))}
                                </div>

                                <div className={cn("grid grid-cols-1 gap-4 items-start", showBranchPanel ? "lg:grid-cols-3 lg:gap-6" : "")}>
                                    <div className={cn(showBranchPanel ? "lg:col-span-2" : "")}>
                                        <Panel
                                            title="Tren Revenue"
                                            className={cn("h-fit", isCompact ? "min-h-[190px]" : "min-h-[320px]")}
                                            action={
                                                <div className="flex items-center gap-1 rounded-full border border-border/70 bg-secondary px-1 py-1">
                                                    {["7D", "30D", "3M"].map((item, idx) => (
                                                        <span
                                                            key={item}
                                                            className={cn(
                                                                "rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground",
                                                                idx === 0 && "bg-background text-foreground shadow-sm"
                                                            )}
                                                        >
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            }
                                        >
                                            <EmptyCardMessage message="Belum ada transaksi di periode ini" />
                                        </Panel>
                                    </div>
                                    {showBranchPanel ? (
                                        <div>
                                            <Panel title="Revenue per Cabang" className="h-fit min-h-[320px]">
                                                {branches.length === 0 ? (
                                                    <EmptyCardMessage message="Belum ada data cabang" />
                                                ) : (
                                                    <div className="space-y-4">
                                                        {branches.map((branch) => (
                                                            <div key={branch.name} className="space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[11px] font-medium text-foreground">{branch.name}</p>
                                                                    <p className="text-[10px] text-muted-foreground">{branch.orders} order</p>
                                                                </div>
                                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                                                                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(branch.fill, 2)}%` }} />
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground">{branch.revenue}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </Panel>
                                        </div>
                                    ) : null}
                                </div>

                                {showOpsRow ? (
                                    <div className="grid grid-cols-1 gap-6 items-start lg:grid-cols-3">
                                        <div className="lg:col-span-2">
                                            <Panel title="Pesanan Terbaru" className="h-fit min-h-[360px]">
                                                <div className="-mx-5 -mb-5 rounded-b-2xl border-t border-border/60 bg-background">
                                                    {orders.map((order) => (
                                                        <div key={order.id} className="flex items-center justify-between border-b border-border/50 px-5 py-3 last:border-b-0">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-semibold text-foreground">{order.id}</p>
                                                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                                    {order.customer} • {order.branch} • {order.time}
                                                                </p>
                                                            </div>
                                                            <div className="ml-4 flex items-center gap-2">
                                                                <p className="text-sm font-bold text-foreground">{order.amount}</p>
                                                                <StatusBadge status={order.status} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Panel>
                                        </div>
                                        <div className="space-y-6">
                                            <Panel title="Perlu Perhatian" className="h-fit min-h-[168px]">
                                                <div className="space-y-3">
                                                    {attentionItems.map((item) => (
                                                        <div key={item.title} className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                                                            <p className="text-xs font-semibold text-foreground">{item.title}</p>
                                                            <p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Panel>
                                            <Panel title="Operasional" className="h-fit min-h-[168px]">
                                                <div className="space-y-2.5">
                                                    {operationsItems.map((item) => (
                                                        <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                                                            <span className="text-xs text-muted-foreground">{item.label}</span>
                                                            <span className="text-xs font-semibold text-foreground">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Panel>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </BrowserMockup>
        </div>
    );
}
