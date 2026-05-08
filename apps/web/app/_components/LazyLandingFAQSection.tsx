"use client";

import dynamic from "next/dynamic";
import { cn } from "@repo/ui/lib/utils";
import { APP_CONTENT_WIDTH } from "./layout-width";
import { DeferredOnViewport } from "./DeferredOnViewport";
import type { FAQItem } from "./FAQ";

const FAQLazy = dynamic(() => import("./FAQ").then((module) => module.FAQ), {
    ssr: false,
    loading: () => <FaqFallback faqs={[]} titleOnly />,
});

type LazyLandingFAQSectionProps = {
    faqs: FAQItem[];
};

function FaqFallback({
    faqs,
    titleOnly = false,
}: {
    faqs: FAQItem[];
    titleOnly?: boolean;
}) {
    return (
        <section className="border-b border-border/60 bg-muted/20 py-16 sm:py-20">
            <div className={cn(APP_CONTENT_WIDTH, "mx-auto max-w-4xl")}>
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">FAQ Beres Cloud</p>
                    <h2 className="mt-3 text-balance font-[var(--font-beres-instrument-serif)] text-[clamp(2rem,5.2vw,4rem)] leading-tight">
                        Pertanyaan yang Sering Ditanyakan
                    </h2>
                </div>
                {!titleOnly && (
                    <div className="mt-8 space-y-3">
                        {faqs.map((faq) => (
                            <details
                                key={faq.question}
                                className="rounded-2xl border border-border/70 bg-background px-6 py-4"
                            >
                                <summary className="cursor-pointer text-left text-base font-medium text-foreground">
                                    {faq.question}
                                </summary>
                                <p className="pt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export function LazyLandingFAQSection({ faqs }: LazyLandingFAQSectionProps) {
    return (
        <DeferredOnViewport
            rootMargin="320px 0px"
            fallback={<FaqFallback faqs={faqs} />}
        >
            <FAQLazy
                title="Pertanyaan yang Sering Ditanyakan"
                description="Berikut jawaban ringkas untuk hal yang paling sering ditanyakan sebelum mulai menggunakan Beres Cloud."
                badgeLabel="FAQ Beres Cloud"
                categories={["Pertanyaan Umum"]}
                defaultCategory="Pertanyaan Umum"
                faqs={faqs}
                contactCtaLabel="Hubungi Tim Beres"
                contactCtaHref="/support"
            />
        </DeferredOnViewport>
    );
}
