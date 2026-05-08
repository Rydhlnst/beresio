"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Avatar, AvatarFallback } from "@repo/ui/avatar";
import { Separator } from "@repo/ui/separator";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Crown,
  UserCircle,
  UserX,
  ShoppingBag,
  MessageSquare,
  Activity,
  Tag,
} from "lucide-react";
import { CustomerWithDetails, CustomerTag, CustomerNote, CustomerInteraction } from "./crm-types";
import { formatCurrency, formatDate, formatDateTime, formatRelativeDate, getInitials } from "./crm-utils";

interface CustomerDetailClientProps {
  customer: CustomerWithDetails;
}

const statusConfig = {
  active: { label: "Aktif", color: "bg-green-500", icon: UserCircle },
  vip: { label: "VIP", color: "bg-amber-500", icon: Crown },
  inactive: { label: "Nonaktif", color: "bg-gray-500", icon: UserX },
};

const interactionTypeConfig: Record<string, { label: string; color: string }> = {
  call: { label: "Telepon", color: "bg-blue-500" },
  visit: { label: "Kunjungan", color: "bg-green-500" },
  order: { label: "Order", color: "bg-purple-500" },
  complaint: { label: "Komplain", color: "bg-red-500" },
  feedback: { label: "Feedback", color: "bg-yellow-500" },
  other: { label: "Lainnya", color: "bg-gray-500" },
};

export function CustomerDetailClient({ customer }: CustomerDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const status = statusConfig[customer.status];

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/crm">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">Detail pelanggan</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/crm/${customer.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Pelanggan
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{customer.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="gap-1"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                    {status.label}
                  </Badge>
                  <Badge variant="outline">{customer.loyaltyTier}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Member sejak {formatDate(customer.createdAt)}
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="line-clamp-2">{customer.address}</span>
                  </div>
                )}
                {customer.birthDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatDate(customer.birthDate)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <p className="text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {customer.tags?.length ? (
                    customer.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        style={{
                          borderColor: tag.color || undefined,
                          color: tag.color || undefined,
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada tags</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Card */}
          {customer.analytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Order</span>
                  <span className="font-medium">{customer.analytics.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Belanja</span>
                  <span className="font-medium">
                    {formatCurrency(customer.analytics.totalSpent)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Rata-rata Order</span>
                  <span className="font-medium">
                    {formatCurrency(customer.analytics.averageOrderValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Order Pertama</span>
                  <span className="font-medium">
                    {customer.analytics.firstOrderAt
                      ? formatDate(customer.analytics.firstOrderAt)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Order Terakhir</span>
                  <span className="font-medium">
                    {customer.analytics.lastOrderAt
                      ? formatRelativeDate(customer.analytics.lastOrderAt)
                      : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">
                Catatan ({customer.notes?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="interactions">
                Interaksi ({customer.interactions?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informasi Tambahan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">{customer.gender || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sumber</p>
                      <p className="font-medium capitalize">{customer.source || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Loyalty Points</p>
                      <p className="font-medium">{customer.loyaltyPoints}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tier</p>
                      <p className="font-medium capitalize">{customer.loyaltyTier}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Notes Preview */}
              {customer.notes && customer.notes.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Catatan Terbaru</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("notes")}
                    >
                      Lihat Semua
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customer.notes.slice(0, 3).map((note) => (
                        <NoteItem key={note.id} note={note} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Interactions Preview */}
              {customer.interactions && customer.interactions.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Interaksi Terbaru</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("interactions")}
                    >
                      Lihat Semua
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customer.interactions.slice(0, 3).map((interaction) => (
                        <InteractionItem key={interaction.id} interaction={interaction} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Catatan</CardTitle>
                  <Button size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Tambah Catatan
                  </Button>
                </CardHeader>
                <CardContent>
                  {customer.notes?.length ? (
                    <div className="space-y-4">
                      {customer.notes.map((note) => (
                        <NoteItem key={note.id} note={note} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Belum ada catatan</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interactions" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Riwayat Interaksi</CardTitle>
                  <Button size="sm">
                    <Activity className="w-4 h-4 mr-2" />
                    Tambah Interaksi
                  </Button>
                </CardHeader>
                <CardContent>
                  {customer.interactions?.length ? (
                    <div className="space-y-4">
                      {customer.interactions.map((interaction) => (
                        <InteractionItem key={interaction.id} interaction={interaction} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Belum ada interaksi</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function NoteItem({ note }: { note: CustomerNote }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-sm">{note.note}</p>
      <p className="text-xs text-muted-foreground mt-2">
        {formatDateTime(note.createdAt)}
      </p>
    </div>
  );
}

function InteractionItem({ interaction }: { interaction: CustomerInteraction }) {
  const config = interactionTypeConfig[interaction.type] ?? {
    label: interaction.type,
    color: "bg-muted-foreground/40",
  };
  return (
    <div className="flex gap-3 p-3 bg-muted/50 rounded-lg">
      <div className={`w-2 h-2 rounded-full mt-2 ${config.color}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(interaction.createdAt)}
          </span>
        </div>
        <p className="text-sm mt-2">{interaction.notes}</p>
      </div>
    </div>
  );
}
