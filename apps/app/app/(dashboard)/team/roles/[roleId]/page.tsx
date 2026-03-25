import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { SectionCard } from "@/components/dashboard/shared/section-card";

type RoleDetailPageProps = {
    params: { roleId: string };
};

export const metadata: Metadata = {
    title: "Detail Role | Beres",
    description: "Detail role dan izin",
};

const PERMISSIONS = [
    "Dashboard",
    "Order",
    "Inventory",
    "Laporan",
    "Tim",
    "Pengaturan",
];

export default function RoleDetailPage({ params }: RoleDetailPageProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Detail Role</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Role ID: {params.roleId}
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/tim/roles">Kembali</Link>
                </Button>
            </div>

            <SectionCard title="Izin Aktif" description="Modul yang dapat diakses role ini.">
                <div className="flex flex-wrap gap-2">
                    {PERMISSIONS.map((item) => (
                        <Badge key={item} variant="outline" className="text-[11px] font-semibold border-border/60">
                            {item}
                        </Badge>
                    ))}
                </div>
                <div className="mt-4">
                    <Button className="h-9 text-xs font-semibold">Edit Izin</Button>
                </div>
            </SectionCard>
        </div>
    );
}
