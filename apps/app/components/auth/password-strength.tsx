"use client";

import { getPasswordStrength } from "@/lib/validations/auth";
import { cn } from "@repo/ui/lib/utils";

interface PasswordStrengthProps {
    password: string;
}

const strengthConfig = {
    weak: { label: "Lemah", color: "bg-primary/20", width: "w-1/3", textColor: "text-muted-foreground" },
    medium: { label: "Sedang", color: "bg-primary/50", width: "w-2/3", textColor: "text-muted-foreground" },
    strong: { label: "Kuat", color: "bg-primary", width: "w-full", textColor: "text-primary" },
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
    if (!password) return null;

    const strength = getPasswordStrength(password);
    const config = strengthConfig[strength];

    return (
        <div className="space-y-2">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-200 ease-out",
                        config.color,
                        config.width
                    )}
                />
            </div>
            <p className={cn("text-xs font-semibold", config.textColor)}>
                Kekuatan password: {config.label}
            </p>
        </div>
    );
}
