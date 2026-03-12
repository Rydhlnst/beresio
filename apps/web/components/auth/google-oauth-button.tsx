"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@repo/ui/button";
import { Google } from "@repo/ui/google";
import { cn } from "@repo/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface GoogleOAuthButtonProps {
    callbackURL?: string;
    label?: string;
    className?: string;
}

export function GoogleOAuthButton({
    callbackURL = "/onboarding/org",
    label = "Lanjutkan dengan Google",
    className,
}: GoogleOAuthButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL,
            });
        } catch {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            className={cn("w-full gap-2", className)}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Google className="size-4" />}
            {label}
        </Button>
    );
}
