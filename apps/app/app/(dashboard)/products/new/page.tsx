import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Tambah Produk - Beres",
  description: "Tambah produk baru",
};

export default async function NewProductPage() {
  const db = createDbNextjs(process.env.DATABASE_URL!);
  const authInstance = auth(db);
  const reqHeaders = await headers();

  const session = await authInstance.api.getSession({ headers: reqHeaders });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tambah Produk</h1>
          <p className="text-muted-foreground">
            Tambahkan produk baru ke katalog
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium">Form Tambah Produk</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Form pembuatan produk baru akan segera hadir. Fitur ini sedang dalam pengembangan.
          </p>
        </div>
      </div>
    </div>
  );
}
