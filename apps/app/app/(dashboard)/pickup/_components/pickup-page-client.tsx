"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { ScrollArea } from "@repo/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@repo/ui/table";
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { cn } from "@/lib/utils";
import { MapPin, Search, Truck, User } from "lucide-react";

type DeliveryStatus =
    | "Dikonfirmasi"
    | "Dicuci"
    | "Siap Diantar"
    | "Dalam Pengiriman"
    | "Selesai";

type DeliveryOrder = {
    id: string;
    customer: string;
    address: string;
    eta: string;
    status: DeliveryStatus;
    driver?: string;
    items: string[];
};

const COLUMNS: DeliveryStatus[] = ["Dikonfirmasi", "Dicuci", "Siap Diantar", "Dalam Pengiriman", "Selesai"];

type PickupOrderApi = {
    id: string;
    orderNumber?: string | null;
    customer?: string | null;
    address?: string | null;
    eta?: string | null;
    status?: DeliveryStatus | string | null;
    driver?: string | null;
    items?: string[] | null;
};

const STATUS_SEQUENCE: DeliveryStatus[] = ["Dikonfirmasi", "Dicuci", "Siap Diantar", "Dalam Pengiriman", "Selesai"];

function statusBadgeClass(status: DeliveryStatus) {
    if (status === "Selesai") return "bg-primary/10 text-primary border-primary/30";
    return "bg-muted/40 text-muted-foreground border-border";
}

function statusProgressIndex(status: DeliveryStatus) {
    return STATUS_SEQUENCE.indexOf(status);
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
    return (
        <Badge variant="outline" className={cn("border text-[10px] font-semibold", statusBadgeClass(status))}>
            {status}
        </Badge>
    );
}

function OrderMeta({ order }: { order: DeliveryOrder }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{order.customer}</p>
                <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground">{order.address}</p>
            <p className="text-xs text-muted-foreground">Estimasi {order.eta}</p>
        </div>
    );
}

