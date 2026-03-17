"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { cn } from "@/lib/utils";
import {
    CheckCircle2,
    Clock,
    CreditCard,
    MapPin,
    Package,
    Search,
    User,
    XCircle,
} from "lucide-react";

type OrderStatus = "Pending" | "Proses" | "Selesai" | "Batal";

type OrderItem = {
    name: string;
    qty: number;
    price: number;
};

type OrderTimeline = {
    label: string;
    time: string;
    status: "done" | "active" | "upcoming";
};

type OrderRecord = {
    id: string;
    branch: string;
    customer: string;
    status: OrderStatus;
    total: number;
    time: string;
    type: "Pickup" | "Delivery" | "Walk-in";
    items: OrderItem[];
    timeline: OrderTimeline[];
    payment: {
        method: string;
        status: string;
    };
};

const ORDERS: OrderRecord[] = [
    {
        id: "ORD-1021",
        branch: "Beres Laundry Sudirman",
        customer: "Rina Anjani",
        status: "Pending",
        total: 82000,
        time: "10:24",
        type: "Pickup",
        items: [
            { name: "Cuci Kering", qty: 2, price: 25000 },
            { name: "Setrika", qty: 1, price: 32000 },
        ],
        timeline: [
            { label: "Order dibuat", time: "10:12", status: "done" },
            { label: "Menunggu konfirmasi", time: "10:24", status: "active" },
            { label: "Diproses", time: "-", status: "upcoming" },
            { label: "Selesai", time: "-", status: "upcoming" },
        ],
        payment: { method: "QRIS", status: "Menunggu" },
    },
    {
        id: "ORD-1020",
        branch: "Beres Laundry Kemang",
        customer: "Bagas Pratama",
        status: "Proses",
        total: 54000,
        time: "09:52",
        type: "Walk-in",
        items: [
            { name: "Cuci Basah", qty: 3, price: 18000 },
        ],
        timeline: [
            { label: "Order dibuat", time: "09:30", status: "done" },
            { label: "Diproses", time: "09:52", status: "active" },
            { label: "Selesai", time: "-", status: "upcoming" },
        ],
        payment: { method: "Tunai", status: "Lunas" },
    },
    {
        id: "ORD-1019",
        branch: "Beres Laundry Depok",
        customer: "Shinta Lestari",
        status: "Selesai",
        total: 120000,
        time: "Kemarin",
        type: "Delivery",
        items: [
            { name: "Dry Clean", qty: 4, price: 30000 },
        ],
        timeline: [
            { label: "Order dibuat", time: "Kemarin", status: "done" },
            { label: "Diproses", time: "Kemarin", status: "done" },
            { label: "Selesai", time: "Kemarin", status: "done" },
        ],
        payment: { method: "Transfer", status: "Lunas" },
    },
    {
        id: "ORD-1018",
        branch: "Beres Laundry Sudirman",
        customer: "Dimas Hendra",
        status: "Batal",
        total: 32000,
        time: "Kemarin",
        type: "Pickup",
        items: [
            { name: "Cuci Kering", qty: 1, price: 32000 },
        ],
        timeline: [
            { label: "Order dibuat", time: "Kemarin", status: "done" },
            { label: "Dibatalkan", time: "Kemarin", status: "active" },
        ],
        payment: { method: "QRIS", status: "Refund" },
    },
];

const STATUS_TABS: Array<"Semua" | OrderStatus> = ["Semua", "Pending", "Proses", "Selesai", "Batal"];

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function statusBadge(status: OrderStatus) {
    if (status === "Selesai") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "Proses") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "Batal") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-muted/50 text-muted-foreground border-border";
}

function timelineIcon(status: OrderTimeline["status"]) {
    if (status === "done") return CheckCircle2;
    if (status === "active") return Clock;
    return XCircle;
}

