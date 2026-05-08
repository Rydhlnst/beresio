import type { Metadata } from "next";
import {
    Calendar,
    Clock,
    CreditCard,
    Gift,
    Scissors,
    Star,
    UserCheck,
} from "lucide-react";
import { IndustrySolutionTemplate } from "@/app/_components/IndustrySolutionTemplate";

export const metadata: Metadata = {
    title: "Solusi Salon & Spa - Booking & Manajemen Layanan",
    description:
        "Software salon dan spa lengkap dengan booking online, manajemen stylist/therapist, paket layanan, dan membership.",
};

const FEATURES = [
    {
        title: "Online Booking Calendar",
        description: "Pelanggan pilih layanan, stylist, dan slot waktu dari kanal online.",
        icon: Calendar,
    },
    {
        title: "Stylist Assignment",
        description: "Distribusi jadwal stylist dan therapist berdasarkan skill set.",
        icon: UserCheck,
    },
    {
        title: "Service Package Management",
        description: "Bangun paket layanan bundle dengan pricing dan durasi yang fleksibel.",
        icon: Gift,
    },
    {
        title: "No-Double Booking Guard",
        description: "Slot layanan otomatis terkunci agar tidak terjadi bentrok jadwal.",
        icon: Clock,
    },
    {
        title: "Membership & Loyalty",
        description: "Kelola tier member, reward point, dan campaign retensi personal.",
        icon: Star,
    },
    {
        title: "Deposit & Prepaid Plan",
        description: "Amankan cashflow dengan sistem deposit dan paket prepaid pelanggan.",
        icon: CreditCard,
    },
];

export default function SalonPage() {
    return (
        <IndustrySolutionTemplate
            dashboardVariant="salon"
            badgeLabel="Solusi Industri Salon & Spa"
            title="Operasional Salon"
            subtitle="Elegan di Front Desk, Presisi di Back Office"
            description="Beres menghubungkan booking, penjadwalan stylist, dan lifecycle pelanggan agar pengalaman service tetap premium sambil operasional lebih efisien."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Jadwalkan Demo", href: "/demo" }}
            heroHighlights={[
                "Booking online langsung masuk ke jadwal tim tanpa input manual.",
                "No-show menurun lewat reminder otomatis berlapis.",
                "Paket layanan dan membership mendorong repeat visit.",
                "Pantau performa stylist dan revenue per layanan.",
            ]}
            dashboardTitle="Salon Service Desk"
            dashboardSubtitle="Booking & Experience"
            dashboardWidgets={[
                { label: "Bookings Hari Ini", value: "96", change: "+19% vs minggu lalu" },
                { label: "No-Show Rate", value: "4,2%", change: "-31% setelah auto reminder" },
                { label: "Avg Spend", value: "Rp 286rb", change: "+15% paket bundle" },
            ]}
            dashboardItems={[
                { title: "Stylist senior slot sore hampir penuh", status: "perhatian", eta: "2 jam" },
                { title: "Reminder batch 17:00 sudah terkirim", status: "stabil", eta: "Selesai" },
                { title: "VIP member request reschedule prioritas", status: "prioritas", eta: "15 menit" },
            ]}
            featuresTitle="Dirancang Untuk Operasional Salon yang Rapi"
            featuresDescription="Alur kerja dibuat agar front desk, stylist, dan manajer cabang bergerak sinkron pada satu sistem."
            features={FEATURES}
            workflowTitle="Service Journey Yang Konsisten"
            workflowDescription="Setiap interaksi pelanggan dari booking hingga pembayaran terekam dalam alur yang bisa dianalisis dan dioptimalkan."
            workflows={[
                {
                    title: "Booking Orchestration",
                    detail: "Kapasitas slot, layanan, dan stylist disusun otomatis sesuai ketersediaan tim.",
                    value: "Live Calendar Allocation",
                    icon: Calendar,
                },
                {
                    title: "Treatment Flow Control",
                    detail: "Pantau progress layanan dan durasi aktual untuk menjaga ketepatan jadwal.",
                    value: "Service Time Governance",
                    icon: Scissors,
                },
                {
                    title: "Retention Engine",
                    detail: "Campaign loyalty berjalan berdasarkan histori kunjungan dan preferensi pelanggan.",
                    value: "Member Experience Loop",
                    icon: Star,
                },
            ]}
            proofTitle="Kinerja Salon yang Lebih Terukur"
            proofDescription="Dengan data yang utuh, tim bisa meningkatkan kualitas layanan sekaligus menjaga produktivitas."
            proofPoints={[
                { label: "No-Show", value: "-34%", description: "Kehadiran booking lebih konsisten." },
                { label: "Repeat Visit", value: "+27%", description: "Kunjungan berulang meningkat lewat loyalty flow." },
                { label: "Slot Utilization", value: "+21%", description: "Jam stylist terpakai lebih optimal." },
                { label: "Bundle Revenue", value: "+18%", description: "Penjualan paket layanan naik stabil." },
            ]}
            closingCta={{
                title: "Siap Naikkan Standar Operasional Salon Anda?",
                description: "Bangun pengalaman pelanggan yang premium dengan workflow tim yang disiplin dan terukur.",
                primaryLabel: "Mulai Free Trial",
                primaryHref: "/wishlist",
                secondaryLabel: "Lihat Solusi Franchise",
                secondaryHref: "/solusi/franchise",
            }}
        />
    );
}
