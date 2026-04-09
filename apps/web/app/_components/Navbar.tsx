"use client";

import Link from "next/link";
import type React from "react";
import dynamic from "next/dynamic";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@repo/ui/navigation-menu";
import { Button } from "@repo/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@repo/ui/sheet";
import { cn } from "@repo/ui/lib/utils";
import {
    ArrowRight,
    BarChart3,
    BookOpen,
    Building2,
    ChevronRight,
    CircleHelp,
    GitBranch,
    Menu,
    Package,
    PlayCircle,
    Scissors,
    ShoppingCart,
    Store,
    Truck,
    Users,
    WashingMachine,
} from "lucide-react";
import { BrandMark } from "./BrandMark";
import { APP_CONTENT_WIDTH, APP_CONTENT_WIDTH_INNER } from "./layout-width";

const NavbarAuthIsland = dynamic(
    () => import("./NavbarAuthIsland").then((m) => m.NavbarAuthIsland),
    {
        ssr: false,
        loading: () => <div className="hidden h-10 w-24 animate-pulse bg-secondary md:block" />,
    }
);

type NavItem = {
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

const CORE_FEATURES: NavItem[] = [
    {
        title: "Kasir Digital (POS)",
        description: "Transaksi cepat dengan multi payment dan struk otomatis.",
        href: "/fitur/kasir",
        icon: ShoppingCart,
    },
    {
        title: "Manajemen Inventori",
        description: "Stok realtime lintas cabang dengan alert stok menipis.",
        href: "/fitur/inventori",
        icon: Package,
    },
    {
        title: "Laporan & Analitik",
        description: "Pantau penjualan, margin, dan performa harian bisnis.",
        href: "/fitur/laporan",
        icon: BarChart3,
    },
];

const ADVANCED_FEATURES: NavItem[] = [
    {
        title: "Manajemen Pengiriman",
        description: "Kelola driver internal dan partner logistik dalam satu flow.",
        href: "/fitur/pengiriman",
        icon: Truck,
    },
    {
        title: "Multi Cabang",
        description: "Kontrol operasional semua outlet dari satu command center.",
        href: "/fitur/multi-cabang",
        icon: GitBranch,
    },
    {
        title: "Manajemen Tim",
        description: "Atur role dan akses staff dengan struktur yang aman.",
        href: "/fitur/tim",
        icon: Users,
    },
];

const SOLUTIONS: NavItem[] = [
    { title: "Laundry", description: "Tracking order cucian dan WA otomatis.", href: "/solusi/laundry", icon: WashingMachine },
    { title: "F&B", description: "Dine-in, takeaway, delivery terintegrasi.", href: "/solusi/fnb", icon: Store },
    { title: "Retail", description: "POS barcode dan stok multi-cabang.", href: "/solusi/retail", icon: Store },
    { title: "Salon & Spa", description: "Booking jadwal dan produktivitas stylist.", href: "/solusi/salon", icon: Scissors },
    { title: "Franchise", description: "Standarisasi SOP dan performa seluruh gerai.", href: "/solusi/franchise", icon: Building2 },
];

const RESOURCES: NavItem[] = [
    { title: "Dokumentasi", description: "Panduan penggunaan Beres dari dasar.", href: "/docs", icon: BookOpen },
    { title: "Video Tutorial", description: "Belajar setup cepat dalam hitungan menit.", href: "/tutorial", icon: PlayCircle },
    { title: "Changelog", description: "Update fitur terbaru yang sudah dirilis.", href: "/changelog", icon: CircleHelp },
];

function DesktopListItem({ title, description, href, icon: Icon }: NavItem) {
    return (
        <NavigationMenuLink asChild>
            <Link
                href={href}
                className="group flex items-start gap-3 border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-secondary/70"
            >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-secondary text-muted-foreground group-hover:text-primary">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                </div>
            </Link>
        </NavigationMenuLink>
    );
}

type MegaPanelProps = {
    label: string;
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
};

function MegaPanel({
    label,
    title,
    description,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
}: MegaPanelProps) {
    return (
        <div className="border border-border/70 bg-secondary/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
            <h4 className="mt-2 text-sm font-semibold text-foreground">{title}</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            <div className="mt-4 grid gap-2">
                <Button size="sm" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href={primaryHref}>
                        {primaryLabel}
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                </Button>
                <Button size="sm" variant="outline" className="h-9" asChild>
                    <Link href={secondaryHref}>{secondaryLabel}</Link>
                </Button>
            </div>
        </div>
    );
}

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
            <div className={cn(APP_CONTENT_WIDTH, "flex h-20 items-center justify-between")}>
                <div className="flex items-center gap-10">
                    <BrandMark />

                    <NavigationMenu className="hidden lg:flex">
                        <NavigationMenuList className="gap-1">
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-foreground">
                                    Fitur
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="min-w-screen w-screen md:!w-screen">
                                    <div className="min-w-screen w-screen border-y border-border/70 bg-background px-6 py-5 shadow-xl">
                                        <div className={APP_CONTENT_WIDTH_INNER}>
                                            <div className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] gap-5">
                                                <div className="space-y-2 border-r border-border/70 pr-5">
                                                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                        Core
                                                    </p>
                                                    {CORE_FEATURES.map((item) => (
                                                        <DesktopListItem key={item.href} {...item} />
                                                    ))}
                                                </div>
                                                <div className="space-y-2 border-r border-border/70 pr-5">
                                                    <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                        Advanced
                                                    </p>
                                                    {ADVANCED_FEATURES.map((item) => (
                                                        <DesktopListItem key={item.href} {...item} />
                                                    ))}
                                                </div>
                                                <MegaPanel
                                                    label="Mulai Dengan Fitur"
                                                    title="Pilih modul yang paling kamu butuhkan"
                                                    description="Lihat flow fitur POS, inventori, laporan, dan pengiriman untuk operasional harian."
                                                    primaryLabel="Eksplor Fitur POS"
                                                    primaryHref="/fitur/kasir"
                                                    secondaryLabel="Jadwalkan Demo"
                                                    secondaryHref="/demo"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-foreground">
                                    Solusi
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="min-w-screen w-screen md:!w-screen">
                                    <div className="min-w-screen w-screen border-y border-border/70 bg-background px-6 py-5 shadow-xl">
                                        <div className={APP_CONTENT_WIDTH_INNER}>
                                            <div className="grid w-full grid-cols-[minmax(0,1fr)_320px] gap-5">
                                                <div className="grid grid-cols-2 gap-2 border-r border-border/70 pr-5">
                                                    {SOLUTIONS.map((item) => (
                                                        <DesktopListItem key={item.href} {...item} />
                                                    ))}
                                                </div>
                                                <MegaPanel
                                                    label="Pilih Vertikal"
                                                    title="Temukan solusi sesuai tipe bisnis"
                                                    description="Setiap industri punya workflow berbeda. Lihat template dashboard sesuai operasionalmu."
                                                    primaryLabel="Lihat Solusi F&B"
                                                    primaryHref="/solusi/fnb"
                                                    secondaryLabel="Konsultasi Industri"
                                                    secondaryHref="/sales"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-sm font-semibold text-foreground">
                                    Resources
                                </NavigationMenuTrigger>
                                <NavigationMenuContent className="min-w-screen w-screen md:!w-screen">
                                    <div className="min-w-screen w-screen border-y border-border/70 bg-background px-6 py-5 shadow-xl">
                                        <div className={APP_CONTENT_WIDTH_INNER}>
                                            <div className="grid w-full grid-cols-[minmax(0,1fr)_320px] gap-5">
                                                <div className="space-y-2 border-r border-border/70 pr-5">
                                                {RESOURCES.map((item) => (
                                                    <DesktopListItem key={item.href} {...item} />
                                                ))}
                                                </div>
                                                <MegaPanel
                                                    label="Belajar Cepat"
                                                    title="Akses panduan dan update produk"
                                                    description="Mulai dari dokumentasi, video tutorial, sampai changelog fitur terbaru Beres Cloud."
                                                    primaryLabel="Buka Dokumentasi"
                                                    primaryHref="/docs"
                                                    secondaryLabel="Tonton Tutorial"
                                                    secondaryHref="/tutorial"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-sm font-semibold")}>
                                    <Link href="/harga">Harga</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-sm font-semibold")}>
                                    <Link href="/blog">Blog</Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                <div className="flex items-center gap-2">
                    <NavbarAuthIsland />

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open mobile menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[320px] bg-background">
                            <div className="pt-3">
                                <BrandMark />
                            </div>

                            <div className="mt-8 space-y-7">
                                <div>
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Fitur</p>
                                    <div className="space-y-1">
                                        {[...CORE_FEATURES, ...ADVANCED_FEATURES].map((item) => (
                                            <Link key={item.href} href={item.href} className="flex items-center justify-between px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                                                <span>{item.title}</span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Solusi</p>
                                    <div className="space-y-1">
                                        {SOLUTIONS.map((item) => (
                                            <Link key={item.href} href={item.href} className="block px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                                                {item.title}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Lainnya</p>
                                    <div className="space-y-1">
                                        <Link href="/harga" className="block px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                                            Harga
                                        </Link>
                                        <Link href="/blog" className="block px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                                            Blog
                                        </Link>
                                        <Link href="/docs" className="block px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                                            Dokumentasi
                                        </Link>
                                        <Link href="/support" className="block px-3 py-2.5 text-sm text-foreground hover:bg-secondary">
                                            Support
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <NavbarAuthIsland mobile />
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
