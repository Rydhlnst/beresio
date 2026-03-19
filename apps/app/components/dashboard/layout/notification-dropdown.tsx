"use client";

import { useState } from "react";
import { Bell, Settings, Check, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTransitionRouter } from "@/hooks/use-transition-router";

type NotificationType = "info" | "warning" | "success";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  time: string;
  read: boolean;
}

// Sample notifications - replace with real data fetching
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Pembayaran berhasil",
    description: "Pembayaran invoice #INV-001 telah diterima",
    type: "success",
    time: "5 menit lalu",
    read: false,
  },
  {
    id: "2",
    title: "Cabang baru ditambahkan",
    description: "Cabang Sudirman telah aktif",
    type: "info",
    time: "1 jam lalu",
    read: false,
  },
  {
    id: "3",
    title: "Stok menipis",
    description: "Detergen Premium hanya tersisa 5 unit",
    type: "warning",
    time: "3 jam lalu",
    read: true,
  },
];

const ICONS: Record<NotificationType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
};

const COLORS: Record<NotificationType, string> = {
  info: "text-blue-500 bg-blue-50",
  warning: "text-amber-500 bg-amber-50",
  success: "text-emerald-500 bg-emerald-50",
};

export function NotificationDropdown() {
  const { push } = useTransitionRouter();
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 3);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 rounded-lg" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifikasi</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Tandai sudah dibaca
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {recentNotifications.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => {
              const Icon = ICONS[notification.type];
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 px-3 py-3 cursor-pointer",
                    !notification.read && "bg-secondary/50"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                      COLORS[notification.type]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary cursor-pointer"
          onClick={() => {
            setOpen(false);
            push("/settings/notifications");
          }}
        >
          <Settings className="h-4 w-4" />
          Pengaturan Notifikasi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
