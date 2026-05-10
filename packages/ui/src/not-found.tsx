import * as React from "react"
import { Button } from "./button"
import { Home } from "lucide-react"
import { cn } from "./lib/utils"

interface NotFoundProps extends React.HTMLAttributes<HTMLDivElement> {
    homeUrl?: string
    title?: string
    description?: string
    backButtonText?: string
}

export function NotFound({
    homeUrl = "/",
    title = "Oops! Halaman Tidak Ditemukan",
    description = "Halaman yang Anda cari mungkin telah dipindahkan, dihapus, atau tidak pernah ada.",
    backButtonText = "Kembali ke Beranda",
    className,
    ...props
}: NotFoundProps) {
    return (
        <div 
            className={cn(
                "flex min-h-[80vh] flex-col items-center justify-center px-4 text-center animate-in fade-in duration-500",
                className
            )} 
            {...props}
        >
            <div className="relative mb-8">
                <h1 className="text-[120px] font-black leading-none tracking-tighter text-muted/20 sm:text-[180px] lg:text-[220px]">
                    404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-2 w-24 bg-primary/20 blur-xl sm:w-48" />
                </div>
            </div>

            <div className="relative z-10 -mt-10 mb-10 space-y-4 sm:-mt-16">
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                    {title}
                </h2>
                <p className="mx-auto max-w-[400px] text-sm text-muted-foreground leading-relaxed sm:text-base">
                    {description}
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
                <Button 
                    asChild 
                    size="lg"
                    className="h-12 rounded-2xl bg-primary px-8 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-xl active:scale-95 gap-2"
                >
                    <a href={homeUrl}>
                        <Home className="h-4 w-4" />
                        {backButtonText}
                    </a>
                </Button>
            </div>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-30">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="h-[1px] w-8 bg-muted-foreground/30" />
                    Beresio
                    <span className="h-[1px] w-8 bg-muted-foreground/30" />
                </div>
            </div>
        </div>
    )
}
