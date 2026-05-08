import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight, Heart, Zap, Users, Globe } from "lucide-react";
import { PageHero } from "@/app/_components/PageHero";
import { Section } from "@/app/_components/Section";
import { Button, Heading, Text } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";

export const metadata: Metadata = {
    title: "Karir - Join Tim Kami",
    description: "Bergabung dengan tim Beres Cloud. Kami mencari talenta yang passionate untuk membantu UMKM Indonesia bertumbuh.",
};

const BENEFITS = [
    {
        title: "Flexible Work",
        description: "Remote-first culture dengan fleksibilitas waktu kerja.",
        icon: Globe,
    },
    {
        title: "Growth Opportunity",
        description: "Belajar dan berkembang bersama tim yang supportive.",
        icon: Zap,
    },
    {
        title: "Meaningful Impact",
        description: "Bantu UMKM Indonesia bertumbuh dengan teknologi.",
        icon: Heart,
    },
    {
        title: "Great Team",
        description: "Bekerja dengan orang-orang passionate dan talented.",
        icon: Users,
    },
];

const OPENINGS = [
    {
        title: "Senior Frontend Engineer",
        department: "Engineering",
        location: "Remote",
        type: "Full-time",
        href: "#",
    },
    {
        title: "Backend Engineer",
        department: "Engineering",
        location: "Remote",
        type: "Full-time",
        href: "#",
    },
    {
        title: "Product Designer",
        department: "Design",
        location: "Remote",
        type: "Full-time",
        href: "#",
    },
    {
        title: "Customer Success Manager",
        department: "Customer Success",
        location: "Jakarta",
        type: "Full-time",
        href: "#",
    },
    {
        title: "Sales Development Representative",
        department: "Sales",
        location: "Jakarta",
        type: "Full-time",
        href: "#",
    },
    {
        title: "Content Marketing Specialist",
        department: "Marketing",
        location: "Remote",
        type: "Full-time",
        href: "#",
    },
];

export default function CareersPage() {
    return (
        <>
            <PageHero
                badgeLabel="Join Our Team"
                title="Build the Future"
                subtitle="With Us"
                description="Kami mencari talenta yang passionate untuk membantu UMKM Indonesia bertumbuh. Jadilah bagian dari perjalanan kami."
                primaryCta={{ label: "Lihat Lowongan", href: "#openings" }}
                secondaryCta={{ label: "Pelajari Culture", href: "#benefits" }}
                align="center"
            />

            <Section id="benefits">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Kenapa Beres Cloud?</Heading>
                        <Text variant="lead" align="center">
                            Kami percaya bahwa orang yang happy akan menghasilkan pekerjaan terbaik.
                        </Text>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {BENEFITS.map((benefit) => (
                            <Card key={benefit.title} className="border-border/60">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                                            <benefit.icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">{benefit.title}</h3>
                                            <Text variant="muted" className="text-sm">{benefit.description}</Text>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section id="openings" className="bg-muted/30">
                <div className="space-y-10">
                    <div className="max-w-2xl mx-auto text-center space-y-3">
                        <Heading as="h2">Lowongan Tersedia</Heading>
                        <Text variant="lead" align="center">
                            Temukan posisi yang cocok untuk Anda dan bergabung dengan tim kami.
                        </Text>
                    </div>

                    <div className="space-y-4">
                        {OPENINGS.map((job) => (
                            <Card key={job.title} className="border-border/60">
                                <CardContent className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <Heading as="h3" className="text-lg mb-2">{job.title}</Heading>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                                <Badge variant="secondary" className="rounded-full">{job.department}</Badge>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {job.type}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="outline" className="rounded-2xl shrink-0" asChild>
                                            <Link href={job.href}>
                                                Lihat Detail
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </Section>

            <Section>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Heading as="h2">Tidak Ada Posisi yang Cocok?</Heading>
                    <Text variant="lead" align="center" className="max-w-2xl">
                        Kami selalu terbuka untuk talenta yang exceptional. Kirimkan CV Anda dan ceritakan bagaimana Anda bisa berkontribusi.
                    </Text>
                    <Button size="lg" className="rounded-2xl px-8" asChild>
                        <Link href="/support">Kirim CV</Link>
                    </Button>
                </div>
            </Section>
        </>
    );
}
