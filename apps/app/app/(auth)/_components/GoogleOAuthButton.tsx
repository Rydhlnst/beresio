"use client";

import React from "react";
import { Button, Google } from "@repo/ui";
import { Loader2 } from "lucide-react";

interface GoogleOAuthButtonProps {
    onClick: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    label?: string;
    className?: string;
}

export function GoogleOAuthButton({ onClick, isLoading, disabled, label = "Google", className }: GoogleOAuthButtonProps) {
    return (
        <Button
            variant="outline"
            onClick={onClick}
            disabled={disabled || isLoading}
            className={className || "w-full border-border/40 hover:bg-muted/50 h-11 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors duration-150 ease-out"}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Google className="h-5 w-5" />
            )}
            <span className="text-foreground">{label}</span>
        </Button>
    );
}
