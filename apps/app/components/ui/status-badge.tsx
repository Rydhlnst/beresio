import { Badge } from "@repo/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
    status: string;
    type?: StatusType;
    variant?: "default" | "outline";
    className?: string;
}

const statusTypeMap: Record<string, StatusType> = {
    // Success states
    "OK": "success",
    "Aktif": "success",
    "active": "success",
    "completed": "success",
    "success": "success",
    "paid": "success",
    
    // Warning states
    "Low": "warning",
    "warning": "warning",
    "processing": "warning",
    "pending": "warning",
    "Pending": "warning",
    
    // Error states
    "Habis": "error",
    "error": "error",
    "cancelled": "error",
    "failed": "error",
    "inactive": "error",
    
    // Info states
    "info": "info",
    
    // Neutral states
    "neutral": "neutral",
};

const typeStyles: Record<StatusType, string> = {
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
    info: "badge-info",
    neutral: "badge-neutral",
};

export function StatusBadge({ 
    status, 
    type, 
    variant = "outline", 
    className 
}: StatusBadgeProps) {
    // Auto-detect type from status string if not provided
    const detectedType = type || statusTypeMap[status] || "neutral";
    
    return (
        <Badge 
            variant={variant} 
            className={cn(
                "text-[11px] font-semibold",
                typeStyles[detectedType],
                className
            )}
        >
            {status}
        </Badge>
    );
}

// Additional row highlight classes for tables
export const rowStatusClasses = {
    success: "row-success",
    warning: "row-warning",
    error: "row-error",
    info: "row-info",
    neutral: "",
};
