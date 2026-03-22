import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "./Section";
import { Button, Heading, Text } from "@repo/ui";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/lib/utils";

export type PageHeroProps = {
    badgeLabel?: string;
    title: string;
    subtitle?: string;
    description?: string;
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
    align?: "left" | "center";
};

export function PageHero({
    badgeLabel,
    title,
    subtitle,
    description,
    primaryCta,
    secondaryCta,
    align = "left",
}: PageHeroProps) {
    const isCentered = align === "center";

    return (
        <Section id="page-hero" showDivider={false} className="relative overflow-hidden bg-background">
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute bottom-24 left-0 h-64 w-64 rounded-full bg-amber-500/10 blur-[120px]" />

            <div
                className={cn(
                    "flex flex-col gap-6",
                    isCentered ? "items-center text-center" : "items-start text-left"
                )}
            >
                {badgeLabel && (
                    <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary hover:bg-primary/15 rounded-full px-4 py-1.5 font-medium border-0"
                    >
                        {badgeLabel}
                    </Badge>
                )}

                <div className="space-y-4 max-w-4xl">
                    <Heading
                        as="h1"
                        className={cn(
                            "text-[clamp(2.2rem,6vw,4.25rem)] font-black leading-[0.95] tracking-tight",
                            isCentered ? "text-center" : "text-left"
                        )}
                    >
                        {title}
                        {subtitle && (
                            <span className="block text-muted-foreground">
                                {subtitle}
                            </span>
                        )}
                    </Heading>
                    {description && (
                        <Text variant="lead" align={isCentered ? "center" : "left"}>
                            {description}
                        </Text>
                    )}
                </div>

                {(primaryCta || secondaryCta) && (
                    <div
                        className={cn(
                            "flex flex-wrap items-center gap-4",
                            isCentered ? "justify-center" : "justify-start"
                        )}
                    >
                        {primaryCta && (
                            <Button
                                size="lg"
                                className="rounded-2xl px-10 h-14 font-extrabold text-base bg-primary text-primary-foreground hover:scale-105 transition-all shadow-xl shadow-primary/20"
                                asChild
                            >
                                <Link href={primaryCta.href}>
                                    {primaryCta.label}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                        {secondaryCta && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="rounded-2xl px-8 h-14 font-bold text-base bg-background/50 backdrop-blur-sm border-border hover:bg-muted/50 transition-all"
                                asChild
                            >
                                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Section>
    );
}
