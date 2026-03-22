import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import { PageHero } from "../_components/PageHero";
import { Section } from "../_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";

export const metadata: Metadata = {
    title: "Blog - Insight & Tips Bisnis",
    description: "Artikel, tips, dan insight untuk membantu bisnis Anda bertumbuh. Dari operasional harian sampai strategi scaling.",
};

const FEATURED_POST = {
    title: "Cara Meningkatkan Efisiensi Operasional UMKM dengan Digitalisasi",
    excerpt: "Pelajari bagaimana teknologi dapat membantu UMKM menghemat waktu, mengurangi error, dan meningkatkan profitabilitas.",
    category: "Business Tips",
    author: "Tim Beres.io",
    date: "15 Maret 2025",
    readTime: "5 menit baca",
    href: "#",
};

const POSTS = [
    {
        title: "5 Kesalahan Manajemen Inventori yang Sering Terjadi",
        excerpt: "Dan bagaimana cara menghindarinya dengan sistem yang tepat.",
        category: "Inventory",
        author: "Tim Beres.io",
        date: "10 Maret 2025",
        readTime: "4 menit",
        href: "#",
    },
    {
        title: "Strategi Multi-Cabang untuk Bisnis F&B",
        excerpt: "Tips mengelola dan menskalakan bisnis F&B ke lokasi baru.",
        category: "Growth",
        author: "Tim Beres.io",
        date: "5 Maret 2025",
        readTime: "6 menit",
        href: "#",
    },
    {
        title: "Panduan Lengkap Pajak untuk UMKM",
        excerpt: "Memahami kewajiban perpajakan dan cara mengelolanya dengan baik.",
        category: "Finance",
        author: "Tim Beres.io",
        date: "28 Februari 2025",
        readTime: "8 menit",
        href: "#",
    },
    {
        title: "Customer Retention: Cara Mendapatkan Repeat Order",
        excerpt: "Strategi meningkatkan loyalitas pelanggan dan repeat business.",
        category: "Marketing",
        author: "Tim Beres.io",
        date: "20 Februari 2025",
        readTime: "5 menit",
        href: "#",
    },
    {
        title: "Teknologi POS Modern: Fitur yang Harus Dimiliki",
        excerpt: "Apa saja yang perlu diperhatikan saat memilih sistem POS untuk bisnis Anda.",
        category: "Technology",
        author: "Tim Beres.io",
        date: "15 Februari 2025",
        readTime: "4 menit",
        href: "#",
    },
    {
        title: "Cara Membangun Tim yang Kuat untuk Bisnis Retail",
        excerpt: "Tips rekruitmen, training, dan retensi karyawan untuk toko retail.",
        category: "HR",
        author: "Tim Beres.io",
        date: "10 Februari 2025",
        readTime: "6 menit",
        href: "#",
    },
];

const CATEGORIES = ["Semua", "Business Tips", "Inventory", "Growth", "Finance", "Marketing", "Technology", "HR"];

export default function BlogPage() {
    return (
        <>
            <PageHero
                badgeLabel="Blog"
                title="Insight & Tips"
                subtitle="Untuk Bisnis Anda"
                description="Artikel, tips, dan insight untuk membantu bisnis Anda bertumbuh. Dari operasional harian sampai strategi scaling."
                primaryCta={{ label: "Artikel Terbaru", href: "#posts" }}
                secondaryCta={{ label: "Subscribe", href: "#" }}
                align="center"
            />

            <Section id="posts">
                <div className="space-y-10">
                    {/* Categories */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {CATEGORIES.map((cat) => (
                            <Badge 
                                key={cat} 
                                variant={cat === "Semua" ? "default" : "secondary"}
                                className="cursor-pointer rounded-full px-4 py-1.5"
                            >
                                {cat}
                            </Badge>
                        ))}
                    </div>

                    {/* Featured Post */}
                    <Card className="border-border/60 overflow-hidden">
                        <div className="grid lg:grid-cols-2">
                            <div className="aspect-video lg:aspect-auto bg-muted flex items-center justify-center">
                                <Text variant="muted">Featured Image</Text>
                            </div>
                            <CardContent className="p-8 flex flex-col justify-center">
                                <Badge className="w-fit mb-4 rounded-full">{FEATURED_POST.category}</Badge>
                                <Heading as="h2" className="text-2xl mb-4">{FEATURED_POST.title}</Heading>
                                <Text variant="muted" className="mb-6">{FEATURED_POST.excerpt}</Text>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                                    <span className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        {FEATURED_POST.author}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {FEATURED_POST.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {FEATURED_POST.readTime}
                                    </span>
                                </div>
                                <Button className="w-fit rounded-2xl" asChild>
                                    <Link href={FEATURED_POST.href}>
                                        Baca Selengkapnya
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </div>
                    </Card>

                    {/* Posts Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {POSTS.map((post) => (
                            <Card key={post.title} className="border-border/60 flex flex-col">
                                <div className="aspect-video bg-muted flex items-center justify-center">
                                    <Text variant="muted" className="text-sm">Thumbnail</Text>
                                </div>
                                <CardHeader className="space-y-2">
                                    <Badge variant="secondary" className="w-fit rounded-full">{post.category}</Badge>
                                    <Heading as="h3" className="text-lg line-clamp-2">{post.title}</Heading>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <Text variant="muted" className="text-sm line-clamp-2 mb-4 flex-1">
                                        {post.excerpt}
                                    </Text>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>{post.date}</span>
                                        <span>•</span>
                                        <span>{post.readTime}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Ada Topik yang Ingin Dibahas?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Kami terbuka untuk saran artikel. Hubungi kami dengan topik yang ingin Anda pelajari.
                    </Text>
                    <Button size="lg" className="rounded-2xl px-8" asChild>
                        <Link href="/support">Kirim Saran</Link>
                    </Button>
                </div>
            </Section>
        </>
    );
}
