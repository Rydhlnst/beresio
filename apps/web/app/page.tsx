import { Hero } from "./_components/Hero";
import { FAQ } from "./_components/FAQ";
import { WhyChooseUs } from "./_components/WhyChooseUs";
import { ValueProposition, SavingsCalculator } from "./_components/LazySections";

/**
 * Landing Page (Server Component).
 * - Hero: RSC wrapper, inner dashboard lazy-loaded via "use client" Hero.tsx
 * - ValueProposition: lazy-loaded via LazySections (Client Component, ssr:false)
 * - WhyChooseUs: bento grid
 * - SavingsCalculator: lazy-loaded via LazySections (Client Component, ssr:false)
 * - FAQ: interactive accordion, synchronous
 */

export default function Page() {
    return (
        <>
            <Hero />
            <ValueProposition />
            <WhyChooseUs />
            <SavingsCalculator />
            <FAQ />
        </>
    );
}
