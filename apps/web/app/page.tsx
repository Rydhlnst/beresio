import { Hero } from "./_components/Hero";
import { FAQ } from "./_components/FAQ";
import { WhyChooseUs } from "./_components/WhyChooseUs";
import { ValueProposition, SavingsCalculator } from "./_components/LazySections";
import { Testimonials } from "./_components/Testimonials";

/**
 * Landing Page (Server Component)
 * 
 * Layout Structure:
 * - Hero: Full-width hero with align-start content
 * - ValueProposition: Feature carousel with align-start layout
 * - WhyChooseUs: Bento grid with consistent spacing
 * - Testimonials: Customer stories with align-start cards
 * - SavingsCalculator: ROI calculator with align-start layout
 * - FAQ: Accordion with sidebar navigation
 * 
 * All sections use consistent align-start layout for modern feel
 */

export default function Page() {
    return (
        <div className="relative w-full overflow-hidden">
            {/* Hero Section - No top divider */}
            <Hero />
            
            {/* Value Proposition - Feature showcase */}
            <ValueProposition />
            
            {/* Why Choose Us - Bento Grid Features */}
            <WhyChooseUs />
            
            {/* Testimonials - Social proof */}
            <Testimonials />
            
            {/* Savings Calculator - ROI tool */}
            <SavingsCalculator />
            
            {/* FAQ - Common questions */}
            <FAQ />
        </div>
    );
}
