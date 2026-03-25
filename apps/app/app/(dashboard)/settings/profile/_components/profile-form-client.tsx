"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { SectionCard } from "@/components/dashboard/shared/section-card";
import { ImageUpload } from "@/components/shared/image-upload";

export function ProfileFormClient() {
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

    return (
        <SectionCard title="Informasi Akun" description="Lengkapi data dasar akun Anda.">
            <div className="flex flex-col gap-6">
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4">Foto Profil</h3>
                    <ImageUpload 
                        value={avatarUrl} 
                        onChange={(url) => setAvatarUrl(url)} 
                        onClear={() => setAvatarUrl(undefined)}
                        // To make it look like an avatar, we could style it differently, 
                        // but the user requested "make sure everything use same style".
                        // ImageUpload defaults to a square/video aspect ratio, which is fine for now.
                    />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Input placeholder="Nama lengkap" />
                    <Input placeholder="Email" type="email" />
                    <Input placeholder="Nomor WhatsApp" />
                    <Input placeholder="Jabatan" />
                </div>
                <div className="mt-2">
                    <Button className="h-9 text-xs font-semibold">Simpan Perubahan</Button>
                </div>
            </div>
        </SectionCard>
    );
}
