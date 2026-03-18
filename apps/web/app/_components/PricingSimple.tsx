import { Check } from "lucide-react"
import { Button, Heading, Text } from "@repo/ui"
import { Badge } from "@repo/ui/badge"
import { cn } from "@repo/ui/lib/utils"

type PricingPlan = {
    name: string
    price: string
    billing: string
    summary: string
    cta: string
    features: string[]
    highlight?: string
}

const pricingPlans: PricingPlan[] = [
    {
        name: "Solo",
        price: "Rp 15.000",
        billing: "per organisasi / bulan",
        summary: "Fitur dasar untuk usaha satu orang yang baru mulai digital.",
        cta: "Mulai dari Solo",
        features: [
            "POS & kasir",
            "Manajemen produk / layanan",
            "Laporan harian",
            "QR statis — upload foto QR sendiri",
        ],
    },
    {
        name: "Starter",
        price: "Rp 99.000",
        billing: "per organisasi / bulan",
        summary: "Cocok untuk usaha kecil dengan beberapa karyawan.",
        cta: "Pilih Starter",
        features: [
            "Semua fitur Solo",
            "Akuntansi dasar",
            "Inventori dasar + low stock alert",
            "Manajemen tim (3 user)",
        ],
    },
    {
        name: "Professional",
        price: "Rp 249.000",
        billing: "per organisasi / bulan",
        summary: "Untuk bisnis berkembang dengan beberapa cabang.",
        cta: "Ambil Professional",
        highlight: "Popular",
        features: [
            "Semua fitur Starter",
            "Multi-cabang hingga 3",
            "Akuntansi lengkap (double-entry)",
            "Delivery management + tracking",
        ],
    },
    {
        name: "Enterprise",
        price: "Rp 599.000",
        billing: "per organisasi / bulan",
        summary: "Untuk jaringan bisnis besar dan franchise.",
        cta: "Hubungi Sales",
        features: [
            "Multi-cabang & user unlimited",
            "API access unlimited",
            "White-label (branding bisnis)",
            "Account manager dedicated",
        ],
    },
]

export function PricingSimple() {
    return (
        <section className="relative overflow-hidden bg-background py-16 md:py-20">
            <div className="container px-4 md:px-6">
                <div className="mx-auto max-w-2xl text-center">
                    <Heading as="h1" className="text-3xl font-black tracking-tight md:text-4xl">
                        Paket Harga yang Transparan
                    </Heading>
                    <Text variant="muted" className="mt-3 text-sm md:text-base">
                        Pilih paket yang sesuai kebutuhan tim Anda. Upgrade kapan saja tanpa biaya tersembunyi.
                    </Text>
                </div>

                <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {pricingPlans.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                "flex h-full flex-col rounded-[28px] border border-border/60 bg-card p-6 shadow-sm",
                                plan.highlight && "border-foreground/30 shadow-md"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <Heading as="h3" className="text-lg font-black tracking-tight">
                                        {plan.name} plan
                                    </Heading>
                                </div>
                                {plan.highlight && (
                                    <Badge className="rounded-full bg-muted px-3 py-1 text-[10px] uppercase tracking-widest text-foreground">
                                        {plan.highlight}
                                    </Badge>
                                )}
                            </div>

                            <div className="mt-4 flex items-end gap-2">
                                <span className="text-4xl font-black tracking-tight text-foreground">
                                    {plan.price}
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {plan.billing}
                                </span>
                            </div>

                            <p className="mt-3 text-sm text-muted-foreground">{plan.summary}</p>

                            <Button className="mt-6 w-full rounded-2xl bg-foreground text-background font-semibold">
                                {plan.cta}
                            </Button>

                            <div className="mt-6 border-t border-border/60 pt-5">
                                <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    Features
                                </div>
                                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15">
                                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                                            </span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
