import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button, Heading, Text } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { Section } from "./Section";
import { SectionCTA } from "./SectionCTA";
import {
    HeroDashboardMockup,
    type DashboardBranch,
    type DashboardNavItem,
    type DashboardOrder,
    type DashboardOrderStatus,
    type DashboardStat,
} from "./HeroDashboard";

type FeatureItem = {
    title: string;
    description: string;
    icon: LucideIcon;
};

type WorkflowItem = {
    title: string;
    detail: string;
    value: string;
    icon: LucideIcon;
};

type DashboardWidget = {
    label: string;
    value: string;
    change: string;
};

type DashboardItem = {
    title: string;
    status: "stabil" | "perhatian" | "prioritas";
    eta: string;
};

type ProofPoint = {
    label: string;
    value: string;
    description: string;
};

type DashboardVariant = "fnb" | "laundry" | "retail" | "salon" | "franchise";

type IndustrySolutionTemplateProps = {
    badgeLabel: string;
    title: string;
    subtitle: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    heroHighlights: string[];
    dashboardVariant: DashboardVariant;
    dashboardTitle: string;
    dashboardSubtitle: string;
    dashboardWidgets: DashboardWidget[];
    dashboardItems: DashboardItem[];
    featuresTitle: string;
    featuresDescription: string;
    features: FeatureItem[];
    workflowTitle: string;
    workflowDescription: string;
    workflows: WorkflowItem[];
    proofTitle: string;
    proofDescription: string;
    proofPoints: ProofPoint[];
    closingCta: {
        title: string;
        description: string;
        primaryLabel: string;
        primaryHref: string;
        secondaryLabel: string;
        secondaryHref: string;
    };
};

const NAV_BY_VARIANT: Record<DashboardVariant, DashboardNavItem[]> = {
    fnb: [
        { iconKey: "dashboard", label: "Dashboard", active: true },
        { iconKey: "pos", label: "Kasir (POS)" },
        { iconKey: "inventory", label: "Bahan Baku" },
        { iconKey: "delivery", label: "Delivery" },
        { iconKey: "customers", label: "Pelanggan" },
        { iconKey: "reports", label: "Laporan Shift" },
    ],
    laundry: [
        { iconKey: "dashboard", label: "Dashboard", active: true },
        { iconKey: "pos", label: "Order Counter" },
        { iconKey: "inventory", label: "Supplies" },
        { iconKey: "delivery", label: "Pickup/Drop" },
        { iconKey: "customers", label: "Pelanggan" },
        { iconKey: "reports", label: "SLA Report" },
    ],
    retail: [
        { iconKey: "dashboard", label: "Dashboard", active: true },
        { iconKey: "pos", label: "Kasir (POS)" },
        { iconKey: "inventory", label: "Inventori" },
        { iconKey: "delivery", label: "Fulfillment" },
        { iconKey: "customers", label: "Member" },
        { iconKey: "reports", label: "Sales Report" },
    ],
    salon: [
        { iconKey: "dashboard", label: "Dashboard", active: true },
        { iconKey: "pos", label: "Front Desk" },
        { iconKey: "inventory", label: "Produk" },
        { iconKey: "delivery", label: "Booking Flow" },
        { iconKey: "customers", label: "Member" },
        { iconKey: "reports", label: "Stylist KPI" },
    ],
    franchise: [
        { iconKey: "dashboard", label: "Dashboard", active: true },
        { iconKey: "pos", label: "Gerai" },
        { iconKey: "inventory", label: "Standar SOP" },
        { iconKey: "delivery", label: "Approval" },
        { iconKey: "customers", label: "Franchisee" },
        { iconKey: "reports", label: "Royalty" },
    ],
};

