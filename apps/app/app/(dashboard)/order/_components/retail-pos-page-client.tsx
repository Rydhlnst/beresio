"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/select";
import { ScrollArea } from "@repo/ui/scroll-area";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { cn, formatRupiah } from "@/lib/utils";
import { createTransactionAction } from "../_actions/transactions";

type PosProduct = {
    id: string;
    name: string;
    imageUrl: string | null;
    pricing: {
        basePrice: number;
        salePrice: number | null;
    };
    stock: {
        quantity: number | null;
        status: "ok" | "low" | "out" | "unknown";
    };
};

type BranchOption = { id: string; name: string };
type CustomerOption = { id: string; name: string; phone: string | null };

type CartItem = {
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    stockQuantity: number | null;
};

type RetailPosPageClientProps = {
    products: PosProduct[];
    branches: BranchOption[];
    customers: CustomerOption[];
    recentTransactions: Array<{
        id: string;
        amount: number;
        discountAmount: number;
        taxAmount: number;
        paymentMethod: string | null;
        createdAt: string;
        customer: { id: string; name: string } | null;
    }>;
};

const transactionSchema = z.object({
    branchId: z.string().min(1, "Cabang wajib dipilih"),
    customerId: z.string().optional().nullable(),
    paymentMethod: z.enum(["cash", "transfer", "qris"]).optional().nullable(),
    discountAmount: z.number().min(0).default(0),
    taxAmount: z.number().min(0).default(0),
    items: z.array(
        z.object({
            productId: z.string().min(1),
            quantity: z.number().int().positive(),
            unitPrice: z.number().min(0),
        })
    ).min(1, "Minimal 1 item"),
});

type ReceiptData = {
    id: string;
    createdAt: string;
    branchName: string;
    customerName: string;
    paymentMethod: string;
    items: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
};

