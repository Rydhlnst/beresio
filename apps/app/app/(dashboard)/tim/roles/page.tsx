import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { SectionCard } from "@/components/dashboard/shared/section-card";

export const metadata: Metadata = {
    title: "Role & Izin | Beres",
    description: "Kelola role dan izin akses",
};

const ROLES = [
    { id: "owner", name: "Owner", description: "Akses penuh ke seluruh modul." },
    { id: "manager", name: "Branch Manager", description: "Kelola operasional cabang." },
    { id: "cashier", name: "Cashier", description: "Akses transaksi dan order harian." },
];

export default function RolesPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Role & Izin</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kelola role dan izin sesuai kebutuhan tim.
                    </p>
                </div>
                <Button className="h-9 text-xs font-semibold" asChild>
                    <Link href="/tim/roles/new">Buat Role Baru</Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {ROLES.map((role) => (
                    <SectionCard key={role.id} title={role.name} description={role.description}>
                        <Button variant="outline" className="h-8 text-xs font-semibold" asChild>
                            <Link href={`/tim/roles/${role.id}`}>Lihat Detail</Link>
                        </Button>
                    </SectionCard>
                ))}
            </div>
        </div>
    );
}