function StatusSteps({ status }: { status: DeliveryStatus }) {
    const activeIndex = statusProgressIndex(status);

    return (
        <div className="space-y-3">
            {STATUS_SEQUENCE.map((step, index) => {
                const isDone = index < activeIndex;
                const isActive = index === activeIndex;
                return (
                    <div key={step} className="flex items-center gap-3">
                        <span
                            className={cn(
                                "h-2.5 w-2.5 rounded-full border border-border",
                                isDone || isActive ? "bg-primary border-primary/50" : "bg-background"
                            )}
                        />
                        <div className="flex-1">
                            <p className={cn("text-sm", isActive ? "text-foreground font-semibold" : "text-muted-foreground")}>
                                {step}
                            </p>
                            {isActive ? (
                                <p className="text-xs text-muted-foreground mt-1">Menunggu update berikutnya.</p>
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

type PickupPageClientProps = {
    orders: PickupOrderApi[];
};

export function PickupPageClient({ orders: ordersInput }: PickupPageClientProps) {
    const orders: DeliveryOrder[] = useMemo(() => {
        return ordersInput.map((order) => ({
            id: order.orderNumber ?? order.id,
            customer: order.customer ?? "Unknown",
            address: order.address ?? "-",
            eta: order.eta ?? "-",
            status: (order.status as DeliveryStatus) ?? "Dikonfirmasi",
            driver: order.driver ?? undefined,
            items: order.items ?? [],
        }));
    }, [ordersInput]);

    const [view, setView] = useState<"kanban" | "list">("kanban");
    const [selectedId, setSelectedId] = useState<string | null>(orders[0]?.id ?? null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!selectedId && orders.length > 0) {
            setSelectedId(orders[0].id);
            return;
        }
        if (selectedId && !orders.find((order) => order.id === selectedId) && orders.length > 0) {
            setSelectedId(orders[0].id);
        }
    }, [orders, selectedId]);

    const filteredOrders = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return orders;
        return orders.filter((order) => (
            order.id.toLowerCase().includes(query) ||
            order.customer.toLowerCase().includes(query) ||
            order.address.toLowerCase().includes(query) ||
            order.status.toLowerCase().includes(query)
        ));
    }, [searchQuery, orders]);

    const visibleOrders = view === "list" ? filteredOrders : orders;
    const selectedOrder = visibleOrders.find((order) => order.id === selectedId) ?? null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Pickup & Delivery</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Monitor status order dari konfirmasi hingga selesai. Data tersimpan 3 hari terakhir.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border border-border/60 text-xs text-muted-foreground">
                        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                        Realtime aktif
                    </Badge>
                    <Button
                        variant={view === "kanban" ? "default" : "outline"}
                        className="h-9 text-xs font-semibold"
                        onClick={() => setView("kanban")}
                    >
                        Kanban
                    </Button>
                    <Button
                        variant={view === "list" ? "default" : "outline"}
                        className="h-9 text-xs font-semibold"
                        onClick={() => setView("list")}
                    >
                        List
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
                <div className="rounded-xl border border-border/60 bg-card p-4">
                    {view === "kanban" ? (
                        <ScrollArea className="h-[540px]">
                            <div className="flex gap-4 pr-4">
                                {COLUMNS.map((column) => (
                                    <div key={column} className="w-64 flex-shrink-0 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                {column}
                                            </p>
                                            <span className="text-xs text-muted-foreground">
                                                {visibleOrders.filter((order) => order.status === column).length}
                                            </span>
                                        </div>
                                        {visibleOrders.filter((order) => order.status === column).map((order) => (
                                            <button
                                                key={order.id}
                                                onClick={() => setSelectedId(order.id)}
                                                className={cn(
                                                    "w-full rounded-lg border border-border/60 bg-background p-3 text-left transition-colors",
                                                    order.id === selectedId ? "border-primary/40 bg-primary/5" : "hover:bg-muted/40"
                                                )}
                                            >
                                                <OrderMeta order={order} />
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <>
                            <div className="flex flex-col gap-3 px-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Daftar Order</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Total {visibleOrders.length} order.
                                    </p>
                                </div>
                                <div className="relative w-full sm:w-60">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Cari order..."
                                        className="h-9 pl-9"
                                    />
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>ETA</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visibleOrders.map((order) => (
                                        <TableRow
                                            key={order.id}
                                            className="cursor-pointer"
                                            data-state={order.id === selectedId ? "selected" : undefined}
                                            onClick={() => setSelectedId(order.id)}
                                        >
                                            <TableCell className="font-semibold">{order.id}</TableCell>
                                            <TableCell>{order.customer}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={order.status} />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{order.eta}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </div>

                <div className="rounded-xl border border-border/60 bg-card">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Detail Order</h2>
                            <p className="text-xs text-muted-foreground mt-1">Status dan informasi pengiriman.</p>
                        </div>
                        {selectedOrder ? (
                            <StatusBadge status={selectedOrder.status} />
                        ) : null}
                    </div>
                    {!selectedOrder ? (
                        <div className="p-6">
                            <CardEmptyState
                                icon={Truck}
                                title="Belum ada order dipilih"
                                description="Pilih order untuk melihat detail."
                            />
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Customer</p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {selectedOrder.customer}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    {selectedOrder.address}
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/60 bg-background p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Status Progress</p>
                                    <StatusBadge status={selectedOrder.status} />
                                </div>
                                <div className="mt-4">
                                    <StatusSteps status={selectedOrder.status} />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Item</p>
                                <ul className="mt-2 space-y-2">
                                    {selectedOrder.items.map((item) => (
                                        <li key={item} className="text-sm text-foreground">{item}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Driver</p>
                                <p className="text-sm font-semibold text-foreground">
                                    {selectedOrder.driver ?? "Belum ditugaskan"}
                                </p>
                                <Button variant="outline" className="h-8 text-xs font-semibold w-full">
                                    Assign Driver Manual
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button className="h-9 text-xs font-semibold w-full">Ganti Status</Button>
                                <Button variant="outline" className="h-9 text-xs font-semibold w-full">Riwayat</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
