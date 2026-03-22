import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@repo/ui/button";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Manajemen Meja | Beres",
  description: "Kelola meja, area, dan status ketersediaan",
};

export default async function MejaPage() {
  const db = createDbNextjs(process.env.DATABASE_URL!);
  const authInstance = auth(db);
  const reqHeaders = await headers();

  const session = await authInstance.api.getSession({ headers: reqHeaders });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Manajemen Meja</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Kelola meja, area, dan status ketersediaan.
          </p>
        </div>
        <Button className="h-9 text-xs font-semibold" asChild>
          <Link href="/meja/new">Tambah Meja</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">Manajemen Meja</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Fitur manajemen meja akan segera hadir. Kelola layout meja, area smoking/non-smoking, 
            dan status meja (kosong/terisi/reserved) dalam satu tempat.
          </p>
        </div>
      </div>
    </div>
  );
}
