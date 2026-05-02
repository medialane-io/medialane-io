"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Bell, ArrowRight, Inbox, CheckCheck } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationRow } from "@/components/shared/notification-row";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

// ── Day grouping helper ───────────────────────────────────────────────────────

function dayLabel(timestamp: string): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString("en", { weekday: "long" });
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function groupByDay(notifications: Notification[]): [string, Notification[]][] {
  const map = new Map<string, Notification[]>();
  for (const n of notifications) {
    const label = dayLabel(n.timestamp);
    const existing = map.get(label) ?? [];
    existing.push(n);
    map.set(label, existing);
  }
  return [...map.entries()];
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center">
        <Inbox className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">All caught up</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
          Offers, activity, and announcements will appear here.
        </p>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function NotificationsItem() {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { notifications, unreadCount, markAllRead } = useNotifications(
    isSignedIn ? walletAddress : null
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Mark all read when panel closes
    if (unreadCount > 0) markAllRead();
  }, [unreadCount, markAllRead]);

  const groups = groupByDay(notifications.slice(0, 20));

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleOpen}
          tooltip={
            unreadCount > 0
              ? `${unreadCount} new notification${unreadCount > 1 ? "s" : ""}`
              : "Notifications"
          }
        >
          <div className="relative">
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span>Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <Dialog open={open} onOpenChange={(v) => (v ? handleOpen() : handleClose())}>
        <DialogContent
          className={cn(
            "w-full max-w-[calc(100%-12px)] sm:max-w-sm",
            "p-0 gap-0 flex flex-col",
            "max-h-[85svh] overflow-hidden",
            "rounded-2xl border border-border/50",
            "shadow-2xl shadow-black/30"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0 pr-12">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <DialogTitle className="text-sm font-bold">Notifications</DialogTitle>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2"
                onClick={markAllRead}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-border/30">
                {groups.map(([label, items]) => (
                  <div key={label}>
                    <div className="px-5 py-2 bg-muted/20">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        {label}
                      </p>
                    </div>
                    {items.map((n) => (
                      <NotificationRow
                        key={n.id}
                        notification={n}
                        compact
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-border/50 shrink-0 bg-muted/10">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              View all notifications
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
