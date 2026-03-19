"use client";

import { useState } from "react";
import { ArrowRight, X, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpgradeBannerProps {
    plan?: string;
    onDismiss?: () => void;
}

// Copywriting options for upgrade banner
const COPY_OPTIONS = {
    unlimited: {
        icon: Sparkles,
        text: "Upgrade ke Pro untuk cabang unlimited dan fitur tim lengkap",
        cta: "Upgrade sekarang",
    },
    growth: {
        icon: Zap,
        text: "Bisnis kamu berkembang? Buka limit cabang dan tim dengan Pro",
        cta: "Mulai berkembang",
    },
    premium: {
        icon: Crown,
        text: "Dapatkan akses fitur eksklusif dan prioritas support dengan Pro",
        cta: "Jadi Pro",
    },
};

const ACTIVE_COPY = "unlimited";

export function UpgradeBanner({ plan = "starter", onDismiss }: UpgradeBannerProps) {
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed || plan !== "starter") {
        return null;
    }

    const copy = COPY_OPTIONS[ACTIVE_COPY];
    const Icon = copy.icon;

    const handleDismiss = () => {
        setIsDismissed(true);
        onDismiss?.();
    };

    return (
        <div className="sticky top-0 z-50 w-full bg-primary h-10 shrink-0">
            <div className="mx-auto flex h-full max-w-none items-center justify-center gap-2 px-4">
                <Icon className="h-4 w-4 text-primary-foreground shrink-0" />
                <p className="text-sm font-medium text-primary-foreground">
                    {copy.text}
                </p>
                <a
                    href="/settings/billing"
                    className={cn(
                        "inline-flex items-center gap-1 text-sm font-semibold text-primary-foreground",
                        "underline underline-offset-2 hover:opacity-90 transition-opacity whitespace-nowrap"
                    )}
                >
                    {copy.cta}
                    <ArrowRight className="h-4 w-4" />
                </a>
            </div>
            <button
                onClick={handleDismiss}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-primary-foreground/70 hover:text-primary-foreground transition-colors rounded-md hover:bg-primary-foreground/10"
                aria-label="Tutup banner"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
