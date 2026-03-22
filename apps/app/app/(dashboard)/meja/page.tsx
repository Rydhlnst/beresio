import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@repo/ui/button";
import { Plus, LayoutGrid } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Manajemen Meja - Beres",
  description: "Kelola meja dan area restoran",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manajemen Meja</h1>
          <p className="text-muted-foreground">
            Kelola meja, area, dan status ketersediaan
          </p>
        </div>
        <Button asChild>
          <Link href="/meja/new">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Meja
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <LayoutGrid className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">Manajemen Meja</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Fitur manajemen meja akan segera hadir. Kelola layout meja, area smoking/non-smoking, 
            dan status meja (kosong/terisi/reserved) dalam satu tempat.
          </p>
        </div>
      </div>
    </div>
  );
}
