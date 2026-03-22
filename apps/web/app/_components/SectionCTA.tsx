import { ArrowRight } from "lucide-react"
import { Button, Heading, Text } from "@repo/ui"

interface SectionCTAProps {
    title: string
    description: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel?: string
    secondaryHref?: string
}

export function SectionCTA({
    title,
    description,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref
}: SectionCTAProps) {
    return (
        <div className="mt-32 border-t border-border pt-32 flex flex-col items-start gap-12">
            <div className="max-w-xl text-start">
                <Heading as="h4" className="mb-4 text-3xl tracking-tight leading-tight">
                    {title}
                </Heading>
                <Text variant="muted" className="max-w-lg">
                    {description}
                </Text>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" className="px-10 rounded-2xl bg-primary shadow-lg hover:shadow-xl transition-all group" asChild>
                    <a href={primaryHref}>
                        {primaryLabel}
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </a>
                </Button>
                {secondaryLabel && (
                    <Button variant="ghost" size="lg" className="h-14 px-8 rounded-2xl text-base font-medium text-muted-foreground hover:text-foreground" asChild>
                        <a href={secondaryHref}>{secondaryLabel}</a>
                    </Button>
                )}
            </div>
        </div>
    )
}
