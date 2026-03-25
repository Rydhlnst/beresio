import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@repo/ui/button";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Menu & Resep | Beres",
  description: "Kelola daftar menu, kategori, dan resep masakan",
};

export default async function MenuPage() {
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
          <h1 className="text-2xl font-semibold text-foreground">Menu & Resep</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Kelola daftar menu, kategori, dan resep masakan.
          </p>
        </div>
        <Button className="h-9 text-xs font-semibold" asChild>
          <Link href="/menu/new">Tambah Menu</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">Menu & Resep</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Fitur menu dan resep akan segera hadir. Kelola katalog menu, 
            harga, kategori, dan resep bahan dengan integrasi inventory.
          </p>
        </div>
      </div>
    </div>
  );
}
