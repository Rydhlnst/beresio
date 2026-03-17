"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ErrorToastProps = {
    title: string;
    description?: string;
    id?: string;
};

export function ErrorToast({ title, description, id }: ErrorToastProps) {
    const hasShown = useRef(false);

    useEffect(() => {
        if (hasShown.current) return;
        hasShown.current = true;
        toast.error(title, { description, id });
    }, [title, description, id]);

    return null;
}

export type { ErrorToastProps };
