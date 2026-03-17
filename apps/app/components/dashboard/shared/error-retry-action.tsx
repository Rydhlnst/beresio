"use client";

import { Button } from "@repo/ui/button";
import { RefreshCcw } from "lucide-react";
import { useTransitionRouter } from "@/hooks/use-transition-router";

export function ErrorRetryAction({ label = "Coba lagi" }: { label?: string }) {
    const { refresh } = useTransitionRouter();

    return (
        <Button
            variant="outline"
            className="h-8 text-xs font-semibold gap-2"
            onClick={() => refresh()}
        >
            <RefreshCcw className="h-3.5 w-3.5" />
            {label}
        </Button>
    );
}
