import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@repo/ui";
import { HeroDashboardLazy } from "./HeroDashboardLazy";

/**
 * Hero Section (Server Component)
 * - align-start layout for modern feel
 * - Status badge with pulse animation
 * - Clear CTA buttons
 */

export function Hero() {
    return (
        <section 
            id="hero" 
            className="relative w-full bg-background pt-8 pb-[clamp(3rem,6vw,6rem)] lg:pb-[clamp(4rem,8vw,8rem)]"
        >
            <div className="relative z-10 w-full max-w-[1400px] mx-auto px-[clamp(1rem,4vw,3rem)]">
                {/* Content - align start */}
                <div className="flex flex-col items-start max-w-4xl">
                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-extrabold uppercase tracking-widest mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                        </span>
                        Sempurnakan Bisnis Anda - Segera Hadir
                    </div>

                    {/* Title */}
                    <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-black leading-[0.95] tracking-tighter text-foreground text-left mb-6">
                        Kelola Bisnis <br />
                        <span className="text-primary">Tanpa Batas</span> Dengan <br />
                        Satu Platform.
                    </h1>

                    {/* Description */}
                    <p className="text-muted-foreground text-lg lg:text-xl leading-relaxed text-left max-w-2xl mb-8">
                        Beres.io menghadirkan solusi kasir, inventori, dan laporan keuangan dalam satu genggaman.
                        Efisien, transparan, dan siap membantu bisnis Anda naik kelas.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center gap-4">
                        <Button
                            size="lg"
                            className="rounded-full px-8 h-12 font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-lg shadow-primary/20"
                            asChild
                        >
                            <Link href="/wishlist">
                                Gabung Antrean Prioritas
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full px-8 h-12 font-semibold text-base border-border/60 hover:bg-muted/50 transition-all"
                            asChild
                        >
                            <Link href="/demo">Lihat Demo</Link>
                        </Button>
                    </div>
                </div>

                {/* Dashboard Mockup - Below content */}
                <div className="mt-[clamp(2rem,5vw,4rem)]">
                    <HeroDashboardLazy />
                </div>
            </div>
        </section>
    );
}