const BRANCHES_BY_VARIANT: Record<DashboardVariant, DashboardBranch[]> = {
    fnb: [
        { name: "Cab. Kemang", orders: 18, revenue: "Rp 2.150.000", fill: 86 },
        { name: "Cab. Senopati", orders: 11, revenue: "Rp 1.760.000", fill: 67 },
        { name: "Cab. Bandung", orders: 7, revenue: "Rp 1.120.000", fill: 48 },
    ],
    laundry: [
        { name: "Outlet Menteng", orders: 42, revenue: "Rp 3.420.000", fill: 84 },
        { name: "Outlet Tebet", orders: 33, revenue: "Rp 2.940.000", fill: 70 },
        { name: "Outlet Bintaro", orders: 21, revenue: "Rp 1.980.000", fill: 52 },
    ],
    retail: [
        { name: "Store PIK", orders: 26, revenue: "Rp 4.120.000", fill: 82 },
        { name: "Store BSD", orders: 17, revenue: "Rp 3.050.000", fill: 64 },
        { name: "Store Surabaya", orders: 9, revenue: "Rp 1.870.000", fill: 42 },
    ],
    salon: [
        { name: "Studio Senayan", orders: 24, revenue: "Rp 3.640.000", fill: 79 },
        { name: "Studio Alam Sutera", orders: 18, revenue: "Rp 2.820.000", fill: 61 },
        { name: "Studio Bandung", orders: 11, revenue: "Rp 1.730.000", fill: 44 },
    ],
    franchise: [
        { name: "Region Barat", orders: 31, revenue: "Rp 8.420.000", fill: 88 },
        { name: "Region Tengah", orders: 22, revenue: "Rp 6.110.000", fill: 67 },
        { name: "Region Timur", orders: 15, revenue: "Rp 4.390.000", fill: 49 },
    ],
};

const CUSTOMER_BY_VARIANT: Record<DashboardVariant, string[]> = {
    fnb: ["Beres Brew Pusat", "Beres Roast Lab", "Beres Daily Cup", "Beres Urban Bean"],
    laundry: ["Beres Clean One", "Beres Clean Plus", "Beres Fresh Hub", "Beres Express Care"],
    retail: ["Beres Mart Pusat", "Beres Mart Raya", "Beres Goods Prime", "Beres Retail Core"],
    salon: ["Beres Glow Studio", "Beres Style Room", "Beres Beauty Hub", "Beres Care Loft"],
    franchise: ["Beres Region Barat", "Beres Region Tengah", "Beres Region Timur", "Beres Master Hub"],
};

const AMOUNT_BY_VARIANT: Record<DashboardVariant, string[]> = {
    fnb: ["Rp 85.000", "Rp 120.000", "Rp 55.000", "Rp 210.000"],
    laundry: ["Rp 74.000", "Rp 112.000", "Rp 48.000", "Rp 156.000"],
    retail: ["Rp 390.000", "Rp 250.000", "Rp 480.000", "Rp 620.000"],
    salon: ["Rp 420.000", "Rp 350.000", "Rp 275.000", "Rp 560.000"],
    franchise: ["Rp 2.1 jt", "Rp 1.4 jt", "Rp 3.3 jt", "Rp 980 rb"],
};

const TIMES = ["2 mnt lalu", "8 mnt lalu", "15 mnt lalu", "22 mnt lalu"];
const SNAPSHOT_FILLS = [82, 68, 54, 74];

function mapStatus(status: DashboardItem["status"]): DashboardOrderStatus {
    if (status === "prioritas") return "ready";
    if (status === "perhatian") return "processing";
    return "delivered";
}

function toDashboardStats(widgets: DashboardWidget[]): DashboardStat[] {
    const iconKeys: DashboardStat["iconKey"][] = ["revenue", "orders", "stock", "drivers"];
    return widgets.map((item, index) => {
        const lowerChange = item.change.toLowerCase();
        const trend: DashboardStat["trend"] =
            lowerChange.includes("perlu") || lowerChange.includes("-")
                ? "down"
                : lowerChange.includes("+")
                  ? "up"
                  : "neutral";

        return {
            label: item.label,
            value: item.value,
            change: item.change,
            trend,
            iconKey: iconKeys[index % iconKeys.length] ?? "revenue",
        };
    });
}

