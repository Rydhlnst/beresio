"use client";

import { useMemo, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Input } from "@repo/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@repo/ui/sheet";
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";

type ProductStock = {
    id: string;
    name: string;
    stocks: Record<string, number>;
};

const BRANCHES = ["Sudirman", "Kemang", "Depok"];

const PRODUCTS: ProductStock[] = [
    { id: "prd-01", name: "Detergen Premium", stocks: { Sudirman: 14, Kemang: 4, Depok: 0 } },
    { id: "prd-02", name: "Pewangi Lavender", stocks: { Sudirman: 7, Kemang: 8, Depok: 6 } },
    { id: "prd-03", name: "Plastic Bag", stocks: { Sudirman: 3, Kemang: 2, Depok: 1 } },
    { id: "prd-04", name: "Hanger", stocks: { Sudirman: 25, Kemang: 12, Depok: 9 } },
];

const TRANSFER_REQUESTS = [
    { id: "TRF-44", from: "Kemang", to: "Sudirman", product: "Detergen Premium", qty: 8, status: "Pending" },
    { id: "TRF-43", from: "Depok", to: "Kemang", product: "Plastic Bag", qty: 20, status: "Pending" },
];

const ADJUSTMENT_HISTORY = [
    { id: "ADJ-10", product: "Detergen Premium", branch: "Sudirman", qty: "+5", by: "Rina", reason: "Stok baru", time: "Hari ini" },
    { id: "ADJ-09", product: "Plastic Bag", branch: "Depok", qty: "-10", by: "Bagas", reason: "Rusak", time: "Kemarin" },
];

function getStatus(stocks: Record<string, number>) {
    const values = Object.values(stocks);
    const minValue = Math.min(...values);
    if (minValue === 0) return "Habis";
    if (minValue <= 5) return "Low";
    return "OK";
}

function statusBadge(status: string) {
    if (status === "OK") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "Low") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
}

