import type { Metadata } from "next";
import {
    Activity,
    Award,
    Clock,
    Key,
    Shield,
    UserCog,
    UserPlus,
    Users,
} from "lucide-react";
import { FeatureLandingTemplate } from "../_components/FeatureLandingTemplate";

export const metadata: Metadata = {
    title: "Manajemen Tim - Role & Akses yang Fleksibel",
    description:
        "Atur tim dan akses staff dengan mudah. Role-based access control, activity tracking, dan manajemen shift dalam satu platform.",
};

const FEATURE_ITEMS = [
    {
        title: "Role-based access control",
        description:
            "Atur hak akses tim berdasarkan peran agar tiap orang bekerja di area yang benar dan aman.",
        icon: Shield,
    },
    {
        title: "Onboarding staff lebih cepat",
        description:
            "Undang anggota tim dan aktifkan akses kerja tanpa setup manual yang berulang.",
        icon: UserPlus,
    },
    {
        title: "Activity tracking menyeluruh",
        description:
            "Lacak aktivitas pengguna dari transaksi sampai perubahan data untuk audit internal.",
        icon: Activity,
    },
    {
        title: "Manajemen jadwal shift",
        description:
            "Kelola pola kerja tim harian agar distribusi beban operasional tetap seimbang.",
        icon: Clock,
    },
    {
        title: "Insight performa karyawan",
        description:
            "Pantau kontribusi individu dengan metrik yang bisa digunakan untuk coaching tim.",
        icon: Award,
    },
    {
        title: "Pembatasan akses per cabang",
        description:
            "Pastikan staff hanya mengakses data outlet yang menjadi tanggung jawabnya.",
        icon: UserCog,
    },
];

const SPOTLIGHT_ITEMS = [
    {
        title: "Owner role",
        description: "Akses strategis untuk pengambilan keputusan dan kontrol konfigurasi global.",
        icon: Key,
        tag: "Strategic",
    },
    {
        title: "Admin role",
        description: "Mengelola user, role, dan pengaturan operasional lintas divisi.",
        icon: Shield,
        tag: "Control",
    },
    {
        title: "Manager role",
        description: "Memonitor tim, stok, dan approval operasional sesuai area tanggung jawab.",
        icon: UserCog,
        tag: "Execution",
    },
    {
        title: "Kasir & staff role",
        description: "Fokus ke tugas frontliner dengan akses terarah dan minim risiko kesalahan.",
        icon: Users,
        tag: "Daily Ops",
    },
];

export default function TimPage() {
    return (
        <FeatureLandingTemplate
            badgeLabel="Team Management"
            title="Manajemen Tim"
            subtitle="Struktur Akses yang Jelas untuk Operasional Harian"
            description="Bangun kolaborasi tim dengan role yang tepat, aktivitas yang terlacak, dan proses kerja yang lebih aman di setiap cabang."
            primaryCta={{ label: "Coba Gratis 14 Hari", href: "/wishlist" }}
            secondaryCta={{ label: "Lihat Demo", href: "/demo" }}
            featureSection={{
                eyebrow: "Team Operations",
                title: "Kelola tim dari onboarding sampai monitoring performa",
                description:
                    "Beres.io memberikan kontrol yang lebih jelas atas siapa melakukan apa, kapan, dan di cabang mana.",
                items: FEATURE_ITEMS,
            }}
            spotlightSection={{
                eyebrow: "Role Blueprint",
                title: "Template role siap pakai untuk kebutuhan operasional",
                description:
                    "Mulai dari role standar lalu sesuaikan berdasarkan struktur organisasi bisnis Anda agar governance tetap kuat.",
                items: SPOTLIGHT_ITEMS,
            }}
            operationsSection={{
                eyebrow: "Security and Accountability",
                title: "Jaga data bisnis tetap aman dengan jejak aktivitas yang lengkap",
                description:
                    "Setiap perubahan penting dicatat, sehingga tim manajemen bisa investigasi cepat dan menjaga standar operasional.",
                bullets: [
                    "Aktivitas pengguna tercatat untuk audit dan evaluasi rutin",
                    "Akses akun dapat dibatasi sesuai jabatan dan cabang",
                    "Manajemen sesi membantu memonitor perangkat yang aktif",
                    "Kontrol akses yang baik menurunkan risiko human error",
                ],
                panelTitle: "Team Governance Workspace",
                panelDescription:
                    "Satu dashboard untuk mengatur role, memantau aktivitas, dan memastikan tim bekerja sesuai otoritas masing-masing.",
                panelIcon: Users,
            }}
            finalSection={{
                title: "Siap bangun tim operasional yang lebih rapi?",
                description:
                    "Gunakan fitur manajemen tim Beres.io untuk menguatkan koordinasi, keamanan data, dan performa harian outlet Anda.",
                primaryCta: { label: "Mulai Free Trial", href: "/wishlist" },
                secondaryCta: { label: "Lihat Solusi Retail", href: "/solusi/retail" },
            }}
        />
    );
}
