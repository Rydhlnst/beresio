import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { SectionCard } from "@/components/dashboard/shared/section-card";

type RoleDetailPageProps = {
    params: Promise<{ roleId: string }>;
};

export async function generateMetadata({ params }: RoleDetailPageProps): Promise<Metadata> {
    const { roleId } = await params;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.beres.io";

    return {
        title: `Detail Role ${roleId}`,
        description: "Detail role dan izin",
        alternates: {
            canonical: `${appBaseUrl}/tim/roles/${roleId}`,
        },
    };
}

const PERMISSIONS = [
    "Dashboard",
    "Order",
    "Inventory",
    "Laporan",
    "Tim",
    "Pengaturan",
];

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
    const { roleId } = await params;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Detail Role</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Role ID: {roleId}
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
