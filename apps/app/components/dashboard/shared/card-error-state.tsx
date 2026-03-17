import { cn } from "@/lib/utils";
import { ErrorState, type ErrorStateProps } from "./error-state";

export function CardErrorState({ className, ...props }: ErrorStateProps) {
    return (
        <ErrorState
            {...props}
            className={cn("flex-1", className)}
        />
    );
}
