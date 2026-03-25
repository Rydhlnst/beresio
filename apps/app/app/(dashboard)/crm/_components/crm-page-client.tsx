"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  UserCircle,
  Crown,
  UserX,
  TrendingUp,
  UserPlus,
  Tag,
} from "lucide-react";
import { Customer, CustomerTag, PaginatedCustomers, CRMOverviewAnalytics } from "./crm-types";
import { formatCurrency, formatDate } from "./crm-utils";

interface CRMPageClientProps {
  initialData: PaginatedCustomers;
  tags: CustomerTag[];
  analytics: CRMOverviewAnalytics;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Aktif", color: "bg-green-500", icon: <UserCircle className="w-3 h-3" /> },
  vip: { label: "VIP", color: "bg-amber-500", icon: <Crown className="w-3 h-3" /> },
  inactive: { label: "Nonaktif", color: "bg-gray-500", icon: <UserX className="w-3 h-3" /> },
};

export function CRMPageClient({ initialData, tags, analytics }: CRMPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`/crm?${params.toString()}`);
  };

  const handleFilterStatus = (status: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`/crm?${params.toString()}`);
  };

  const handleFilterTag = (tagId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tagId) {
      params.set("tagId", tagId);
    } else {
      params.delete("tagId");
    }
    params.delete("page");
    router.push(`/crm?${params.toString()}`);
  };

  const currentStatus = searchParams.get("status");
  const currentTagId = searchParams.get("tagId");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data pelanggan, tags, dan interaksi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2" asChild>
            <Link href="/crm/tags">
              <Tag className="h-4 w-4" />
              Tags
            </Link>
          </Button>
          <Button size="sm" className="h-9 gap-2" asChild>
            <Link href="/crm/new">
              <Plus className="h-4 w-4" />
              Tambah Pelanggan
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.newCustomersThisMonth} bulan ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan Aktif</CardTitle>
            <UserCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalCustomers > 0
                ? Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100)
                : 0}% dari total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.vipCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalCustomers > 0
                ? Math.round((analytics.vipCustomers / analytics.totalCustomers) * 100)
                : 0}% dari total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Rata-rata</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.averageLifetimeValue)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            placeholder="Cari pelanggan..."
            className="h-9 pl-9"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 gap-2 ${currentStatus ? "border-primary" : ""}`}
              >
                <Filter className="h-4 w-4" />
                {currentStatus
                  ? statusConfig[currentStatus]?.label || "Status"
                  : "Semua Status"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleFilterStatus(null)}>
                Semua Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterStatus("active")}>
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                Aktif
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterStatus("vip")}>
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                VIP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterStatus("inactive")}>
                <span className="w-2 h-2 rounded-full bg-gray-500 mr-2" />
                Nonaktif
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-9 gap-2 ${currentTagId ? "border-primary" : ""}`}
              >
                <Tag className="h-4 w-4" />
                {currentTagId
                  ? tags.find((t) => t.id === currentTagId)?.name || "Tag"
                  : "Semua Tag"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-60 overflow-y-auto">
              <DropdownMenuItem onClick={() => handleFilterTag(null)}>
                Semua Tag
              </DropdownMenuItem>
              {tags.map((tag) => (
                <DropdownMenuItem key={tag.id} onClick={() => handleFilterTag(tag.id)}>
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color || "#ccc" }}
                  />
                  {tag.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Customers Table */}
      <Card className="rounded-xl border border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Total Order</TableHead>
                <TableHead>Total Belanja</TableHead>
                <TableHead>Terakhir Order</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Tidak ada pelanggan ditemukan</p>
                    <p className="text-sm">Coba ubah filter atau tambah pelanggan baru</p>
                  </TableCell>
                </TableRow>
              ) : (
                initialData.data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/crm/${customer.id}`}
                            className="font-medium hover:underline"
                          >
                            {customer.name}
                          </Link>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const config = statusConfig[customer.status];
                        return (
                          <Badge
                            variant="secondary"
                            className="gap-1"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${config?.color || "bg-gray-500"}`} />
                            {config?.label || customer.status}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-xs"
                            style={{
                              borderColor: tag.color || undefined,
                              color: tag.color || undefined,
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {(customer.tags?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{customer.tags!.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.analytics?.totalOrders || 0}</TableCell>
                    <TableCell>{formatCurrency(customer.analytics?.totalSpent || 0)}</TableCell>
                    <TableCell>
                      {customer.analytics?.lastOrderAt
                        ? formatDate(customer.analytics.lastOrderAt)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/${customer.id}`}>Lihat Detail</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/crm/${customer.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {initialData.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(initialData.meta.page - 1) * initialData.meta.limit + 1} -{" "}
            {Math.min(initialData.meta.page * initialData.meta.limit, initialData.meta.total)} dari{" "}
            {initialData.meta.total} pelanggan
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={initialData.meta.page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(initialData.meta.page - 1));
                router.push(`/crm?${params.toString()}`);
              }}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              disabled={initialData.meta.page >= initialData.meta.totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("page", String(initialData.meta.page + 1));
                router.push(`/crm?${params.toString()}`);
              }}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
