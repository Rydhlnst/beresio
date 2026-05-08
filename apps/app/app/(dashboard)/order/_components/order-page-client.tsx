"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@repo/ui/sheet";
import { CardEmptyState } from "@/components/dashboard/shared/card-empty-state";
import { useTransitionRouter } from "@/hooks/use-transition-router";
import { cn } from "@/lib/utils";
import { buildSafeApiUrl } from "@/lib/safe-api-url";
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
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { createOrderAction, updateOrderAction, updateOrderItemsAction } from "../_actions/orders";
import { updateCustomerAction } from "../_actions/customers";
import IncomingOrderIntakesClient from "../../laundry/orders/incoming-order-intakes-client";
import {
    FNB_REALTIME_EVENT_NAME,
    type FnbRealtimeClientEvent,
} from "@/components/dashboard/realtime/fnb-realtime-events";

type LaundryOrderStatus =
    | "received"
    | "in_process"
    | "done"
    | "ready_pickup"
    | "out_for_delivery"
    | "completed"
    | "cancelled";

type LaundryOrderType = "walkin" | "pickup_delivery";

type OrderTimeline = {
    label: string;
    time: string;
    status: "done" | "active" | "upcoming";
};

type OrderSummary = {
    id: string;
    orderNumber: string;
    branch: { id: string; name: string } | null;
    customer: { id: string; name: string } | null;
    status: string;
    totalAmount: number;
    createdAt: string;
    type: string;
    paymentStatus: string;
    paymentMethod: string | null;
};

type OrderDetail = {
    id: string;
    orderNumber: string;
    status: string;
    type: string;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod: string | null;
    createdAt: string;
    branch: { id: string; name: string } | null;
    customer: { id: string; name: string } | null;
    items: Array<{
        id: string;
        name: string;
        sku?: string | null;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    events: Array<{
        id: string;
        status: string;
        note: string | null;
        actorId: string | null;
        createdAt: string;
    }>;
};

type BranchOption = { id: string; name: string };
type CustomerOption = {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
};
type IncomingOrderIntake = {
    id: string;
    referenceCode: string;
    status: string;
    orderType: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    pickupPreferenceAt: string | null;
    riskScore: number;
    riskLevel: "low" | "medium" | "high";
    riskFlags: string[];
    branchName: string | null;
    notes: string | null;
    createdAt: string;
    convertedOrderId: string | null;
    verifiedAt: string | null;
};

type OrderFilters = {
    status: string;
    branchId: string;
    type: string;
    q: string;
    dateFrom: string;
    dateTo: string;
};

type OrderPageClientProps = {
    orders: OrderSummary[];
    branches: BranchOption[];
    customers: CustomerOption[];
    incomingIntakes: IncomingOrderIntake[];
    selectedOrderId: string | null;
    selectedOrder: OrderDetail | null;
    filters: OrderFilters;
};

const STATUS_ALIASES: Record<string, LaundryOrderStatus> = {
    pending: "received",
    received: "received",
    processing: "in_process",
    in_process: "in_process",
    done: "done",
    ready: "ready_pickup",
    ready_pickup: "ready_pickup",
    out_delivery: "out_for_delivery",
    out_for_delivery: "out_for_delivery",
    completed: "completed",
    cancelled: "cancelled",
};

const TYPE_ALIASES: Record<string, LaundryOrderType> = {
    walkin: "walkin",
    walk_in: "walkin",
    pickup_delivery: "pickup_delivery",
    pickup: "pickup_delivery",
    delivery: "pickup_delivery",
};

function normalizeOrderStatus(status: string | null | undefined): LaundryOrderStatus {
    if (!status) return "received";
    const key = status.toLowerCase();
    return STATUS_ALIASES[key] ?? "received";
}

function normalizeOrderType(type: string | null | undefined): LaundryOrderType {
    if (!type) return "walkin";
    const key = type.toLowerCase();
    return TYPE_ALIASES[key] ?? "walkin";
}

const STATUS_TABS: Array<{ label: string; value: string }> = [
    { label: "Semua", value: "all" },
    { label: "Order Masuk", value: "received" },
    { label: "Sedang Dicuci", value: "in_process" },
    { label: "Selesai Dicuci", value: "done" },
    { label: "Siap Diambil/Diantar", value: "ready_pickup" },
    { label: "Dalam Pengiriman", value: "out_for_delivery" },
    { label: "Selesai", value: "completed" },
    { label: "Batal", value: "cancelled" },
];

const TYPE_OPTIONS: Array<{ label: string; value: string }> = [
    { label: "Semua tipe", value: "all" },
    { label: "Walk-in", value: "walkin" },
    { label: "Pickup & Delivery", value: "pickup_delivery" },
];

const ORDER_STATUS_OPTIONS: Array<{ label: string; value: LaundryOrderStatus }> = [
    { label: "Order Masuk", value: "received" },
    { label: "Sedang Dicuci", value: "in_process" },
    { label: "Selesai Dicuci", value: "done" },
    { label: "Siap Diambil/Diantar", value: "ready_pickup" },
    { label: "Dalam Pengiriman", value: "out_for_delivery" },
    { label: "Selesai", value: "completed" },
    { label: "Batal", value: "cancelled" },
];

const PAYMENT_STATUS_OPTIONS: Array<{ label: string; value: string }> = [
    { label: "Pending", value: "pending" },
    { label: "Lunas", value: "paid" },
    { label: "Refund", value: "refunded" },
    { label: "Gagal", value: "failed" },
];

    const orderItemSchema = z.object({
        name: z.string().min(1, "Nama item wajib diisi"),
        sku: z.string().optional().nullable(),
        quantity: z.number().int().positive("Qty harus lebih dari 0"),
        unitPrice: z.number().min(0, "Harga tidak boleh negatif"),
    });

const orderCreateSchema = z.object({
    branchId: z.string().min(1, "Cabang wajib dipilih"),
    customerId: z.string().optional().nullable(),
    type: z.enum(["walkin", "pickup_delivery"]),
    paymentStatus: z.enum(["pending", "paid", "refunded", "failed"]).default("pending"),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(orderItemSchema).min(1, "Minimal 1 item"),
}).superRefine((value, ctx) => {
    if (value.type === "pickup_delivery" && !value.customerId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Customer wajib diisi untuk pickup/delivery.",
            path: ["customerId"],
        });
    }
});

const customerUpdateSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    phone: z.string().min(1, "Telepon wajib diisi"),
    email: z.string().email("Email tidak valid").optional().nullable(),
    address: z.string().optional().nullable(),
});

function formatCurrency(value: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(value);
}

function statusBadge(status: LaundryOrderStatus) {
    if (status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "out_for_delivery") return "bg-sky-50 text-sky-700 border-sky-200";
    if (status === "ready_pickup") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (status === "done") return "bg-violet-50 text-violet-700 border-violet-200";
    if (status === "in_process") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "cancelled") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-muted/50 text-muted-foreground border-border";
}

function timelineIcon(status: OrderTimeline["status"]) {
    if (status === "done") return CheckCircle2;
    if (status === "active") return Clock;
    return XCircle;
}

function statusLabel(status: LaundryOrderStatus) {
    if (status === "received") return "Order Masuk";
    if (status === "in_process") return "Sedang Dicuci";
    if (status === "done") return "Selesai Dicuci";
    if (status === "ready_pickup") return "Siap Diambil/Diantar";
    if (status === "out_for_delivery") return "Dalam Pengiriman";
    if (status === "completed") return "Selesai";
    return "Dibatalkan";
}

function typeLabel(type: LaundryOrderType) {
    if (type === "pickup_delivery") return "Pickup & Delivery";
    return "Walk-in";
}

function paymentStatusLabel(status: string) {
    if (status === "paid") return "Lunas";
    if (status === "refunded") return "Refund";
    if (status === "failed") return "Gagal";
    return "Menunggu";
}

function getApiUrl(path: string) {
    return buildSafeApiUrl(path);
}

function normalizeSummary(order: OrderSummary) {
    return {
        ...order,
        status: normalizeOrderStatus(order.status),
        type: normalizeOrderType(order.type),
    };
}

function normalizeDetail(order: OrderDetail) {
    return {
        ...order,
        status: normalizeOrderStatus(order.status),
        type: normalizeOrderType(order.type),
        events: order.events.map((event) => ({
            ...event,
            status: normalizeOrderStatus(event.status),
        })),
    };
}

