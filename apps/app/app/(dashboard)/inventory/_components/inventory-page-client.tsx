"use client";

import { useMemo, useState } from "react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@repo/ui/dialog";
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import {
    createInventoryAdjustmentAction,
    createInventoryTransferAction,
    updateInventoryTransferStatusAction,
    createProductAction,
    updateProductAction,
    deleteProductAction,
} from "../_actions/inventory";

type ProductStock = {
    id: string;
    name: string;
    stocks: Record<string, number>;
};

type InventoryBranch = { id: string; name: string };
type InventoryProduct = {
    id: string;
    name: string;
    stocks?: Array<{ branchId: string | null; branchName?: string | null; quantity: number | string }>;
};
type InventoryTransfer = {
    id: string;
    product?: { id: string; name: string } | null;
    fromBranch?: { id: string; name: string } | null;
    toBranch?: { id: string; name: string } | null;
    quantity?: number | string | null;
    status?: string | null;
    note?: string | null;
};
type InventoryAdjustment = {
    id: string;
    product?: { id: string; name: string } | null;
    branch?: { id: string; name: string } | null;
    quantityDelta?: number | string | null;
    reason?: string | null;
    actor?: { id: string; name: string } | null;
    createdAt?: string | null;
};

function getStatus(stocks: Record<string, number>) {
    const values = Object.values(stocks);
    const minValue = Math.min(...values);
    if (minValue === 0) return "Habis";
    if (minValue <= 5) return "Low";
    return "OK";
}

function rowHighlight(status: string) {
    // Subtle row highlighting based on status
    if (status === "OK") return "row-success";
    if (status === "Low") return "row-warning";
    if (status === "Habis") return "row-error";
    return "";
}

const adjustmentSchema = z.object({
    branchId: z.string().min(1, "Cabang wajib dipilih"),
    quantityDelta: z.number().int().positive("Jumlah harus lebih dari 0"),
    reason: z.string().optional(),
});

const transferSchema = z.object({
    fromBranchId: z.string().min(1, "Cabang asal wajib dipilih"),
    toBranchId: z.string().min(1, "Cabang tujuan wajib dipilih"),
    productId: z.string().min(1, "Produk wajib dipilih"),
    quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
    note: z.string().optional(),
}).refine((data) => data.fromBranchId !== data.toBranchId, {
    message: "Cabang asal dan tujuan harus berbeda",
    path: ["toBranchId"],
});

const productSchema = z.object({
    name: z.string().min(1, "Nama produk wajib diisi"),
    sku: z.string().optional(),
    unit: z.string().min(1, "Satuan wajib diisi"),
});

function transferStatusLabel(status?: string | null) {
    if (!status) return "Pending";
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    if (status === "cancelled") return "Cancelled";
    if (status === "pending") return "Pending";
    return status;
}

