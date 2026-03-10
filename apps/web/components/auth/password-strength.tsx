"use client";

import { getPasswordStrength } from "@/lib/validations/auth";
import { cn } from "@repo/ui/lib/utils";

interface PasswordStrengthProps {
    password: string;
}

const strengthConfig = {
    weak: { label: "Lemah", color: "bg-destructive", width: "w-1/3", textColor: "text-destructive" },
    medium: { label: "Sedang", color: "bg-yellow-500", width: "w-2/3", textColor: "text-yellow-500" },
    strong: { label: "Kuat", color: "bg-green-500", width: "w-full", textColor: "text-green-500" },
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
    if (!password) return null;

    const strength = getPasswordStrength(password);
    const config = strengthConfig[strength];

    return (
        <div className="space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-300",
                        config.color,
                        config.width
                    )}
                />
            </div>
            <p className={cn("text-xs font-medium", config.textColor)}>
                Kekuatan password: {config.label}
            </p>
        </div>
    );
}
