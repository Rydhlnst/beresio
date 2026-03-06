"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import {
    Twitter,
    Github,
    Linkedin,
    Instagram,
    Youtube,
    ChevronRight,
    Circle
} from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { useShowLayout } from "./LayoutProvider"

const footerLinks = [
    {
        title: "Product",
        links: [
            { label: "Fitur Utama", href: "/fitur", badge: "New" },
            { label: "Harga", href: "/harga" },
            { label: "API Docs", href: "/docs/api" },
            { label: "Starter Kit", href: "/starter-kit" },
        ]
    },
    {
        title: "Explore",
        links: [
            { label: "Use Cases", href: "/use-cases" },
            { label: "Studi Kasus", href: "/studi-kasus" },
            { label: "Beres AI", href: "/ai" },
            { label: "Referral Program", href: "/referral" },
        ]
    },
    {
        title: "Company",
        links: [
            { label: "Tentang Kami", href: "/about" },
            { label: "Karir", href: "/careers" },
            { label: "Media Kit", href: "/media" },
            { label: "Changelog", href: "/changelog" },
            { label: "Request Fitur", href: "/feedback" },
        ]
    },
    {
        title: "Blogs",
        links: [
            { label: "Official Blog", href: "/blog" },
            { label: "Engineering", href: "/blog/engineering" },
            { label: "Community", href: "/community" },
        ]
    },
    {
        title: "Support",
        links: [
            { label: "Pusat Bantuan", href: "/help" },
            { label: "Kontak", href: "/contact" },
            { label: "Join Discord", href: "/discord" },
        ]
    }
]

export function Footer() {
    const showLayout = useShowLayout()
    if (!showLayout) return null

    return (
        <footer className="relative z-10 w-full bg-background border-t border-border/50 pt-16 pb-8">
            <div className="mx-auto max-w-[1400px] px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="inline-block">
                            <Image
                                src="/logo.svg"
                                alt="Beres logo"
                                width={120}
                                height={32}
                                className="h-8 w-auto"
                            />
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            Platform bisnis terpadu yang membantu UMKM tumbuh lebih cepat dan terorganisir.
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center gap-4">
                            {[
                                { icon: Twitter, href: "#" },
                                { icon: Github, href: "#" },
                                { icon: Linkedin, href: "#" },
                                { icon: Instagram, href: "#" },
                                { icon: Youtube, href: "#" },
                            ].map((social, i) => (
                                <Link
                                    key={i}
                                    href={social.href}
                                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                                >
                                    <social.icon className="h-5 w-5" />
                                </Link>
                            ))}
                        </div>

                        {/* System Status Indication */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/30">
                            <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-medium text-foreground/80">All systems operational</span>
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-8">
                        {footerLinks.map((group) => (
                            <div key={group.title} className="space-y-4">
                                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground">
                                    {group.title}
                                </h4>
                                <ul className="space-y-2.5">
                                    {group.links.map((link) => (
                                        <li key={link.label}>
                                            <Link
                                                href={link.href}
                                                className="text-[13px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                                            >
                                                {link.label}
                                                {link.badge && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                                        {link.badge}
                                                    </span>
                                                )}
                                                {group.title === "Comparisons" && (
                                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-[12px] text-muted-foreground">
                        © {new Date().getFullYear()} Beres.io — PT Solusi Digital Beres.
                    </p>
                    <div className="flex items-center gap-6">
                        {["Privacy Policy", "Terms of Service", "Code of Conduct"].map((legal) => (
                            <Link
                                key={legal}
                                href="#"
                                className="text-[12px] text-muted-foreground hover:text-primary transition-colors"
                            >
                                {legal}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
