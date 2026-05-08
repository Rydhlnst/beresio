import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@repo/ui/button";
import { ProfileFormClient } from "./_components/profile-form-client";

export const metadata: Metadata = {
    title: "Profile Settings",
    description: "Kelola profil pengguna",
};

export default function SettingsProfilePage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Profil</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Perbarui data akun dan preferensi pribadi.
                    </p>
                </div>
                <Button variant="outline" className="h-9 text-xs font-semibold" asChild>
                    <Link href="/settings">Kembali</Link>
                </Button>
            </div>

            <ProfileFormClient />
        </div>
    );
}
