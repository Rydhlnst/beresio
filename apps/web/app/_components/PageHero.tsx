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
    contentClassName?: string;
};

export function PageHero({
    badgeLabel,
    title,
    subtitle,
    description,
    primaryCta,
    secondaryCta,
    align = "left",
    contentClassName,
}: PageHeroProps) {
    const isCentered = align === "center";

    return (
        <Section
            id="page-hero"
            showDivider={false}
            className="relative overflow-hidden border-b border-border/60 bg-background"
            contentClassName={contentClassName}
        >
            <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,hsl(var(--border)/0.32)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.32)_1px,transparent_1px)] [background-size:44px_44px] opacity-25" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,hsl(var(--secondary))_0%,transparent_45%)]" />

            <div
                className={cn(
                    "flex flex-col gap-6",
                    isCentered ? "items-center text-center" : "items-start text-left"
                )}
            >
                {badgeLabel && (
                    <Badge
                        className="rounded-full border border-border/80 bg-secondary px-4 py-1.5 text-[11px] font-semibold text-foreground"
                    >
                        {badgeLabel}
                    </Badge>
                )}

                <div className="space-y-4 max-w-4xl">
                    <Heading
                        as="h1"
                        className={cn(
                            "text-[clamp(2.2rem,6vw,4.25rem)] font-semibold leading-[0.95] tracking-tight text-foreground",
                            isCentered ? "text-center" : "text-left"
                        )}
                    >
                        {title}
                        {subtitle && (
                            <span className="block font-medium text-muted-foreground">
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
                                className="h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90"
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
                                className="h-12 px-6"
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
