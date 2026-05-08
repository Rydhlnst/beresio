import type { Metadata } from "next";
import {
    BarChart3,
    ChefHat,
    Clock,
    Receipt,
    Table,
    Truck,
    UtensilsCrossed,
} from "lucide-react";
import { IndustrySolutionTemplate } from "@/app/_components/IndustrySolutionTemplate";

export const metadata: Metadata = {
    title: "Solusi F&B - Dine-in, Takeaway & Delivery",
    description:
        "Software restoran dan F&B lengkap. Kelola dine-in, takeaway, delivery, kitchen display system, dan laporan penjualan dalam satu platform.",
};

const FEATURES = [
    {
        title: "Multi-Channel Order",
        description: "Satu dashboard untuk dine-in, takeaway, delivery, dan marketplace.",
        icon: Receipt,
    },
    {
        title: "Kitchen Display Flow",
        description: "Order langsung masuk ke dapur dengan status ordered, cooking, ready.",
        icon: ChefHat,
    },
    {
        title: "Table & Floor Control",
        description: "Kelola rotasi meja, split bill, dan reservasi jam sibuk.",
        icon: Table,
    },
    {
        title: "Delivery Orchestration",
        description: "Bandingkan performa driver internal dan partner logistik secara real-time.",
        icon: Truck,
    },
    {
        title: "Menu Engineering",
        description: "Pantau margin per item, combo conversion, dan best seller harian.",
        icon: UtensilsCrossed,
    },
    {
        title: "Shift Profit Report",
        description: "Laporan penjualan, COGS, dan waste untuk setiap shift outlet.",
        icon: BarChart3,
    },
];

export default function FnbPage() {
    return (
        <IndustrySolutionTemplate
            dashboardVariant="fnb"
            badgeLabel="Solusi Industri F&B"
            title="Operasional Restoran"
            subtitle="Rapi Dari Dapur Sampai Delivery"
            description="Beres menyatukan order, kitchen flow, dan channel delivery ke dalam satu command center. Tim front-of-house dan back-of-house bekerja di ritme yang sama."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
            heroHighlights={[
                "Sinkronisasi order dine-in, takeaway, dan delivery tanpa input ulang.",
                "Monitoring waktu masak per station untuk menekan keterlambatan.",
                "Kontrol performa outlet, menu, dan shift secara harian.",
                "Alert otomatis saat antrean dapur berisiko overload.",
            ]}
            dashboardTitle="F&B Command Center"
            dashboardSubtitle="Service Operations"
            dashboardWidgets={[
                { label: "Orders / Jam", value: "186", change: "+18% vs pekan lalu" },
                { label: "Avg Ticket", value: "Rp 68.000", change: "+9% upsell combo" },
                { label: "Kitchen SLA", value: "92%", change: "Target < 14 menit" },
            ]}
            dashboardItems={[
                { title: "Kitchen queue station grill mulai padat", status: "perhatian", eta: "8 menit" },
                { title: "Takeaway batch #A208 siap dipickup", status: "stabil", eta: "2 menit" },
                { title: "Delivery order premium client butuh prioritas", status: "prioritas", eta: "4 menit" },
            ]}
            featuresTitle="Dirancang Khusus Untuk Ritme F&B"
            featuresDescription="Semua fitur dibangun untuk kecepatan layanan, akurasi order, dan margin yang sehat di bisnis kuliner multi-channel."
            features={FEATURES}
            workflowTitle="Control Tower Operasional Harian"
            workflowDescription="Tim operasional, kitchen, dan manajer outlet membaca metrik yang sama untuk mengambil keputusan cepat."
            workflows={[
                {
                    title: "Service Velocity",
                    detail: "Pantau bottleneck per station dapur dan perbaiki throughput saat peak hour.",
                    value: "Real-time Kitchen Flow",
                    icon: Clock,
                },
                {
                    title: "Menu Profitability",
                    detail: "Lihat kontribusi margin per menu agar promo tidak memukul profit outlet.",
                    value: "Data-Driven Menu Mix",
                    icon: BarChart3,
                },
                {
                    title: "Delivery Health",
                    detail: "Bandingkan SLA dan biaya fulfillment antar channel delivery setiap shift.",
                    value: "Omni-Channel Fulfillment",
                    icon: Truck,
                },
            ]}
            proofTitle="Dampak yang Terlihat di Lantai Operasional"
            proofDescription="Bukan sekadar POS, melainkan sistem eksekusi yang membuat service tetap stabil walau trafik naik."
            proofPoints={[
                { label: "SLA Dapur", value: "-28%", description: "Waktu tunggu order lebih cepat." },
                { label: "Ticket Size", value: "+17%", description: "Upsell combo lebih konsisten." },
                { label: "Order Error", value: "-41%", description: "Kesalahan input antar channel turun." },
                { label: "Shift Visibility", value: "100%", description: "Semua outlet terpantau real-time." },
            ]}
            closingCta={{
                title: "Siap Menjalankan F&B Dengan Presisi Tinggi?",
                description: "Uji alur operasional Beres untuk restoran, cafe, dan cloud kitchen Anda dalam satu dashboard terpadu.",
                primaryLabel: "Mulai Free Trial",
                primaryHref: "/wishlist",
                secondaryLabel: "Lihat Solusi Retail",
                secondaryHref: "/solusi/retail",
            }}
        />
    );
}
