import { cn } from "@/lib/utils";
import { ErrorState, type ErrorStateProps } from "./error-state";

export function PageErrorState({ className, ...props }: ErrorStateProps) {
    return (
        <div className={cn("rounded-xl border border-border/60 bg-card p-6", className)}>
            <ErrorState {...props} className="py-16" />
        </div>
    );
}
