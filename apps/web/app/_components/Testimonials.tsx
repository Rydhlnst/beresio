import { Star } from "lucide-react"
import { Section } from "./Section"
import { Heading, Text } from "@repo/ui"

const TESTIMONIALS = [
    {
        name: "Rina Kusuma",
        role: "Owner, Kopi Harmoni",
        quote:
            "Sebelum Beres, laporan saya berantakan. Sekarang semua cabang bisa dipantau real-time dan keputusan jadi lebih cepat.",
    },
    {
        name: "Ahmad Fauzi",
        role: "Founder, Laundry Bersih",
        quote:
            "Stok, kasir, dan pengiriman jadi satu. Tim lebih fokus ke pelanggan karena pekerjaan manual berkurang drastis.",
    },
    {
        name: "Siti Rahayu",
        role: "Manager, Retail Bintang",
        quote:
            "Dashboardnya bikin jelas mana produk yang paling untung. Kami bisa atur promo lebih tepat sasaran.",
    },
]

function Stars() {
    return (
        <div className="flex items-center gap-1 text-primary">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-primary" />
            ))}
        </div>
    )
}

export function Testimonials() {
    return (
        <Section id="testimonials" className="bg-background">
            <div className="max-w-3xl mb-14">
                <Text variant="overline" className="mb-4">Cerita Pelanggan</Text>
                <Heading as="h3" className="text-[clamp(1.75rem,4vw,3rem)] tracking-tight">
                    UMKM yang Sudah Siap Bertumbuh
                </Heading>
                <Text variant="muted" className="mt-4">
                    Bukti nyata dari bisnis yang berhasil menyederhanakan operasional dan meningkatkan profitabilitas.
                </Text>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((item) => (
                    <article
                        key={item.name}
                        className="rounded-3xl border border-border/60 bg-card p-8 shadow-sm hover:shadow-lg transition-shadow"
                    >
                        <Stars />
                        <p className="mt-6 text-sm text-foreground/90 leading-relaxed">
                            "{item.quote}"
                        </p>
                        <div className="mt-8">
                            <p className="text-sm font-semibold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.role}</p>
                        </div>
                    </article>
                ))}
            </div>
        </Section>
    )
}