export function InventoryPageClient() {
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [productQuery, setProductQuery] = useState("");
    const [historyQuery, setHistoryQuery] = useState("");

    const tableRows = useMemo(() => {
        return PRODUCTS.map((product) => ({
            ...product,
            status: getStatus(product.stocks),
        }));
    }, []);

    const filteredRows = useMemo(() => {
        const query = productQuery.trim().toLowerCase();
        if (!query) return tableRows;
        return tableRows.filter((row) => (
            row.name.toLowerCase().includes(query) ||
            row.status.toLowerCase().includes(query)
        ));
    }, [productQuery, tableRows]);

    const filteredHistory = useMemo(() => {
        const query = historyQuery.trim().toLowerCase();
        if (!query) return ADJUSTMENT_HISTORY;
        return ADJUSTMENT_HISTORY.filter((row) => (
            row.product.toLowerCase().includes(query) ||
            row.branch.toLowerCase().includes(query) ||
            row.by.toLowerCase().includes(query) ||
            row.reason.toLowerCase().includes(query)
        ));
    }, [historyQuery]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Inventory</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Pantau stok lintas cabang dan ajukan transfer.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-muted/40">
                    <TabsTrigger value="overview" className="text-xs">Stok Overview</TabsTrigger>
                    <TabsTrigger value="transfer" className="text-xs">Transfer</TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">Riwayat</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="w-full sm:max-w-xs">
                            <Select defaultValue="all">
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Cabang</SelectItem>
                                    {BRANCHES.map((branch) => (
                                        <SelectItem key={branch} value={branch.toLowerCase()}>{branch}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" className="h-9 text-xs font-semibold">
                            Export
                        </Button>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card">
                        <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Stok Produk</h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total {filteredRows.length} produk.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={productQuery}
                                    onChange={(event) => setProductQuery(event.target.value)}
                                    placeholder="Cari produk..."
                                    className="h-9 pl-9"
                                />
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    {BRANCHES.map((branch) => (
                                        <TableHead key={branch}>{branch}</TableHead>
                                    ))}
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className={cn(
                                            row.status === "Low" && "bg-amber-50/60",
                                            row.status === "Habis" && "bg-rose-50/60"
                                        )}
                                    >
                                        <TableCell className="font-semibold">{row.name}</TableCell>
                                        {BRANCHES.map((branch) => (
                                            <TableCell key={branch} className={cn(
                                                row.stocks[branch] === 0 && "text-rose-700 font-semibold"
                                            )}>
                                                {row.stocks[branch]}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn("border text-[11px] font-semibold", statusBadge(row.status))}
                                            >
                                                {row.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                className="h-8 text-xs font-semibold"
                                                onClick={() => {
                                                    setSelectedProduct(row);
                                                    setSheetOpen(true);
                                                }}
                                            >
                                                Tambah Stok
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="transfer" className="mt-4 space-y-4">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Permintaan Transfer</h2>
                                <p className="text-xs text-muted-foreground mt-1">Menunggu approval owner.</p>
                            </div>
                            {TRANSFER_REQUESTS.length === 0 ? (
                                <CardEmptyState
                                    icon={AlertTriangle}
                                    title="Belum ada permintaan"
                                    description="Semua transfer sudah diselesaikan."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {TRANSFER_REQUESTS.map((req) => (
                                        <div key={req.id} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-foreground">{req.product}</p>
                                                <Badge variant="outline" className="text-[11px] font-semibold border border-amber-200 text-amber-700 bg-amber-50">
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {req.from} → {req.to} • {req.qty} pcs
                                            </p>
                                            <div className="mt-3 flex gap-2">
                                                <Button variant="outline" className="h-8 text-xs font-semibold">Tolak</Button>
                                                <Button className="h-8 text-xs font-semibold">Setujui</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Form Transfer</h2>
                                <p className="text-xs text-muted-foreground mt-1">Ajukan transfer antar cabang.</p>
                            </div>
                            <div className="space-y-3">
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Dari Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BRANCHES.map((branch) => (
                                            <SelectItem key={branch} value={branch.toLowerCase()}>{branch}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ke Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BRANCHES.map((branch) => (
                                            <SelectItem key={branch} value={branch.toLowerCase()}>{branch}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Produk" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRODUCTS.map((product) => (
                                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input type="number" placeholder="Jumlah" />
                                <Button className="w-full h-9 text-xs font-semibold">Ajukan Transfer</Button>
                            </div>
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    Transfer selesai akan masuk ke riwayat otomatis.
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4 space-y-4">
                    <div className="rounded-xl border border-border/60 bg-card">
                        <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-foreground">Riwayat Penyesuaian</h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Total {filteredHistory.length} riwayat.
                                </p>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={historyQuery}
                                    onChange={(event) => setHistoryQuery(event.target.value)}
                                    placeholder="Cari produk, cabang..."
                                    className="h-9 pl-9"
                                />
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Cabang</TableHead>
                                    <TableHead>Perubahan</TableHead>
                                    <TableHead>Oleh</TableHead>
                                    <TableHead>Alasan</TableHead>
                                    <TableHead>Waktu</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHistory.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-semibold">{row.product}</TableCell>
                                        <TableCell>{row.branch}</TableCell>
                                        <TableCell className={cn(
                                            row.qty.startsWith("+") ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"
                                        )}>
                                            {row.qty}
                                        </TableCell>
                                        <TableCell>{row.by}</TableCell>
                                        <TableCell>{row.reason}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{row.time}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Tambah Stok</SheetTitle>
                        <SheetDescription>
                            {selectedProduct ? selectedProduct.name : "Pilih produk dulu."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                {BRANCHES.map((branch) => (
                                    <SelectItem key={branch} value={branch.toLowerCase()}>{branch}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Input type="number" placeholder="Jumlah tambah" />
                        <Input placeholder="Alasan / catatan" />
                    </div>
                    <SheetFooter className="mt-6">
                        <Button className="w-full h-9 text-xs font-semibold">Simpan</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