function toDashboardOrders(
    items: DashboardItem[],
    variant: DashboardVariant,
    branches: DashboardBranch[]
): DashboardOrder[] {
    const customers = CUSTOMER_BY_VARIANT[variant];
    const amounts = AMOUNT_BY_VARIANT[variant];
    return items.slice(0, 4).map((item, index) => ({
        id: `ORD-${(41 - index).toString().padStart(4, "0")}`,
        customer: customers[index % customers.length] ?? item.title,
        amount: amounts[index % amounts.length] ?? "Rp 0",
        status: mapStatus(item.status),
        time: TIMES[index % TIMES.length] ?? "Baru saja",
        branch: branches[index % branches.length]?.name ?? "Cab. Pusat",
    }));
}

export function IndustrySolutionTemplate({
    badgeLabel,
    title,
    subtitle,
    description,
    primaryCta,
    secondaryCta,
    heroHighlights,
    dashboardVariant,
    dashboardTitle,
    dashboardSubtitle,
    dashboardWidgets,
    dashboardItems,
    featuresTitle,
    featuresDescription,
    features,
    workflowTitle,
    workflowDescription,
    workflows,
    proofTitle,
    proofDescription,
    proofPoints,
    closingCta,
}: IndustrySolutionTemplateProps) {
    const branches = BRANCHES_BY_VARIANT[dashboardVariant];
    const navItems = NAV_BY_VARIANT[dashboardVariant];
    const stats = toDashboardStats(dashboardWidgets);
    const orders = toDashboardOrders(dashboardItems, dashboardVariant, branches);

    return (
        <>
            <Section id="solution-hero" showDivider={false} className="relative overflow-hidden bg-background pb-[clamp(3rem,6vw,6rem)] pt-[clamp(1.25rem,2vw,2rem)]">
                <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-brand/10 blur-[120px]" />
                <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-secondary/80 blur-[110px]" />
                <div className="space-y-10">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
                            {badgeLabel}
                        </div>

                        <div className="max-w-4xl space-y-5">
                            <Heading as="h1" className="text-[clamp(2rem,6vw,4.35rem)] font-medium leading-[0.93] tracking-tight text-foreground">
                                {title} <br />
                                <span className="font-normal text-brand">{subtitle}</span>
                            </Heading>
                            <Text variant="lead" className="max-w-3xl text-foreground/80">{description}</Text>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            {heroHighlights.map((highlight) => (
                                <div key={highlight} className="flex items-start gap-3 border-b border-border/60 pb-3">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand/90" />
                                    <p className="text-sm font-medium text-foreground/90">{highlight}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2">
                            <Button size="lg" className="h-12 rounded-xl bg-brand px-7 text-brand-foreground shadow-lg shadow-brand/20" asChild>
                                <Link href={primaryCta.href}>
                                    {primaryCta.label}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="h-12 rounded-xl px-7" asChild>
                                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                            </Button>
                        </div>
                    </div>

                    <HeroDashboardMockup
                        title={dashboardTitle}
                        dateLabel={dashboardSubtitle}
                        activeBranchLabel="Semua Cabang"
                        navItems={navItems}
                        stats={stats}
                        orders={orders}
                        branches={branches}
                    />
                </div>
            </Section>

            <Section id="solution-features">
                <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-10">
                        <div className="max-w-3xl space-y-3">
                            <Heading as="h2" className="font-medium">{featuresTitle}</Heading>
                            <Text variant="lead">{featuresDescription}</Text>
                        </div>
                        <div className="space-y-5">
                            {features.map((feature, index) => (
                                <article
                                    key={feature.title}
                                    className="group border-b border-border/50 pb-5 transition-colors hover:border-brand/40 last:border-b-0 last:pb-0"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="mt-1 min-w-8 text-[10px] font-semibold tracking-[0.14em] text-brand">
                                            {(index + 1).toString().padStart(2, "0")}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
                                                    <feature.icon className="h-4 w-4 text-brand" />
                                                </div>
                                                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                                    {feature.title}
                                                </h3>
                                            </div>
                                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <aside className="rounded-2xl border border-border/50 bg-gradient-to-b from-muted/30 to-background p-6 lg:sticky lg:top-24 lg:h-fit">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
                            Operational Snapshot
                        </p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                            {dashboardTitle}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {dashboardSubtitle} untuk melihat performa bisnis harian dalam satu panel ringkas.
                        </p>
                        <div className="mt-6 space-y-4">
                            {dashboardWidgets.map((widget, index) => (
                                <div key={widget.label} className="space-y-2 rounded-xl border border-border/50 bg-background/80 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-xs font-semibold text-muted-foreground">{widget.label}</p>
                                        <p className="text-xs font-semibold text-brand">{widget.change}</p>
                                    </div>
                                    <p className="text-xl font-semibold tracking-tight text-foreground">
                                        {widget.value}
                                    </p>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                                        <div
                                            className="h-full rounded-full bg-brand"
                                            style={{ width: `${SNAPSHOT_FILLS[index % SNAPSHOT_FILLS.length]}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </Section>

            <Section id="solution-workflow" className="bg-secondary/30">
                <div className="mb-10 max-w-3xl space-y-3">
                    <Heading as="h2" className="font-medium">{workflowTitle}</Heading>
                    <Text variant="lead">{workflowDescription}</Text>
                </div>
                <div className="grid gap-8 lg:grid-cols-3">
                    {workflows.map((item, index) => (
                        <article key={item.title} className="relative">
                            {index < workflows.length - 1 && (
                                <>
                                    <div className="absolute left-4 top-10 h-[calc(100%-1.5rem)] w-px bg-border/60 lg:hidden" />
                                    <div className="absolute right-[-1rem] top-4 hidden h-px w-[calc(100%-1rem)] bg-border/60 lg:block" />
                                </>
                            )}
                            <div className="flex items-start gap-4 lg:block">
                                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-background text-xs font-semibold text-brand">
                                    {(index + 1).toString().padStart(2, "0")}
                                </div>
                                <div className="space-y-3 pb-3 lg:pb-0 lg:pt-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10">
                                        <item.icon className="h-5 w-5 text-brand" />
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">
                                        {item.value}
                                    </p>
                                    <h3 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </Section>

            <Section id="solution-proof">
                <div className="mb-10 max-w-3xl space-y-3">
                    <Heading as="h2" className="font-medium">{proofTitle}</Heading>
                    <Text variant="lead">{proofDescription}</Text>
                </div>
                <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
                    <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
                        {proofPoints.map((point, index) => (
                            <div
                                key={point.label}
                                className={cn(
                                    "px-6 py-7",
                                    "border-b border-border/60 sm:border-b-0 sm:border-r",
                                    index % 2 === 1 && "sm:border-r-0",
                                    index < 2 && "lg:border-r lg:border-b-0",
                                    index >= 2 && "lg:border-r",
                                    index === proofPoints.length - 1 && "lg:border-r-0"
                                )}
                            >
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    {point.label}
                                </p>
                                <p className="mt-2 text-3xl font-semibold tracking-tight text-brand">{point.value}</p>
                                <p className="mt-2 text-sm text-muted-foreground">{point.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-dashed border-border/70 bg-background/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-foreground">
                        Ringkasnya: tim lapangan dapat ritme kerja yang sama, owner dapat visibilitas penuh lintas cabang.
                    </p>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                        <CheckCircle2 className="h-4 w-4" />
                        Business-ready execution layer
                    </div>
                </div>
            </Section>

            <Section>
                <SectionCTA
                    title={closingCta.title}
                    description={closingCta.description}
                    primaryLabel={closingCta.primaryLabel}
                    primaryHref={closingCta.primaryHref}
                    secondaryLabel={closingCta.secondaryLabel}
                    secondaryHref={closingCta.secondaryHref}
                />
            </Section>
        </>
    );
}