function stockBadge(status: PosProduct["stock"]["status"], quantity: number | null) {
    if (quantity === null) return { label: "Non-stock", className: "bg-muted text-muted-foreground border-border" };
    if (status === "out") return { label: "Habis", className: "bg-rose-50 text-rose-700 border-rose-200" };
    if (status === "low") return { label: "Menipis", className: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Tersedia", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

export function RetailPosPageClient({
    products,
    branches,
    customers,
    recentTransactions,
}: RetailPosPageClientProps) {
    const normalizedBranches = branches;
    const normalizedCustomers = customers;

    const [search, setSearch] = useState("");
    const [branchId, setBranchId] = useState(normalizedBranches[0]?.id ?? "");
    const [customerId, setCustomerId] = useState<string>("none");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "qris">("cash");
    const [discountMode, setDiscountMode] = useState<"nominal" | "percent">("nominal");
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [taxMode, setTaxMode] = useState<"nominal" | "percent">("nominal");
    const [taxAmount, setTaxAmount] = useState(0);
    const [taxPercent, setTaxPercent] = useState(0);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recent, setRecent] = useState(recentTransactions);
    const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return products;
        return products.filter((product) => (
            product.name.toLowerCase().includes(query)
        ));
    }, [products, search]);

    const cartSubtotal = useMemo(() => (
        cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    ), [cart]);

    const effectiveDiscount = useMemo(() => {
        if (discountMode === "percent") {
            return Math.max(0, Math.round(cartSubtotal * (discountPercent / 100)));
        }
        return Math.max(0, discountAmount);
    }, [cartSubtotal, discountMode, discountAmount, discountPercent]);

    const effectiveTax = useMemo(() => {
        if (taxMode === "percent") {
            return Math.max(0, Math.round(cartSubtotal * (taxPercent / 100)));
        }
        return Math.max(0, taxAmount);
    }, [cartSubtotal, taxMode, taxAmount, taxPercent]);

    const cartTotal = useMemo(() => (
        Math.max(0, cartSubtotal - effectiveDiscount + effectiveTax)
    ), [cartSubtotal, effectiveDiscount, effectiveTax]);

    const totalItems = useMemo(() => (
        cart.reduce((sum, item) => sum + item.quantity, 0)
    ), [cart]);

    const addToCart = (product: PosProduct) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.productId === product.id);
            const price = product.pricing.salePrice ?? product.pricing.basePrice;
            const stockQuantity = product.stock.quantity ?? null;

            if (existing) {
                const nextQty = existing.quantity + 1;
                if (stockQuantity !== null && nextQty > stockQuantity) {
                    toast.error("Stok tidak mencukupi");
                    return prev;
                }
                return prev.map((item) =>
                    item.productId === product.id
                        ? { ...item, quantity: nextQty }
                        : item
                );
            }

            if (stockQuantity !== null && stockQuantity <= 0) {
                toast.error("Stok produk habis");
                return prev;
            }

            return [
                ...prev,
                {
                    productId: product.id,
                    name: product.name,
                    unitPrice: price,
                    quantity: 1,
                    stockQuantity,
                },
            ];
        });
    };

    const updateQuantity = (productId: string, nextQty: number) => {
        setCart((prev) => prev.map((item) => {
            if (item.productId !== productId) return item;
            const clamped = Math.max(1, nextQty);
            if (item.stockQuantity !== null && clamped > item.stockQuantity) {
                toast.error("Stok tidak mencukupi");
                return item;
            }
            return { ...item, quantity: clamped };
        }));
    };

    const removeItem = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.productId !== productId));
    };

    const clearCart = () => setCart([]);

    const handleSubmit = async () => {
        const payload = {
            branchId,
            customerId: customerId === "none" ? null : customerId,
            paymentMethod,
            status: "paid" as const,
            type: "sale" as const,
            discountAmount: effectiveDiscount,
            taxAmount: effectiveTax,
            items: cart.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })),
        };

        const parsed = transactionSchema.safeParse(payload);
        if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? "Data transaksi tidak valid");
            return;
        }

        setIsSubmitting(true);
        const result = await createTransactionAction(parsed.data);
        setIsSubmitting(false);

        if (!result.ok) {
            toast.error(result.error || "Gagal membuat transaksi");
            return;
        }

        toast.success("Transaksi berhasil dibuat");
        setDiscountAmount(0);
        setDiscountPercent(0);
        setTaxAmount(0);
        setTaxPercent(0);
        clearCart();

        const branchName = normalizedBranches.find((b) => b.id === branchId)?.name ?? "-";
        const customerName = customerId === "none"
            ? "Guest"
            : normalizedCustomers.find((c) => c.id === customerId)?.name ?? "Guest";

        const receipt: ReceiptData = {
            id: result.data?.id ?? "TX",
            createdAt: new Date().toISOString(),
            branchName,
            customerName,
            paymentMethod,
            items: cart.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.unitPrice * item.quantity,
            })),
            subtotal: cartSubtotal,
            discountAmount: effectiveDiscount,
            taxAmount: effectiveTax,
            total: cartTotal,
        };

        setLastReceipt(receipt);
        setRecent((prev) => [
            {
                id: receipt.id,
                amount: receipt.total,
                discountAmount: receipt.discountAmount,
                taxAmount: receipt.taxAmount,
                paymentMethod: receipt.paymentMethod,
                createdAt: receipt.createdAt,
                customer: { id: customerId, name: receipt.customerName },
            },
            ...prev,
        ].slice(0, 5));
    };

    const handlePrint = () => {
        if (!lastReceipt) return;
        const win = window.open("", "_blank", "width=380,height=640");
        if (!win) return;

        const itemsHtml = lastReceipt.items.map((item) => `
            <tr>
                <td style="padding:4px 0;">${item.name}</td>
                <td style="text-align:right;">${item.quantity} x ${formatRupiah(item.unitPrice)}</td>
                <td style="text-align:right;">${formatRupiah(item.subtotal)}</td>
            </tr>
        `).join("");

        win.document.write(`
            <html>
            <head>
                <title>Struk ${lastReceipt.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 12px; }
                    h1 { font-size: 16px; margin: 0 0 6px; }
                    .muted { color: #666; font-size: 12px; }
                    table { width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 8px; }
                    .totals td { padding-top: 6px; }
                </style>
            </head>
            <body>
                <h1>Beres POS</h1>
                <div class="muted">${lastReceipt.branchName}</div>
                <div class="muted">Transaksi: ${lastReceipt.id}</div>
                <div class="muted">${new Date(lastReceipt.createdAt).toLocaleString("id-ID")}</div>
                <div class="muted">Customer: ${lastReceipt.customerName}</div>
                <hr />
                <table>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tbody class="totals">
                        <tr><td>Subtotal</td><td></td><td style="text-align:right;">${formatRupiah(lastReceipt.subtotal)}</td></tr>
                        <tr><td>Diskon</td><td></td><td style="text-align:right;">${formatRupiah(lastReceipt.discountAmount)}</td></tr>
                        <tr><td>Pajak</td><td></td><td style="text-align:right;">${formatRupiah(lastReceipt.taxAmount)}</td></tr>
                        <tr><td><strong>Total</strong></td><td></td><td style="text-align:right;"><strong>${formatRupiah(lastReceipt.total)}</strong></td></tr>
                    </tbody>
                </table>
                <hr />
                <div class="muted">Pembayaran: ${lastReceipt.paymentMethod}</div>
            </body>
            </html>
        `);
        win.document.close();
        win.focus();
        win.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">POS / Kasir</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Buat transaksi retail dengan cepat dan akurat.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border border-border/60 text-xs text-muted-foreground">
                        {totalItems} item
                    </Badge>
                    <Badge variant="outline" className="border border-border/60 text-xs text-muted-foreground">
                        {formatRupiah(cartSubtotal)}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <Card className="border-border/60">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Pilih Produk</CardTitle>
                        <div className="relative mt-3">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Cari produk..."
                                className="h-9 pl-9"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ScrollArea className="h-[560px] pr-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {filteredProducts.map((product) => {
                                    const price = product.pricing.salePrice ?? product.pricing.basePrice;
                                    const badge = stockBadge(product.stock.status, product.stock.quantity);
                                    const isOut = product.stock.quantity !== null && product.stock.quantity <= 0;

                                    return (
                                        <button
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            disabled={isOut}
                                            className={cn(
                                                "text-left rounded-xl border border-border/60 bg-card p-3 transition-colors",
                                                isOut ? "opacity-60 cursor-not-allowed" : "hover:border-primary/40 hover:bg-primary/5"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatRupiah(price)}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className={cn("text-[10px] border", badge.className)}>
                                                    {badge.label}
                                                </Badge>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                                <span>
                                                    Stok: {product.stock.quantity ?? "-"}
                                                </span>
                                                <span className="font-semibold text-primary">Tambah</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {filteredProducts.length === 0 ? (
                                <div className="py-10 text-center text-sm text-muted-foreground">
                                    Produk tidak ditemukan.
                                </div>
                            ) : null}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Keranjang
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Cabang</p>
                                <Select value={branchId} onValueChange={setBranchId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Pilih cabang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {normalizedBranches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Customer (opsional)</p>
                                <Select value={customerId} onValueChange={setCustomerId}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Pilih customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Tanpa customer</SelectItem>
                                        {normalizedCustomers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Metode Pembayaran</p>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(value) => {
                                        if (value === "cash" || value === "transfer" || value === "qris") {
                                            setPaymentMethod(value);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Pilih metode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="transfer">Transfer</SelectItem>
                                        <SelectItem value="qris">QRIS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Diskon</p>
                                <Select
                                    value={discountMode}
                                    onValueChange={(value) => {
                                        if (value === "nominal" || value === "percent") setDiscountMode(value);
                                    }}
                                >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Pilih mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nominal">Nominal</SelectItem>
                                            <SelectItem value="percent">Persentase</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={discountMode === "percent" ? discountPercent : discountAmount}
                                        onChange={(event) => {
                                            const value = Number(event.target.value);
                                            if (discountMode === "percent") setDiscountPercent(value);
                                            else setDiscountAmount(value);
                                        }}
                                        className="mt-2"
                                        placeholder={discountMode === "percent" ? "%" : "Rp"}
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Pajak</p>
                                <Select
                                    value={taxMode}
                                    onValueChange={(value) => {
                                        if (value === "nominal" || value === "percent") setTaxMode(value);
                                    }}
                                >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Pilih mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nominal">Nominal</SelectItem>
                                            <SelectItem value="percent">Persentase</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={taxMode === "percent" ? taxPercent : taxAmount}
                                        onChange={(event) => {
                                            const value = Number(event.target.value);
                                            if (taxMode === "percent") setTaxPercent(value);
                                            else setTaxAmount(value);
                                        }}
                                        className="mt-2"
                                        placeholder={taxMode === "percent" ? "%" : "Rp"}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {cart.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                                Keranjang masih kosong.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.productId} className="rounded-lg border border-border/60 p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatRupiah(item.unitPrice)} x {item.quantity}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-rose-600"
                                                onClick={() => removeItem(item.productId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={item.quantity}
                                                    onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                                                    className="h-8 w-16 text-center"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">
                                                {formatRupiah(item.unitPrice * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs font-semibold text-muted-foreground"
                                    onClick={clearCart}
                                >
                                    Kosongkan Keranjang
                                </Button>
                            </div>
                        )}

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-semibold text-foreground">{formatRupiah(cartSubtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Diskon</span>
                                <span className="font-semibold text-foreground">{formatRupiah(effectiveDiscount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Pajak</span>
                                <span className="font-semibold text-foreground">{formatRupiah(effectiveTax)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total</span>
                                <span className="font-semibold text-foreground">{formatRupiah(cartTotal)}</span>
                            </div>
                            <Button
                                className="w-full h-10 text-sm font-semibold"
                                onClick={handleSubmit}
                                disabled={isSubmitting || cart.length === 0}
                            >
                                {isSubmitting ? "Memproses..." : "Buat Transaksi"}
                            </Button>
                            {lastReceipt ? (
                                <Button
                                    variant="outline"
                                    className="w-full h-10 text-sm font-semibold"
                                    onClick={handlePrint}
                                >
                                    Print Struk Terakhir
                                </Button>
                            ) : null}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Transaksi Terbaru</p>
                            {recent.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Belum ada transaksi.</p>
                            ) : (
                                <div className="space-y-2">
                                    {recent.map((tx) => (
                                        <div key={tx.id} className="rounded-lg border border-border/60 p-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <p className="font-semibold text-foreground">
                                                    {tx.customer?.name ?? "Guest"}
                                                </p>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatRupiah(tx.amount)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {tx.paymentMethod ?? "cash"} - {new Date(tx.createdAt).toLocaleString("id-ID")}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
