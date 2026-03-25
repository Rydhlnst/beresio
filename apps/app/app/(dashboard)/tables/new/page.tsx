import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { createDbNextjs } from "@beresio/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Tambah Meja | Beres",
  description: "Tambah meja baru",
};

export default async function NewMejaPage() {
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
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/meja">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tambah Meja</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Tambahkan meja baru ke restoran.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-8">
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
          <h3 className="mt-4 text-lg font-semibold text-foreground">Form Tambah Meja</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Form pembuatan meja baru akan segera hadir. Fitur ini sedang dalam pengembangan.
          </p>
        </div>
      </div>
    </div>
  );
}
