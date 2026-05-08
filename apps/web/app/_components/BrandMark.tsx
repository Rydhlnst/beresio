import Link from "next/link";
import Image from "next/image";
import { cn } from "@repo/ui/lib/utils";

type BrandMarkProps = {
    href?: string;
    className?: string;
    iconSize?: number;
    textSize?: "sm" | "md" | "lg";
};

const TEXT_SIZE_CLASS: Record<NonNullable<BrandMarkProps["textSize"]>, string> = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-xl",
};

export function BrandMark({
    href = "/",
    className,
    iconSize = 26,
    textSize = "md",
}: BrandMarkProps) {
    return (
        <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
            <Image src="/logo.svg" alt="Beres logo" width={iconSize} height={iconSize} priority />
            <span className={cn(TEXT_SIZE_CLASS[textSize], "font-black tracking-tight text-foreground")}>
                Beres
            </span>
            <span className={cn(TEXT_SIZE_CLASS[textSize], "font-medium tracking-tight text-muted-foreground")}>
                Cloud
            </span>
        </Link>
    );
}
