import { cn } from "@/lib/utils";
import { EmptyState, type EmptyStateProps } from "./empty-state";

export function CardEmptyState({ className, ...props }: EmptyStateProps) {
    return (
        <EmptyState
            {...props}
            className={cn("flex-1 h-full", className)}
        />
    );
}
