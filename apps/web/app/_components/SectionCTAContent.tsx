import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, Heading, Text } from "@repo/ui";

export interface SectionCTAProps {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
}

export function SectionCTAContent({
    title,
    description,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
}: SectionCTAProps) {
    return (
        <div className="mt-32 border-t border-border/70 pt-20 sm:pt-24">
            <div className="max-w-2xl">
                <Heading as="h4" className="text-[clamp(1.8rem,4vw,2.8rem)] leading-tight tracking-tight">
                    {title}
                </Heading>
                <Text variant="lead" className="mt-4 max-w-xl text-muted-foreground">
                    {description}
                </Text>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="h-12 bg-primary px-6 text-primary-foreground hover:bg-primary/90" asChild>
                    <Link href={primaryHref}>
                        {primaryLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                {secondaryLabel && secondaryHref && (
                    <Button variant="outline" size="lg" className="h-12 px-6" asChild>
                        <Link href={secondaryHref}>{secondaryLabel}</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}
