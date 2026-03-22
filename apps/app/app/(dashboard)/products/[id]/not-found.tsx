import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Package, ArrowLeft } from "lucide-react";

export default function ProductNotFound() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
                <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Produk Tidak Ditemukan</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Produk yang Anda cari tidak ditemukan atau mungkin sudah dihapus.
            </p>
            <Button className="mt-6" asChild>
                <Link href="/products">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Katalog
                </Link>
            </Button>
        </div>
    );
}