function formatDateLabel(value?: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

type InventoryPageClientProps = {
    branches: InventoryBranch[];
    products: InventoryProduct[];
    transfers: InventoryTransfer[];
    adjustments: InventoryAdjustment[];
};

export function InventoryPageClient({
    branches,
    products,
    transfers,
    adjustments,
}: InventoryPageClientProps) {
    const { refresh } = useTransitionRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [productQuery, setProductQuery] = useState("");
    const [historyQuery, setHistoryQuery] = useState("");
    const [transferActionPending, setTransferActionPending] = useState<string | null>(null);
    
    // Product form states
    const [productSheetOpen, setProductSheetOpen] = useState(false);
    const [productSheetMode, setProductSheetMode] = useState<"create" | "edit">("create");
    const [editingProduct, setEditingProduct] = useState<ProductStock | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<ProductStock | null>(null);
    const [productActionPending, setProductActionPending] = useState(false);

    const tableRows = useMemo(() => {
        return products.map((product) => {
            const stocks: Record<string, number> = {};
            for (const branch of branches) {
                stocks[branch.name] = 0;
            }
            for (const stock of product.stocks ?? []) {
                const branchName = stock.branchName ?? branches.find((b) => b.id === stock.branchId)?.name;
                if (!branchName) continue;
                stocks[branchName] = Number(stock.quantity ?? 0);
            }
            return {
                id: product.id,
                name: product.name,
                stocks,
                status: getStatus(stocks),
            };
        });
    }, [branches, products]);

    const transferRequests = useMemo(() => {
        return transfers.map((transfer) => ({
            id: transfer.id,
            from: transfer.fromBranch?.name ?? "-",
            to: transfer.toBranch?.name ?? "-",
            product: transfer.product?.name ?? "-",
            qty: Number(transfer.quantity ?? 0),
            status: transferStatusLabel(transfer.status),
            rawStatus: transfer.status ?? "pending",
            note: transfer.note ?? null,
        }));
    }, [transfers]);

    const adjustmentHistory = useMemo(() => {
        return adjustments.map((row) => ({
            id: row.id,
            product: row.product?.name ?? "-",
            branch: row.branch?.name ?? "-",
            qty: `${Number(row.quantityDelta ?? 0) >= 0 ? "+" : ""}${Number(row.quantityDelta ?? 0)}`,
            by: row.actor?.name ?? "-",
            reason: row.reason ?? "-",
            time: formatDateLabel(row.createdAt ?? null),
        }));
    }, [adjustments]);

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
        if (!query) return adjustmentHistory;
        return adjustmentHistory.filter((row) => (
            row.product.toLowerCase().includes(query) ||
            row.branch.toLowerCase().includes(query) ||
            row.by.toLowerCase().includes(query) ||
            row.reason.toLowerCase().includes(query)
        ));
    }, [historyQuery, adjustmentHistory]);

    const adjustmentForm = useForm({
        defaultValues: {
            branchId: "",
            quantityDelta: 1,
            reason: "",
        },
        onSubmit: async ({ value }) => {
            if (!selectedProduct) {
                toast.error("Pilih produk terlebih dahulu.");
                return;
            }
            const parsed = adjustmentSchema.safeParse({
                ...value,
                reason: value.reason?.trim() || undefined,
            });
            if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Form tidak valid.");
                return;
            }
            const result = await createInventoryAdjustmentAction({
                productId: selectedProduct.id,
                ...parsed.data,
            });
            if (!result.ok) {
                toast.error(result.error || "Gagal menambahkan stok.");
                return;
            }
            toast.success("Stok berhasil diperbarui.");
            setSheetOpen(false);
            refresh();
        },
    });

    const transferForm = useForm({
        defaultValues: {
            fromBranchId: "",
            toBranchId: "",
            productId: "",
            quantity: 1,
            note: "",
        },
        onSubmit: async ({ value }) => {
            const parsed = transferSchema.safeParse({
                ...value,
                note: value.note?.trim() || undefined,
            });
            if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Form tidak valid.");
                return;
            }
            const result = await createInventoryTransferAction(parsed.data);
            if (!result.ok) {
                toast.error(result.error || "Gagal mengajukan transfer.");
                return;
            }
            toast.success("Transfer berhasil diajukan.");
            transferForm.reset({
                fromBranchId: "",
                toBranchId: "",
                productId: "",
                quantity: 1,
                note: "",
            });
            refresh();
        },
    });

    const handleTransferStatus = async (transferId: string, status: "approved" | "rejected" | "cancelled") => {
        setTransferActionPending(`${transferId}:${status}`);
        const result = await updateInventoryTransferStatusAction(transferId, status);
        setTransferActionPending(null);
        if (!result.ok) {
            toast.error(result.error || "Gagal memperbarui transfer.");
            return;
        }
        toast.success("Status transfer diperbarui.");
        refresh();
    };

    // Product form handlers
    const openCreateProduct = () => {
        setProductSheetMode("create");
        setEditingProduct(null);
        productForm.reset({ name: "", sku: "", unit: "pcs" });
        setProductSheetOpen(true);
    };

    const openEditProduct = (product: ProductStock) => {
        setProductSheetMode("edit");
        setEditingProduct(product);
        productForm.reset({ 
            name: product.name, 
            sku: "", 
            unit: "pcs" 
        });
        setProductSheetOpen(true);
    };

    const openDeleteProduct = (product: ProductStock) => {
        setDeletingProduct(product);
        setDeleteDialogOpen(true);
    };

    const productForm = useForm({
        defaultValues: {
            name: "",
            sku: "",
            unit: "pcs",
        },
        onSubmit: async ({ value }) => {
            const parsed = productSchema.safeParse(value);
            if (!parsed.success) {
                toast.error(parsed.error.issues[0]?.message ?? "Form tidak valid.");
                return;
            }
            
            setProductActionPending(true);
            
            if (productSheetMode === "create") {
                const result = await createProductAction({
                    name: parsed.data.name,
                    sku: parsed.data.sku || null,
                    unit: parsed.data.unit,
                });
                if (!result.ok) {
                    toast.error(result.error || "Gagal membuat produk.");
                    setProductActionPending(false);
                    return;
                }
                toast.success("Produk berhasil dibuat.");
            } else if (productSheetMode === "edit" && editingProduct) {
                const result = await updateProductAction(editingProduct.id, {
                    name: parsed.data.name,
                    sku: parsed.data.sku || null,
                    unit: parsed.data.unit,
                });
                if (!result.ok) {
                    toast.error(result.error || "Gagal memperbarui produk.");
                    setProductActionPending(false);
                    return;
                }
                toast.success("Produk berhasil diperbarui.");
            }
            
            setProductActionPending(false);
            setProductSheetOpen(false);
            refresh();
        },
    });

    const handleDeleteProduct = async () => {
        if (!deletingProduct) return;
        
        setProductActionPending(true);
        const result = await deleteProductAction(deletingProduct.id);
        setProductActionPending(false);
        
        if (!result.ok) {
            toast.error(result.error || "Gagal menghapus produk.");
            return;
        }
        
        toast.success("Produk berhasil dihapus.");
        setDeleteDialogOpen(false);
        setDeletingProduct(null);
        refresh();
    };

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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="w-full sm:w-48">
                                <Select defaultValue="all">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Cabang</SelectItem>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button 
                                className="h-9 text-xs font-semibold"
                                onClick={openCreateProduct}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Tambah Produk
                            </Button>
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
                                {branches.map((branch) => (
                                        <TableHead key={branch.id}>{branch.name}</TableHead>
                                    ))}
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className={rowHighlight(row.status)}
                                    >
                                        <TableCell className="font-semibold">{row.name}</TableCell>
                                        {branches.map((branch) => (
                                            <TableCell key={branch.id} className={cn(
                                                row.stocks[branch.name] === 0 && "text-rose-700 font-semibold"
                                            )}>
                                                {row.stocks[branch.name]}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <StatusBadge status={row.status} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs font-semibold"
                                                    onClick={() => {
                                                        setSelectedProduct(row);
                                                        setSheetOpen(true);
                                                        adjustmentForm.reset({
                                                            branchId: "",
                                                            quantityDelta: 1,
                                                            reason: "",
                                                        });
                                                    }}
                                                >
                                                    + Stok
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => openEditProduct(row)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-rose-600 hover:text-rose-700"
                                                    onClick={() => openDeleteProduct(row)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
                            {transferRequests.length === 0 ? (
                                <CardEmptyState
                                    icon={AlertTriangle}
                                    title="Belum ada permintaan"
                                    description="Semua transfer sudah diselesaikan."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {transferRequests.map((req) => (
                                        <div key={req.id} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-foreground">{req.product}</p>
                                                <StatusBadge status={req.status} />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {req.from} {'->'} {req.to} {'->'} {req.qty} pcs
                                            </p>
                                            {req.note ? (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    Catatan: {req.note}
                                                </p>
                                            ) : null}
                                            {req.rawStatus === "pending" ? (
                                                <div className="mt-3 flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="h-8 text-xs font-semibold"
                                                        onClick={() => handleTransferStatus(req.id, "rejected")}
                                                        disabled={transferActionPending === `${req.id}:rejected`}
                                                    >
                                                        Tolak
                                                    </Button>
                                                    <Button
                                                        className="h-8 text-xs font-semibold"
                                                        onClick={() => handleTransferStatus(req.id, "approved")}
                                                        disabled={transferActionPending === `${req.id}:approved`}
                                                    >
                                                        Setujui
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 text-xs font-semibold text-muted-foreground"
                                                        onClick={() => handleTransferStatus(req.id, "cancelled")}
                                                        disabled={transferActionPending === `${req.id}:cancelled`}
                                                    >
                                                        Batalkan
                                                    </Button>
                                                </div>
                                            ) : null}
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
                            <form
                                className="space-y-3"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    transferForm.handleSubmit();
                                }}
                            >
                                <transferForm.Field name="fromBranchId">
                                    {(field) => (
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Dari Cabang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </transferForm.Field>
                                <transferForm.Field name="toBranchId">
                                    {(field) => (
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Ke Cabang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </transferForm.Field>
                                <transferForm.Field name="productId">
                                    {(field) => (
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Produk" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tableRows.map((product) => (
                                                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </transferForm.Field>
                                <transferForm.Field name="quantity">
                                    {(field) => (
                                        <Input
                                            type="number"
                                            min={1}
                                            placeholder="Jumlah"
                                            value={field.state.value}
                                            onChange={(event) => field.handleChange(Number(event.target.value))}
                                        />
                                    )}
                                </transferForm.Field>
                                <transferForm.Field name="note">
                                    {(field) => (
                                        <Input
                                            placeholder="Catatan (opsional)"
                                            value={field.state.value}
                                            onChange={(event) => field.handleChange(event.target.value)}
                                        />
                                    )}
                                </transferForm.Field>
                                <Button className="w-full h-9 text-xs font-semibold" type="submit">
                                    Ajukan Transfer
                                </Button>
                            </form>
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

            {/* Adjustment Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Tambah Stok</SheetTitle>
                        <SheetDescription>
                            {selectedProduct ? selectedProduct.name : "Pilih produk dulu."}
                        </SheetDescription>
                    </SheetHeader>
                    <form
                        className="mt-6 space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            adjustmentForm.handleSubmit();
                        }}
                    >
                        <adjustmentForm.Field name="branchId">
                            {(field) => (
                                <Select value={field.state.value} onValueChange={field.handleChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </adjustmentForm.Field>
                        <adjustmentForm.Field name="quantityDelta">
                            {(field) => (
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="Jumlah tambah"
                                    value={field.state.value}
                                    onChange={(event) => field.handleChange(Number(event.target.value))}
                                />
                            )}
                        </adjustmentForm.Field>
                        <adjustmentForm.Field name="reason">
                            {(field) => (
                                <Input
                                    placeholder="Alasan / catatan"
                                    value={field.state.value}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                />
                            )}
                        </adjustmentForm.Field>
                        <SheetFooter className="mt-6">
                            <Button className="w-full h-9 text-xs font-semibold" type="submit">
                                Simpan
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Product Create/Edit Sheet */}
            <Sheet open={productSheetOpen} onOpenChange={setProductSheetOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>{productSheetMode === "create" ? "Tambah Produk" : "Edit Produk"}</SheetTitle>
                        <SheetDescription>
                            {productSheetMode === "create" 
                                ? "Buat produk baru untuk inventory." 
                                : editingProduct?.name}
                        </SheetDescription>
                    </SheetHeader>
                    <form
                        className="mt-6 space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            productForm.handleSubmit();
                        }}
                    >
                        <productForm.Field name="name">
                            {(field) => (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nama Produk *</label>
                                    <Input
                                        placeholder="Contoh: Deterjen Cair"
                                        value={field.state.value}
                                        onChange={(event) => field.handleChange(event.target.value)}
                                    />
                                </div>
                            )}
                        </productForm.Field>
                        <productForm.Field name="sku">
                            {(field) => (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">SKU (Opsional)</label>
                                    <Input
                                        placeholder="Contoh: DET-001"
                                        value={field.state.value}
                                        onChange={(event) => field.handleChange(event.target.value)}
                                    />
                                </div>
                            )}
                        </productForm.Field>
                        <productForm.Field name="unit">
                            {(field) => (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Satuan *</label>
                                    <Select value={field.state.value} onValueChange={field.handleChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih satuan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pcs">Pcs</SelectItem>
                                            <SelectItem value="kg">Kg</SelectItem>
                                            <SelectItem value="liter">Liter</SelectItem>
                                            <SelectItem value="meter">Meter</SelectItem>
                                            <SelectItem value="pack">Pack</SelectItem>
                                            <SelectItem value="box">Box</SelectItem>
                                            <SelectItem value="botol">Botol</SelectItem>
                                            <SelectItem value="sachet">Sachet</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </productForm.Field>
                        <SheetFooter className="mt-6">
                            <Button 
                                className="w-full h-9 text-xs font-semibold" 
                                type="submit"
                                disabled={productActionPending}
                            >
                                {productActionPending 
                                    ? "Menyimpan..." 
                                    : productSheetMode === "create" ? "Buat Produk" : "Simpan Perubahan"}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Produk</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus produk <strong>{deletingProduct?.name}</strong>?
                            <br /><br />
                            Tindakan ini tidak dapat dibatalkan. Produk dengan stok yang masih ada tidak dapat dihapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={productActionPending}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProduct}
                            disabled={productActionPending}
                        >
                            {productActionPending ? "Menghapus..." : "Hapus Produk"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