export function OrderPageClient({
    orders: ordersInput,
    branches,
    customers,
    incomingIntakes,
    selectedOrderId,
    selectedOrder: selectedOrderInput,
    filters,
}: OrderPageClientProps) {
    const normalizedBranches = Array.isArray(branches)
        ? branches
        : (branches as unknown as { data?: BranchOption[] })?.data ?? [];
    const normalizedCustomers = Array.isArray(customers)
        ? customers
        : (customers as unknown as { data?: CustomerOption[] })?.data ?? [];
    const { refresh, replace } = useTransitionRouter();
    const [orders, setOrders] = useState(() => ordersInput.map(normalizeSummary));
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(
        selectedOrderInput ? normalizeDetail(selectedOrderInput) : null
    );
    const realtimeRefreshTimerRef = useRef<number | null>(null);

    const normalizedFilterStatus = filters.status ? normalizeOrderStatus(filters.status) : "";
    const normalizedFilterType = filters.type ? normalizeOrderType(filters.type) : "";

    const [searchQuery, setSearchQuery] = useState(filters.q);
    const [activeStatus, setActiveStatus] = useState(normalizedFilterStatus || "all");
    const [createOpen, setCreateOpen] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [createPending, setCreatePending] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<LaundryOrderStatus>("received");
    const [updatePaymentStatus, setUpdatePaymentStatus] = useState("pending");
    const [updatePaymentMethod, setUpdatePaymentMethod] = useState<string>("");
    const [updateCustomerId, setUpdateCustomerId] = useState<string>("none");
    const [updatePending, setUpdatePending] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [editItemsOpen, setEditItemsOpen] = useState(false);
    const [editItems, setEditItems] = useState<Array<{ name: string; sku?: string | null; quantity: number; unitPrice: number }>>([]);
    const [editItemsPending, setEditItemsPending] = useState(false);
    const [editItemsError, setEditItemsError] = useState<string | null>(null);
    const [customerOpen, setCustomerOpen] = useState(false);
    const [customerPending, setCustomerPending] = useState(false);
    const [customerError, setCustomerError] = useState<string | null>(null);

    useEffect(() => {
        setOrders(ordersInput.map(normalizeSummary));
    }, [ordersInput]);

    useEffect(() => {
        setSelectedOrder(selectedOrderInput ? normalizeDetail(selectedOrderInput) : null);
    }, [selectedOrderInput]);

    const refreshOrdersList = useCallback(async () => {
        const params = new URLSearchParams();
        if (activeStatus !== "all") params.set("status", activeStatus);
        if (filters.branchId) params.set("branchId", filters.branchId);
        if (normalizedFilterType) params.set("type", normalizedFilterType);
        const query = searchQuery.trim();
        if (query) params.set("q", query);
        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);

        const suffix = params.toString();
        const response = await fetch(
            getApiUrl(`/api/dashboard/orders${suffix ? `?${suffix}` : ""}`),
            { credentials: "include" }
        ).catch(() => null);
        if (!response?.ok) return;

        const payload = await response.json().catch(() => null) as { data?: OrderSummary[] } | null;
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const normalized = rows.map(normalizeSummary);
        setOrders(normalized);

        setSelectedOrder((current) => {
            if (!current) return current;
            const stillExists = normalized.some((order) => order.id === current.id);
            return stillExists ? current : null;
        });
    }, [activeStatus, filters.branchId, normalizedFilterType, searchQuery, filters.dateFrom, filters.dateTo]);

    const refreshSelectedOrder = useCallback(async (targetOrderId?: string | null) => {
        const orderId = targetOrderId?.trim() || selectedOrderId || selectedOrder?.id || null;
        if (!orderId) return;

        const response = await fetch(
            getApiUrl(`/api/dashboard/orders/${encodeURIComponent(orderId)}`),
            { credentials: "include" }
        ).catch(() => null);
        if (!response?.ok) {
            if (response?.status === 404) {
                setSelectedOrder(null);
            }
            return;
        }

        const payload = await response.json().catch(() => null) as { data?: OrderDetail | null } | null;
        if (payload?.data) {
            setSelectedOrder(normalizeDetail(payload.data));
        }
    }, [selectedOrderId, selectedOrder?.id]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (document.visibilityState !== "visible") return;
            void refreshOrdersList();
            void refreshSelectedOrder();
        }, 45000);
        return () => window.clearInterval(interval);
    }, [refreshOrdersList, refreshSelectedOrder]);

    useEffect(() => {
        setSearchQuery(filters.q);
        setActiveStatus(filters.status ? normalizeOrderStatus(filters.status) : "all");
    }, [filters.q, filters.status]);

    useEffect(() => {
        if (!selectedOrder) return;
        setUpdateStatus(normalizeOrderStatus(selectedOrder.status));
        setUpdatePaymentStatus(selectedOrder.paymentStatus ?? "pending");
        setUpdatePaymentMethod(selectedOrder.paymentMethod ?? "");
        setUpdateCustomerId(selectedOrder.customer?.id ?? "none");
        setUpdateError(null);
        setEditItems(selectedOrder.items.map((item) => ({
            name: item.name,
            sku: item.sku ?? "",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        })));
        setEditItemsError(null);
    }, [selectedOrder]);

    const selectedCustomer = useMemo(() => {
        if (!updateCustomerId || updateCustomerId === "none") return null;
        return normalizedCustomers.find((customer) => customer.id === updateCustomerId) ?? null;
    }, [normalizedCustomers, updateCustomerId]);

    useEffect(() => {
        const onRealtime = (event: Event) => {
            const detail = (event as CustomEvent<FnbRealtimeClientEvent>).detail;
            if (!detail) return;
            if (detail.eventType === "connected" || detail.eventType === "ping" || detail.eventType === "pong") {
                return;
            }

            if (realtimeRefreshTimerRef.current) {
                window.clearTimeout(realtimeRefreshTimerRef.current);
                realtimeRefreshTimerRef.current = null;
            }

            realtimeRefreshTimerRef.current = window.setTimeout(() => {
                realtimeRefreshTimerRef.current = null;

                const payload = (detail.payload && typeof detail.payload === "object")
                    ? detail.payload
                    : null;
                const orderIdFromPayload = payload && typeof payload.orderId === "string"
                    ? payload.orderId
                    : null;

                void refreshOrdersList();
                void refreshSelectedOrder(orderIdFromPayload);
            }, 350);
        };

        window.addEventListener(FNB_REALTIME_EVENT_NAME, onRealtime as EventListener);
        return () => {
            window.removeEventListener(FNB_REALTIME_EVENT_NAME, onRealtime as EventListener);
            if (realtimeRefreshTimerRef.current) {
                window.clearTimeout(realtimeRefreshTimerRef.current);
                realtimeRefreshTimerRef.current = null;
            }
        };
    }, [refreshOrdersList, refreshSelectedOrder]);

    useEffect(() => {
        const handle = window.setTimeout(() => {
            const params = new URLSearchParams();
            if (activeStatus !== "all") params.set("status", activeStatus);
            if (filters.branchId) params.set("branchId", filters.branchId);
            if (normalizedFilterType) params.set("type", normalizedFilterType);
            if (searchQuery.trim()) params.set("q", searchQuery.trim());
            if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
            if (filters.dateTo) params.set("dateTo", filters.dateTo);
            if (selectedOrderId) params.set("orderId", selectedOrderId);
            replace(`/order?${params.toString()}`);
        }, 350);

        return () => window.clearTimeout(handle);
    }, [activeStatus, filters.branchId, normalizedFilterType, filters.dateFrom, filters.dateTo, searchQuery, selectedOrderId, replace]);

    const timeline = useMemo<OrderTimeline[]>(() => {
        if (!selectedOrder || selectedOrder.events.length === 0) return [];
        const sorted = [...selectedOrder.events].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const isFinal = selectedOrder.status === "completed" || selectedOrder.status === "cancelled";
        return sorted.map((event, idx) => ({
            label: statusLabel(normalizeOrderStatus(event.status)),
            time: formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: id }),
            status: isFinal ? "done" : idx === sorted.length - 1 ? "active" : "done",
        }));
    }, [selectedOrder]);

    const createForm = useForm({
        defaultValues: {
            branchId: filters.branchId || "",
            customerId: "none",
            type: "walkin" as LaundryOrderType,
            paymentStatus: "pending",
            paymentMethod: "",
            notes: "",
            items: [{ name: "", sku: "", quantity: 1, unitPrice: 0 }],
        },
        onSubmit: async ({ value }) => {
            const parsed = orderCreateSchema.safeParse({
                ...value,
                customerId: value.customerId && value.customerId !== "none" ? value.customerId : null,
                paymentMethod: value.paymentMethod?.trim() || null,
                notes: value.notes?.trim() || null,
            });

            if (!parsed.success) {
                const message = parsed.error.issues[0]?.message ?? "Form tidak valid.";
                setCreateError(message);
                return;
            }

            setCreatePending(true);
            setCreateError(null);
            const result = await createOrderAction(parsed.data);
            setCreatePending(false);

            if (!result.ok) {
                setCreateError("Gagal membuat order. Coba lagi.");
                return;
            }

            setCreateOpen(false);
            refresh();

            if (result.data?.id) {
                const params = new URLSearchParams();
                if (activeStatus !== "all") params.set("status", activeStatus);
                if (filters.branchId) params.set("branchId", filters.branchId);
                if (normalizedFilterType) params.set("type", normalizedFilterType);
                if (filters.q) params.set("q", filters.q);
                if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
                if (filters.dateTo) params.set("dateTo", filters.dateTo);
                params.set("orderId", result.data.id);
                replace(`/order?${params.toString()}`);
            }
        },
    });

    const customerForm = useForm({
        defaultValues: {
            name: selectedCustomer?.name ?? "",
            phone: selectedCustomer?.phone ?? "",
            email: selectedCustomer?.email ?? "",
            address: selectedCustomer?.address ?? "",
        },
        onSubmit: async ({ value }) => {
            if (!selectedCustomer) return;
            const parsed = customerUpdateSchema.safeParse({
                ...value,
                email: value.email?.trim() || null,
                address: value.address?.trim() || null,
            });
            if (!parsed.success) {
                const message = parsed.error.issues[0]?.message ?? "Form tidak valid.";
                setCustomerError(message);
                return;
            }

            setCustomerPending(true);
            setCustomerError(null);
            const result = await updateCustomerAction(selectedCustomer.id, parsed.data);
            setCustomerPending(false);

            if (!result.ok) {
                setCustomerError("Gagal memperbarui customer. Coba lagi.");
                return;
            }

            setCustomerOpen(false);
            refresh();
        },
    });

    useEffect(() => {
        if (!selectedCustomer) return;
        customerForm.reset({
            name: selectedCustomer.name ?? "",
            phone: selectedCustomer.phone ?? "",
            email: selectedCustomer.email ?? "",
            address: selectedCustomer.address ?? "",
        });
        setCustomerError(null);
    }, [selectedCustomer, customerForm]);

    const handleUpdate = async () => {
        if (!selectedOrder) return;
        setUpdatePending(true);
        setUpdateError(null);
        const result = await updateOrderAction(selectedOrder.id, {
            status: updateStatus,
            paymentStatus: updatePaymentStatus as any,
            paymentMethod: updatePaymentMethod.trim() || null,
            customerId: updateCustomerId === "none" ? null : updateCustomerId,
            eventNote: "Status diubah via dashboard",
        });
        setUpdatePending(false);

        if (!result.ok) {
            setUpdateError("Gagal memperbarui order. Coba lagi.");
            return;
        }

        refresh();
    };

    const handleUpdateItems = async () => {
        if (!selectedOrder) return;
        setEditItemsPending(true);
        setEditItemsError(null);

        const normalized = editItems.map((item) => ({
            name: item.name.trim(),
            sku: item.sku?.trim() || null,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
        }));

        if (normalized.some((item) => !item.name || item.quantity <= 0 || item.unitPrice < 0)) {
            setEditItemsError("Item tidak valid. Periksa nama, qty, dan harga.");
            setEditItemsPending(false);
            return;
        }

        const result = await updateOrderItemsAction(selectedOrder.id, normalized);
        setEditItemsPending(false);

        if (!result.ok) {
            setEditItemsError("Gagal memperbarui item. Coba lagi.");
            return;
        }

        setEditItemsOpen(false);
        refresh();
    };

    return (
        <>
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-semibold text-foreground">Order</h1>
                <Button className="h-9 text-xs font-semibold" onClick={() => setCreateOpen(true)}>
                    Tambah Order
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">
                Pantau semua order lintas cabang dan identifikasi bottleneck.
            </p>

            <div className="flex flex-col gap-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <Select
                        value={filters.branchId || "all"}
                        onValueChange={(value) => {
                            const params = new URLSearchParams();
                            if (activeStatus !== "all") params.set("status", activeStatus);
                            if (value !== "all") params.set("branchId", value);
                            if (normalizedFilterType) params.set("type", normalizedFilterType);
                            if (filters.q) params.set("q", filters.q);
                            if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
                            if (filters.dateTo) params.set("dateTo", filters.dateTo);
                            if (selectedOrderId) params.set("orderId", selectedOrderId);
                            replace(`/order?${params.toString()}`);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Semua cabang" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua cabang</SelectItem>
                            {normalizedBranches.map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={activeStatus}
                        onValueChange={(value) => {
                            setActiveStatus(value);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Semua status" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_TABS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={normalizedFilterType || "all"}
                        onValueChange={(value) => {
                            const params = new URLSearchParams();
                            if (activeStatus !== "all") params.set("status", activeStatus);
                            if (filters.branchId) params.set("branchId", filters.branchId);
                            if (value !== "all") params.set("type", value);
                            if (filters.q) params.set("q", filters.q);
                            if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
                            if (filters.dateTo) params.set("dateTo", filters.dateTo);
                            if (selectedOrderId) params.set("orderId", selectedOrderId);
                            replace(`/order?${params.toString()}`);
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Semua tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            {TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(event) => {
                            const value = event.target.value;
                            const params = new URLSearchParams();
                            if (activeStatus !== "all") params.set("status", activeStatus);
                            if (filters.branchId) params.set("branchId", filters.branchId);
                            if (normalizedFilterType) params.set("type", normalizedFilterType);
                            if (filters.q) params.set("q", filters.q);
                            if (value) params.set("dateFrom", value);
                            if (filters.dateTo) params.set("dateTo", filters.dateTo);
                            if (selectedOrderId) params.set("orderId", selectedOrderId);
                            replace(`/order?${params.toString()}`);
                        }}
                    />
                    <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(event) => {
                            const value = event.target.value;
                            const params = new URLSearchParams();
                            if (activeStatus !== "all") params.set("status", activeStatus);
                            if (filters.branchId) params.set("branchId", filters.branchId);
                            if (normalizedFilterType) params.set("type", normalizedFilterType);
                            if (filters.q) params.set("q", filters.q);
                            if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
                            if (value) params.set("dateTo", value);
                            if (selectedOrderId) params.set("orderId", selectedOrderId);
                            replace(`/order?${params.toString()}`);
                        }}
                    />
                </div>

                <Tabs value={activeStatus} onValueChange={(value) => setActiveStatus(value)}>
                    <TabsList className="w-full justify-start gap-1 bg-muted/40">
                        {STATUS_TABS.map((status) => (
                            <TabsTrigger key={status.value} value={status.value} className="text-xs">
                                {status.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <IncomingOrderIntakesClient intakes={incomingIntakes} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div className="rounded-xl border border-border/60 bg-card">
                    <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Daftar Order</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total {orders.length} order aktif.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Cari nomor order..."
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
                        {orders.map((order) => (
                            <TableRow
                                key={order.id}
                                data-state={order.id === selectedOrderId ? "selected" : undefined}
                                className="cursor-pointer"
                                onClick={() => {
                                    const params = new URLSearchParams();
                                    if (activeStatus !== "all") params.set("status", activeStatus);
                                    if (filters.branchId) params.set("branchId", filters.branchId);
                                    if (normalizedFilterType) params.set("type", normalizedFilterType);
                                    if (filters.q) params.set("q", filters.q);
                                    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
                                    if (filters.dateTo) params.set("dateTo", filters.dateTo);
                                    params.set("orderId", order.id);
                                    replace(`/order?${params.toString()}`);
                                }}
                            >
                                <TableCell className="font-semibold">{order.orderNumber}</TableCell>
                                <TableCell>{order.branch?.name ?? "-"}</TableCell>
                                <TableCell>{order.customer?.name ?? "-"}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn("border text-[11px] font-semibold", statusBadge(order.status))}
                                    >
                                        {statusLabel(order.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true, locale: id })}
                                </TableCell>
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
                            <Badge variant="outline" className={cn("border text-[11px] font-semibold", statusBadge(normalizeOrderStatus(selectedOrder.status)))}>
                                {statusLabel(normalizeOrderStatus(selectedOrder.status))}
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
                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Update Status</p>
                                <div className="grid gap-3 sm:grid-cols-4">
                                    <Select value={updateStatus} onValueChange={(value) => setUpdateStatus(value as LaundryOrderStatus)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ORDER_STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={updatePaymentStatus} onValueChange={(value) => setUpdatePaymentStatus(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pembayaran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        placeholder="Metode pembayaran"
                                        value={updatePaymentMethod}
                                        onChange={(event) => setUpdatePaymentMethod(event.target.value)}
                                    />
                                    <Select value={updateCustomerId} onValueChange={(value) => setUpdateCustomerId(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Customer" />
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
                                {updateError ? (
                                    <p className="text-xs text-rose-600 font-semibold">{updateError}</p>
                                ) : null}
                                <Button
                                    className="h-9 text-xs font-semibold"
                                    onClick={handleUpdate}
                                    disabled={updatePending}
                                >
                                    {updatePending ? "Menyimpan..." : "Simpan Update"}
                                </Button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Customer</p>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        {selectedOrder.customer?.name ?? "Tanpa customer"}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{typeLabel(normalizeOrderType(selectedOrder.type))}</p>
                                    <Button
                                        variant="outline"
                                        className="h-8 text-xs font-semibold"
                                        onClick={() => setCustomerOpen(true)}
                                        disabled={!selectedOrder.customer?.id}
                                    >
                                        Detail Customer
                                    </Button>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Cabang</p>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {selectedOrder.branch?.name ?? "Tanpa cabang"}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(selectedOrder.createdAt), { addSuffix: true, locale: id })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Item Order</p>
                                <Button
                                    variant="outline"
                                    className="h-8 text-xs font-semibold"
                                    onClick={() => setEditItemsOpen(true)}
                                >
                                    Edit Item
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm">
                                            <div>
                                                <p className="font-semibold text-foreground">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">{item.quantity} item</p>
                                            </div>
                                            <p className="font-semibold text-foreground">{formatCurrency(item.totalPrice)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Timeline Status</p>
                                <div className="space-y-3">
                                    {timeline.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">Belum ada aktivitas.</p>
                                    ) : (
                                        timeline.map((step) => {
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
                                    })
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Pembayaran</p>
                                    <p className="text-sm font-semibold text-foreground mt-1">
                                        {selectedOrder.paymentMethod ?? "Belum dipilih"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{paymentStatusLabel(selectedOrder.paymentStatus)}</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    {formatCurrency(selectedOrder.totalAmount)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <Sheet open={createOpen} onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setCreateError(null);
        }}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Buat Order Baru</SheetTitle>
                    <SheetDescription>
                        Isi data order untuk mulai proses laundry.
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="mt-6 space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        createForm.handleSubmit();
                    }}
                >
                    <createForm.Field name="branchId">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Cabang</p>
                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                <SelectTrigger>
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
                        )}
                    </createForm.Field>

                    <createForm.Field name="customerId">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Customer</p>
                            <Select
                                value={field.state.value ?? "none"}
                                onValueChange={(value) => field.handleChange(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih customer (opsional)" />
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
                        )}
                    </createForm.Field>

                    <createForm.Field name="type">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Tipe Order</p>
                            <Select value={field.state.value} onValueChange={(value) => field.handleChange(value as LaundryOrderType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TYPE_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        )}
                    </createForm.Field>

                    <createForm.Field name="paymentStatus">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Status Pembayaran</p>
                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status pembayaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        )}
                    </createForm.Field>

                    <createForm.Field name="paymentMethod">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Metode Pembayaran</p>
                            <Input
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                                placeholder="QRIS / Cash / Transfer"
                            />
                        </div>
                        )}
                    </createForm.Field>

                    <createForm.Field name="notes">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Catatan</p>
                            <Input
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                                placeholder="Catatan tambahan (opsional)"
                            />
                        </div>
                        )}
                    </createForm.Field>

                    <createForm.Field name="items">
                        {(field) => (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Item Order</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-7 text-xs font-semibold"
                                    onClick={() => {
                                        field.handleChange([
                                            ...field.state.value,
                                            { name: "", sku: "", quantity: 1, unitPrice: 0 },
                                        ]);
                                    }}
                                >
                                    Tambah Item
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {field.state.value.map((item, idx) => (
                                    <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                                        <Input
                                            placeholder="Nama layanan"
                                            value={item.name}
                                            onChange={(event) => {
                                                const next = [...field.state.value];
                                                next[idx] = {
                                                    name: event.target.value,
                                                    sku: next[idx]?.sku ?? "",
                                                    quantity: next[idx]?.quantity ?? 1,
                                                    unitPrice: next[idx]?.unitPrice ?? 0,
                                                };
                                                field.handleChange(next);
                                            }}
                                        />
                                        <Input
                                            placeholder="SKU (opsional, untuk stok)"
                                            value={item.sku ?? ""}
                                            onChange={(event) => {
                                                const next = [...field.state.value];
                                                next[idx] = {
                                                    name: next[idx]?.name ?? "",
                                                    sku: event.target.value,
                                                    quantity: next[idx]?.quantity ?? 1,
                                                    unitPrice: next[idx]?.unitPrice ?? 0,
                                                };
                                                field.handleChange(next);
                                            }}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(event) => {
                                                    const next = [...field.state.value];
                                                    next[idx] = {
                                                        name: next[idx]?.name ?? "",
                                                        sku: next[idx]?.sku ?? "",
                                                        quantity: Number(event.target.value),
                                                        unitPrice: next[idx]?.unitPrice ?? 0,
                                                    };
                                                    field.handleChange(next);
                                                }}
                                            />
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="Harga"
                                                value={item.unitPrice}
                                                onChange={(event) => {
                                                    const next = [...field.state.value];
                                                    next[idx] = {
                                                        name: next[idx]?.name ?? "",
                                                        sku: next[idx]?.sku ?? "",
                                                        quantity: next[idx]?.quantity ?? 1,
                                                        unitPrice: Number(event.target.value),
                                                    };
                                                    field.handleChange(next);
                                                }}
                                            />
                                        </div>
                                        {field.state.value.length > 1 ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-7 text-xs font-semibold text-rose-600"
                                                onClick={() => {
                                                    const next = field.state.value.filter((_, i) => i !== idx);
                                                    field.handleChange(next);
                                                }}
                                            >
                                                Hapus Item
                                            </Button>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}
                    </createForm.Field>

                    {createError ? (
                        <p className="text-xs text-rose-600 font-semibold">{createError}</p>
                    ) : null}
                </form>
                <SheetFooter className="mt-6">
                    <Button
                        className="w-full h-9 text-xs font-semibold"
                        onClick={() => createForm.handleSubmit()}
                        disabled={createPending}
                    >
                        {createPending ? "Menyimpan..." : "Buat Order"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
        <Sheet open={editItemsOpen} onOpenChange={(open) => {
            setEditItemsOpen(open);
            if (!open) setEditItemsError(null);
        }}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Item Order</SheetTitle>
                    <SheetDescription>
                        Perbarui daftar item dan jumlah.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                    {editItems.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
                            <Input
                                placeholder="Nama layanan"
                                value={item.name}
                                onChange={(event) => {
                                    const next = [...editItems];
                                    next[idx] = {
                                        name: event.target.value,
                                        sku: next[idx]?.sku ?? "",
                                        quantity: next[idx]?.quantity ?? 1,
                                        unitPrice: next[idx]?.unitPrice ?? 0,
                                    };
                                    setEditItems(next);
                                }}
                            />
                            <Input
                                placeholder="SKU (opsional, untuk stok)"
                                value={item.sku ?? ""}
                                onChange={(event) => {
                                    const next = [...editItems];
                                    next[idx] = {
                                        name: next[idx]?.name ?? "",
                                        sku: event.target.value,
                                        quantity: next[idx]?.quantity ?? 1,
                                        unitPrice: next[idx]?.unitPrice ?? 0,
                                    };
                                    setEditItems(next);
                                }}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(event) => {
                                        const next = [...editItems];
                                        next[idx] = {
                                            name: next[idx]?.name ?? "",
                                            sku: next[idx]?.sku ?? "",
                                            quantity: Number(event.target.value),
                                            unitPrice: next[idx]?.unitPrice ?? 0,
                                        };
                                        setEditItems(next);
                                    }}
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    placeholder="Harga"
                                    value={item.unitPrice}
                                    onChange={(event) => {
                                        const next = [...editItems];
                                        next[idx] = {
                                            name: next[idx]?.name ?? "",
                                            sku: next[idx]?.sku ?? "",
                                            quantity: next[idx]?.quantity ?? 1,
                                            unitPrice: Number(event.target.value),
                                        };
                                        setEditItems(next);
                                    }}
                                />
                            </div>
                            {editItems.length > 1 ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-7 text-xs font-semibold text-rose-600"
                                    onClick={() => {
                                        const next = editItems.filter((_, i) => i !== idx);
                                        setEditItems(next);
                                    }}
                                >
                                    Hapus Item
                                </Button>
                            ) : null}
                        </div>
                    ))}
                    <Button
                        type="button"
                        variant="outline"
                        className="h-8 text-xs font-semibold w-full"
                        onClick={() => setEditItems([...editItems, { name: "", quantity: 1, unitPrice: 0 }])}
                    >
                        Tambah Item
                    </Button>
                    {editItemsError ? (
                        <p className="text-xs text-rose-600 font-semibold">{editItemsError}</p>
                    ) : null}
                </div>
                <SheetFooter className="mt-6">
                    <Button
                        className="w-full h-9 text-xs font-semibold"
                        onClick={handleUpdateItems}
                        disabled={editItemsPending}
                    >
                        {editItemsPending ? "Menyimpan..." : "Simpan Item"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
        <Sheet open={customerOpen} onOpenChange={(open) => {
            setCustomerOpen(open);
            if (!open) setCustomerError(null);
        }}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Detail Customer</SheetTitle>
                    <SheetDescription>
                        Perbarui informasi customer untuk monitoring CRM.
                    </SheetDescription>
                </SheetHeader>
                <form
                    className="mt-6 space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        customerForm.handleSubmit();
                    }}
                >
                    <customerForm.Field name="name">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Nama</p>
                            <Input
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                                placeholder="Nama customer"
                            />
                        </div>
                        )}
                    </customerForm.Field>
                    <customerForm.Field name="phone">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Telepon</p>
                            <Input
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                                placeholder="Nomor telepon"
                            />
                        </div>
                        )}
                    </customerForm.Field>
                    <customerForm.Field name="email">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                            <Input
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                                placeholder="Email"
                            />
                        </div>
                        )}
                    </customerForm.Field>
                    <customerForm.Field name="address">
                        {(field) => (
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Alamat</p>
                            <Input
                                value={field.state.value}
                                onChange={(event) => field.handleChange(event.target.value)}
                                placeholder="Alamat"
                            />
                        </div>
                        )}
                    </customerForm.Field>
                    {customerError ? (
                        <p className="text-xs text-rose-600 font-semibold">{customerError}</p>
                    ) : null}
                </form>
                <SheetFooter className="mt-6">
                    <Button
                        className="w-full h-9 text-xs font-semibold"
                        onClick={() => customerForm.handleSubmit()}
                        disabled={customerPending}
                    >
                        {customerPending ? "Menyimpan..." : "Simpan Customer"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
        </>
    );
}
