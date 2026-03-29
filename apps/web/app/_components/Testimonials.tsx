import { Star } from "lucide-react"
import { Section } from "./Section"

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
            {/* Header - align start */}
            <div className="max-w-3xl mb-[clamp(2rem,5vw,4rem)]">
                <span className="inline-block text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary mb-4">
                    Cerita Pelanggan
                </span>
                <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-black tracking-tight leading-[1.1] text-foreground mb-4">
                    UMKM yang Sudah Siap Bertumbuh
                </h2>
                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed max-w-2xl">
                    Bukti nyata dari bisnis yang berhasil menyederhanakan operasional dan meningkatkan profitabilitas.
                </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((item) => (
                    <article
                        key={item.name}
                        className="rounded-2xl border border-border/60 bg-card p-6 lg:p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                    >
                        <Stars />
                        <p className="mt-6 text-sm lg:text-base text-foreground/90 leading-relaxed">
                            &ldquo;{item.quote}&rdquo;
                        </p>
                        <div className="mt-8 pt-6 border-t border-border/30">
                            <p className="text-sm font-bold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.role}</p>
                        </div>
                    </article>
                ))}
            </div>
        </Section>
    )
}
