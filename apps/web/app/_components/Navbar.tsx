"use client"

import * as React from "react"
import Link from "next/link"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@repo/ui/navigation-menu"
import { Button } from "@repo/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@repo/ui/sheet"
import { cn } from "@repo/ui/lib/utils"
import {
    LucideIcon,
    ShoppingCart,
    Package,
    BarChart3,
    Truck,
    GitBranch,
    Users,
    WashingMachine,
    UtensilsCrossed,
    Store,
    Scissors,
    Building2,
    BookOpen,
    Newspaper,
    PlayCircle,
    FileText,
    MessageCircle,
    ArrowRight,
    ChevronRight,
    Play,
    Menu,
} from "lucide-react"
import Image from "next/image"
import { Banner } from "./Banner"
import { useSession } from "@/lib/auth-client"
import ProfileDropdown from "./ProfileDropdown"
import { useShowLayout } from "./LayoutProvider"

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface NavItem {
    title: string
    description: string
    href: string
    icon: LucideIcon
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const coreFeatures: NavItem[] = [
    {
        title: "Kasir Digital (POS)",
        description: "Transaksi cepat, multi-payment, cetak struk otomatis.",
        href: "/fitur/kasir",
        icon: ShoppingCart,
    },
    {
        title: "Manajemen Inventori",
        description: "Pantau stok real-time, alert otomatis saat stok menipis.",
        href: "/fitur/inventori",
        icon: Package,
    },
    {
        title: "Laporan & Analitik",
        description: "Dashboard performa bisnis, P&L, dan arus kas instan.",
        href: "/fitur/laporan",
        icon: BarChart3,
    },
]

const advancedFeatures: NavItem[] = [
    {
        title: "Manajemen Pengiriman",
        description: "Driver sendiri + Gojek/Grab dalam satu platform.",
        href: "/fitur/pengiriman",
        icon: Truck,
    },
    {
        title: "Multi-Cabang",
        description: "Kelola semua cabang dari satu dashboard terpusat.",
        href: "/fitur/multi-cabang",
        icon: GitBranch,
    },
    {
        title: "Manajemen Tim",
        description: "Atur akses staff per cabang dengan role yang fleksibel.",
        href: "/fitur/tim",
        icon: Users,
    },
]

const solutions: NavItem[] = [
    {
        title: "Laundry",
        description: "Order masuk, tracking cucian, notifikasi siap ambil.",
        href: "/solusi/laundry",
        icon: WashingMachine,
    },
    {
        title: "F&B",
        description: "Dine-in, takeaway, delivery — semua terkelola rapi.",
        href: "/solusi/fnb",
        icon: UtensilsCrossed,
    },
    {
        title: "Retail",
        description: "Barcode scan, varian produk, retur & penukaran barang.",
        href: "/solusi/retail",
        icon: Store,
    },
    {
        title: "Salon & Spa",
        description: "Booking jadwal, assign stylist, paket layanan.",
        href: "/solusi/salon",
        icon: Scissors,
    },
    {
        title: "Franchise",
        description: "Standardisasi operasional di semua gerai franchise.",
        href: "/solusi/franchise",
        icon: Building2,
    },
]

const resources = [
    { icon: BookOpen, label: "Dokumentasi", href: "/docs" },
    { icon: PlayCircle, label: "Video Tutorial", href: "/tutorial" },
    { icon: FileText, label: "Changelog", href: "/changelog" },
]

const company = [
    { label: "Tentang Kami", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Karir", href: "/careers" },
]

// ─── LOGO ─────────────────────────────────────────────────────────────────────

function BeresLogo() {
    return (
        <Link href="/" className="flex items-center gap-2 group">
            <Image
                src="/logo.svg"
                alt="Beres logo"
                width={32}
                height={32}
            />
        </Link>
    )
}

function MegaMenuSidebar() {
    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-muted/40 p-4 border border-border/50">
                <div className="aspect-video rounded bg-background/50 flex items-center justify-center border border-border/40">
                    <Play className="size-6 text-muted-foreground/40" />
                </div>
                <div className="mt-3 space-y-2">
                    <h4 className="font-semibold text-[13px]">Mulai Cepat</h4>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                        Pelajari dasar-dasar Beres dalam waktu kurang dari 5 menit.
                    </p>
                    <Button className="w-full h-8 text-[11px] rounded-sm" size="sm" asChild>
                        <Link href="/tutorial">
                            Tonton Tutorial
                            <ArrowRight className="ml-1 size-3" />
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <h4 className="font-semibold text-[13px]">Butuh Bantuan?</h4>
                <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed">
                    Bicara dengan tim ahli kami untuk solusi bisnis Anda.
                </p>
                <Button className="mt-3 w-full h-8 text-[11px] rounded-sm" size="sm" variant="outline" asChild>
                    <Link href="/sales">Hubungi Sales</Link>
                </Button>
            </div>
        </div>
    )
}

// ─── LIST ITEM ────────────────────────────────────────────────────────────────

interface ListItemProps {
    title: string
    description: string
    href: string
    icon: LucideIcon
    className?: string
}

function ListItem({ title, description, href, icon: Icon, className }: ListItemProps) {
    return (
        <NavigationMenuLink asChild>
            <Link
                href={href}
                className={cn(
                    "group flex select-none items-start gap-4 rounded-md p-3 outline-none transition-all duration-200",
                    "hover:bg-muted focus:bg-muted",
                    className
                )}
            >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground/60 group-hover:text-primary transition-colors" />
                <div className="space-y-1.5">
                    <p className="text-[13px] font-semibold leading-none text-foreground">
                        {title}
                    </p>
                    <p className="text-[12px] leading-snug text-muted-foreground line-clamp-1">
                        {description}
                    </p>
                </div>
            </Link>
        </NavigationMenuLink>
    )
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {children}
        </p>
    )
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

export function Navbar() {
    const { data: session, isPending } = useSession()
    const showLayout = useShowLayout()

    if (!showLayout) return null

    return (
        <header className="sticky top-0 z-50 w-full transition-all duration-300">
            <Banner />
            <div className="border-b border-border/60 bg-background backdrop-blur-sm supports-[backdrop-filter]:bg-background">
                <div className="mx-auto flex h-24 w-full max-w-[1400px] items-center justify-between px-4 sm:px-8">

                    {/* Left: logo + nav */}
                    <div className="flex items-center gap-8 h-full">
                        <BeresLogo />

                        <NavigationMenu className="hidden lg:flex h-full">
                            <NavigationMenuList className="gap-0 h-full">

                                {/* ── FITUR ── */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="h-9 text-[13px] font-medium">
                                        Fitur
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className="w-screen border-t border-border/50 bg-popover shadow-lg">
                                            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-10">
                                                <div className="grid grid-cols-[2fr_1fr_220px] gap-12">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <SectionLabel>FITUR UTAMA</SectionLabel>
                                                            <div className="space-y-1 mt-3">
                                                                {coreFeatures.map((item) => (
                                                                    <ListItem key={item.href} {...item} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <SectionLabel>ADVANCED</SectionLabel>
                                                            <div className="space-y-1 mt-3">
                                                                {advancedFeatures.map((item) => (
                                                                    <ListItem key={item.href} {...item} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div>
                                                            <SectionLabel>RESOURCES</SectionLabel>
                                                            <div className="space-y-1 mt-3">
                                                                {resources.map((resource) => (
                                                                    <NavigationMenuLink
                                                                        key={resource.label}
                                                                        href={resource.href}
                                                                        className="flex items-center gap-3 rounded-md p-2.5 hover:bg-muted transition-colors group"
                                                                    >
                                                                        <resource.icon className="size-4 text-foreground/60 group-hover:text-primary transition-colors" />
                                                                        <span className="font-medium text-[13px]">{resource.label}</span>
                                                                    </NavigationMenuLink>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <SectionLabel>COMPANY</SectionLabel>
                                                            <div className="space-y-1 mt-3">
                                                                {company.map((item) => (
                                                                    <NavigationMenuLink
                                                                        key={item.label}
                                                                        href={item.href}
                                                                        className="block rounded-md p-2.5 hover:bg-muted transition-colors"
                                                                    >
                                                                        <span className="font-medium text-[13px]">{item.label}</span>
                                                                    </NavigationMenuLink>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <MegaMenuSidebar />
                                                </div>
                                            </div>
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* ── SOLUSI ── */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="h-9 text-[13px] font-medium">
                                        Solusi
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className="w-screen border-t border-border/50 bg-popover shadow-lg">
                                            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-10">
                                                <div className="grid grid-cols-[1fr_220px] gap-12">
                                                    <div>
                                                        <SectionLabel>INDUSTRI</SectionLabel>
                                                        <div className="space-y-1 mt-3">
                                                            {solutions.map((item) => (
                                                                <ListItem key={item.href} {...item} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <MegaMenuSidebar />
                                                </div>
                                            </div>
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* ── PARTNERSHIP ── */}
                                <NavigationMenuItem>
                                    <NavigationMenuLink
                                        asChild
                                        className={cn(navigationMenuTriggerStyle(), "h-9 text-[13px] font-medium")}
                                    >
                                        <Link href="/partnership">Partnership</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>

                                {/* ── RESOURCES ── */}
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger className="h-9 text-[13px] font-medium">
                                        Resources
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className="w-screen border-t border-border/50 bg-popover shadow-lg">
                                            <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-10">
                                                <div className="grid grid-cols-[1fr_220px] gap-12">
                                                    <div>
                                                        <SectionLabel>PUSAT BANTUAN</SectionLabel>
                                                        <div className="space-y-1 mt-3">
                                                            {resources.map((resource) => (
                                                                <NavigationMenuLink
                                                                    key={resource.label}
                                                                    href={resource.href}
                                                                    className="flex items-center gap-4 rounded-md p-3 hover:bg-muted transition-all group"
                                                                >
                                                                    <resource.icon className="size-4 text-foreground/60 group-hover:text-primary transition-colors" />
                                                                    <span className="font-semibold text-[13px]">{resource.label}</span>
                                                                </NavigationMenuLink>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                                                            <h4 className="font-semibold text-[12px]">Support 24/7</h4>
                                                            <p className="mt-1 text-muted-foreground text-[10px] leading-relaxed">
                                                                Tim kami siap membantu operasional bisnis Anda kapanpun.
                                                            </p>
                                                            <Button className="mt-3 w-full h-8 text-[11px] rounded-2xl" size="sm" variant="ghost" asChild>
                                                                <Link href="/support">Hubungi Kami</Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/* ── HARGA ── direct link */}
                                <NavigationMenuItem>
                                    <NavigationMenuLink
                                        asChild
                                        className={cn(navigationMenuTriggerStyle(), "h-9 text-[13px] font-medium")}
                                    >
                                        <Link href="/harga">Harga</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>

                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-1.5">
                        {isPending ? (
                            <div className="h-10 w-24 rounded-xl bg-muted animate-pulse hidden md:block" />
                        ) : session ? (
                            <ProfileDropdown data={{
                                name: session.user.name,
                                email: session.user.email,
                                avatar: session.user.image || "",
                            }} />
                        ) : (
                            <>
                                <div className="hidden md:flex items-center gap-1.5">
                                    <Button
                                        variant="link"
                                        size="lg"
                                        asChild
                                    >
                                        <Link href="/sign-in">Masuk</Link>
                                    </Button>

                                    <div className="mx-1 h-4 w-px bg-border" />

                                    <Button
                                        variant="outline"
                                        size="lg"
                                        asChild
                                        className="rounded-2xl"
                                    >
                                        <Link href="/wishlist">Join Wishlist</Link>
                                    </Button>
                                </div>

                                <Button
                                    size="lg"
                                    asChild
                                    className="rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                >
                                    <Link href="/wishlist">Gabung Antrean</Link>
                                </Button>
                            </>
                        )}

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-11 w-11 lg:hidden hover:bg-accent">
                                    <Menu className="h-6 w-6 text-foreground" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[320px] p-0 flex flex-col gap-0 border-l border-border/50 bg-background/98 backdrop-blur-xl">
                                <SheetHeader className="p-6 border-b border-border/50 text-left">
                                    <SheetTitle>
                                        <BeresLogo />
                                    </SheetTitle>
                                </SheetHeader>

                                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
                                    <div className="space-y-4">
                                        <SectionLabel>Fitur Utama</SectionLabel>
                                        <div className="grid gap-2">
                                            {coreFeatures.concat(advancedFeatures).map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className="flex items-center gap-4 rounded-lg p-3 hover:bg-muted transition-colors group"
                                                >
                                                    <item.icon className="h-5 w-5 text-foreground/60 group-hover:text-primary transition-colors" />
                                                    <div className="space-y-1">
                                                        <p className="text-[14px] font-semibold leading-none">{item.title}</p>
                                                        <p className="text-[12px] text-muted-foreground line-clamp-1">{item.description}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <SectionLabel>Solusi Industri</SectionLabel>
                                        <div className="grid gap-2">
                                            {solutions.map((item) => (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-accent transition-colors"
                                                >
                                                    <item.icon className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-[14px] font-medium">{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <SectionLabel>Bantuan & Lainnya</SectionLabel>
                                        <div className="grid gap-1">
                                            <Link href="/partnership" className="px-3 py-2 text-[14px] font-medium hover:bg-accent rounded-md transition-colors">Partnership</Link>
                                            <Link href="/harga" className="px-3 py-2 text-[14px] font-medium hover:bg-accent rounded-md transition-colors">Harga</Link>
                                            <Link href="/docs" className="px-3 py-2 text-[14px] font-medium hover:bg-accent rounded-md transition-colors">Dokumentasi</Link>
                                            <Link href="/blog" className="px-3 py-2 text-[14px] font-medium hover:bg-accent rounded-md transition-colors">Blog</Link>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-border/50 bg-muted/30">
                                    <div className="grid gap-3">
                                        {session ? (
                                            <Button asChild className="w-full rounded-2xl bg-primary">
                                                <Link href="/dashboard">Ke Dashboard</Link>
                                            </Button>
                                        ) : (
                                            <>
                                                <Button variant="outline" asChild className="w-full rounded-2xl">
                                                    <Link href="/sign-in">Masuk ke Dashboard</Link>
                                                </Button>
                                                <Button asChild className="w-full rounded-2xl bg-primary hover:bg-accent hover:text-accent-foreground">
                                                    <Link href="/wishlist">Gabung Wishlist</Link>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                </div>
            </div>
        </header>
    )
}
