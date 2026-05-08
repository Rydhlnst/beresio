import Link from "next/link";
import { ArrowRight, Check, type LucideIcon } from "lucide-react";
import { Badge, Button } from "@repo/ui";
import { cn } from "@repo/ui/lib/utils";
import { APP_CONTENT_WIDTH } from "@/app/_components/layout-width";

type Cta = {
    label: string;
    href: string;
};

type FeatureItem = {
    title: string;
    description: string;
    icon: LucideIcon;
};

type SpotlightItem = {
    title: string;
    description: string;
    icon: LucideIcon;
    tag?: string;
};

type FeatureSection = {
    eyebrow: string;
    title: string;
    description: string;
    items: FeatureItem[];
};

type SpotlightSection = {
    eyebrow: string;
    title: string;
    description: string;
    items: SpotlightItem[];
};

type OperationsSection = {
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
    panelTitle: string;
    panelDescription: string;
    panelIcon: LucideIcon;
};

type FinalSection = {
    title: string;
    description: string;
    primaryCta: Cta;
    secondaryCta?: Cta;
};

export type FeatureLandingTemplateProps = {
    badgeLabel: string;
    title: string;
    subtitle: string;
    description: string;
    primaryCta: Cta;
    secondaryCta: Cta;
    featureSection: FeatureSection;
    spotlightSection: SpotlightSection;
    operationsSection: OperationsSection;
    finalSection: FinalSection;
};

export function FeatureLandingTemplate({
    badgeLabel,
    title,
    subtitle,
    description,
    primaryCta,
    secondaryCta,
    featureSection,
    spotlightSection,
    operationsSection,
    finalSection,
}: FeatureLandingTemplateProps) {
    const PanelIcon = operationsSection.panelIcon;

    return (
        <div className="bg-background font-[var(--font-beres-dm-sans)] text-foreground">
            <section className="relative overflow-hidden border-b border-border/60">
                <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] [background-size:44px_44px] opacity-30" />
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,hsl(var(--secondary))_0%,transparent_46%)]" />

                <div className={cn(APP_CONTENT_WIDTH, "py-16 sm:py-20 lg:py-24")}>
                    <div className="max-w-3xl">
                        <Badge className="rounded-full border border-border/80 bg-secondary px-4 py-1.5 text-[11px] font-semibold text-foreground">
                            {badgeLabel}
                        </Badge>

                        <h1 className="mt-6 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2.5rem,7vw,4.25rem)] leading-[0.95] tracking-tight text-foreground">
                            {title}
                            <span className="block text-foreground/70">{subtitle}</span>
                        </h1>

                        <p className="mt-5 max-w-[56ch] text-base font-medium leading-relaxed text-foreground/75 sm:text-lg">
                            {description}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Button size="lg" className="h-12 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90" asChild>
                                <Link href={primaryCta.href}>
                                    {primaryCta.label}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="ghost" className="h-12 rounded-full px-6 text-foreground hover:bg-secondary" asChild>
                                <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-border/60 py-16 sm:py-20">
                <div className={APP_CONTENT_WIDTH}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{featureSection.eyebrow}</p>
                    <h2 className="mt-3 max-w-3xl text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5vw,3rem)] leading-tight">
                        {featureSection.title}
                    </h2>
                    <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-foreground/75 sm:text-lg">
                        {featureSection.description}
                    </p>

                    <div className="mt-10 overflow-hidden rounded-3xl border border-border/70 bg-background/90">
                        {featureSection.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <article key={item.title} className="grid gap-4 border-b border-border/60 p-6 last:border-b-0 sm:grid-cols-[auto,1fr] sm:gap-5 sm:p-7">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                                        <p className="mt-2 max-w-3xl text-base font-medium leading-relaxed text-foreground/75">
                                            {item.description}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="border-b border-border/60 bg-secondary/35 py-16 sm:py-20">
                <div className={APP_CONTENT_WIDTH}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{spotlightSection.eyebrow}</p>
                    <h2 className="mt-3 max-w-3xl text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(1.9rem,4.6vw,2.8rem)] leading-tight">
                        {spotlightSection.title}
                    </h2>
                    <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-foreground/75 sm:text-lg">
                        {spotlightSection.description}
                    </p>

                    <div className="mt-10 grid gap-4 md:grid-cols-2">
                        {spotlightSection.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <article key={item.title} className="rounded-2xl border border-border/70 bg-background/90 p-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        {item.tag && (
                                            <span className="rounded-full border border-border/70 bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                {item.tag}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
                                    <p className="mt-2 text-sm font-medium leading-relaxed text-foreground/75 sm:text-base">
                                        {item.description}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="border-b border-border/60 py-16 sm:py-20">
                <div className={cn(APP_CONTENT_WIDTH, "grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-center")}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{operationsSection.eyebrow}</p>
                        <h2 className="mt-3 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(1.9rem,4.2vw,2.7rem)] leading-tight">
                            {operationsSection.title}
                        </h2>
                        <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-foreground/75 sm:text-lg">
                            {operationsSection.description}
                        </p>
                        <ul className="mt-6 space-y-3">
                            {operationsSection.bullets.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm font-medium leading-relaxed text-foreground/80 sm:text-base">
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-secondary/75 via-background to-muted/70 p-8 sm:p-10">
                        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
                        <div className="relative">
                            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                                <PanelIcon className="h-7 w-7 text-primary" />
                            </div>
                            <h3 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{operationsSection.panelTitle}</h3>
                            <p className="mt-3 text-base font-medium leading-relaxed text-foreground/75">
                                {operationsSection.panelDescription}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-14 sm:py-16">
                <div className={APP_CONTENT_WIDTH}>
                    <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12">
                        <div className="pointer-events-none absolute inset-0 z-0 opacity-25 [background-image:radial-gradient(hsl(var(--primary-foreground)/0.2)_1px,transparent_1px)] [background-size:16px_16px]" />
                        <div className="relative z-10">
                            <h2 className="max-w-2xl text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5vw,3rem)] leading-tight">
                                {finalSection.title}
                            </h2>
                            <p className="mt-4 max-w-2xl text-primary-foreground/90">
                                {finalSection.description}
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Button className="h-12 rounded-full bg-background px-6 text-primary hover:bg-background/90" asChild>
                                    <Link href={finalSection.primaryCta.href}>{finalSection.primaryCta.label}</Link>
                                </Button>
                                {finalSection.secondaryCta && (
                                    <Button className="h-12 rounded-full border border-primary-foreground/35 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/15" asChild>
                                        <Link href={finalSection.secondaryCta.href}>{finalSection.secondaryCta.label}</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