export function OrderPageClient() {
    const { refresh } = useTransitionRouter();
    const [activeStatus, setActiveStatus] = useState<(typeof STATUS_TABS)[number]>("Semua");
    const [selectedId, setSelectedId] = useState<string | null>(ORDERS[0]?.id ?? null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const interval = window.setInterval(() => {
            refresh();
        }, 30000);
        return () => window.clearInterval(interval);
    }, [refresh]);

    const filteredOrders = useMemo(() => {
        const statusFiltered = activeStatus === "Semua"
            ? ORDERS
            : ORDERS.filter((order) => order.status === activeStatus);

        const query = searchQuery.trim().toLowerCase();
        if (!query) return statusFiltered;

        return statusFiltered.filter((order) => (
            order.id.toLowerCase().includes(query) ||
            order.customer.toLowerCase().includes(query) ||
            order.branch.toLowerCase().includes(query) ||
            order.status.toLowerCase().includes(query)
        ));
    }, [activeStatus, searchQuery]);

    const selectedOrder = filteredOrders.find((order) => order.id === selectedId) ?? null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Order</h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Pantau semua order lintas cabang dan identifikasi bottleneck.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <Select defaultValue="all-branch">
                        <SelectTrigger>
                            <SelectValue placeholder="Semua cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-branch">Semua cabang</SelectItem>
                            <SelectItem value="sudirman">Sudirman</SelectItem>
                            <SelectItem value="kemang">Kemang</SelectItem>
                            <SelectItem value="depok">Depok</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select defaultValue="all-status">
                        <SelectTrigger>
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-status">Semua status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="proses">Proses</SelectItem>
                            <SelectItem value="selesai">Selesai</SelectItem>
                            <SelectItem value="batal">Batal</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select defaultValue="all-type">
                        <SelectTrigger>
                            <SelectValue placeholder="Semua tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-type">Semua tipe</SelectItem>
                            <SelectItem value="pickup">Pickup</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                            <SelectItem value="walkin">Walk-in</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="date" />
                </div>

                <Tabs value={activeStatus} onValueChange={(value) => setActiveStatus(value as typeof activeStatus)}>
                    <TabsList className="w-full justify-start gap-1 bg-muted/40">
                        {STATUS_TABS.map((status) => (
                            <TabsTrigger key={status} value={status} className="text-xs">
                                {status}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div className="rounded-xl border border-border/60 bg-card">
                    <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Daftar Order</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total {filteredOrders.length} order aktif.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Cari order, customer, cabang..."
                                    className="h-9 pl-9"
                                />
                            </div>
                            <Button variant="outline" className="h-8 text-xs font-semibold">
                                Export
                            </Button>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No. Order</TableHead>
                                <TableHead>Cabang</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Waktu</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow
                                    key={order.id}
                                    data-state={order.id === selectedId ? "selected" : undefined}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedId(order.id)}
                                >
                                    <TableCell className="font-semibold">{order.id}</TableCell>
                                    <TableCell>{order.branch}</TableCell>
                                    <TableCell>{order.customer}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn("border text-[11px] font-semibold", statusBadge(order.status))}
                                        >
                                            {order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(order.total)}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{order.time}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="rounded-xl border border-border/60 bg-card">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Detail Order</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Klik baris untuk melihat detail.
                            </p>
                        </div>
                        {selectedOrder ? (
                            <Badge variant="outline" className={cn("border text-[11px] font-semibold", statusBadge(selectedOrder.status))}>
                                {selectedOrder.status}
                            </Badge>
                        ) : null}
                    </div>
                    {!selectedOrder ? (
                        <div className="p-6">
                            <CardEmptyState
                                icon={Package}
                                title="Belum ada order dipilih"
                                description="Pilih order di sebelah kiri untuk melihat detail."
                            />
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Customer</p>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {selectedOrder.customer}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.type}</p>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Cabang</p>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {selectedOrder.branch}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.time}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Item Order</p>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-semibold text-foreground">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.qty} item</p>
                                            </div>
                                            <p className="font-semibold text-foreground">{formatCurrency(item.price)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Timeline Status</p>
                                <div className="space-y-3">
                                    {selectedOrder.timeline.map((step) => {
                                        const Icon = timelineIcon(step.status);
                                        return (
                                            <div key={step.label} className="flex items-center gap-3 text-sm">
                                                <Icon className={cn(
                                                    "h-4 w-4",
                                                    step.status === "done" && "text-emerald-500",
                                                    step.status === "active" && "text-amber-500",
                                                    step.status === "upcoming" && "text-muted-foreground/60"
                                                )} />
                                                <div className="flex-1">
                                                    <p className={cn(
                                                        "font-semibold",
                                                        step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"
                                                    )}>
                                                        {step.label}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{step.time}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Pembayaran</p>
                                    <p className="text-sm font-semibold text-foreground mt-1">{selectedOrder.payment.method}</p>
                                    <p className="text-xs text-muted-foreground">{selectedOrder.payment.status}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    {formatCurrency(selectedOrder.total)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
