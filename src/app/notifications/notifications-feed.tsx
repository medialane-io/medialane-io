"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Inbox, Filter } from "lucide-react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationRow } from "@/components/shared/notification-row";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types/notification";

const FILTERS: { label: string; value: NotificationType | "" }[] = [
  { label: "All",           value: ""             },
  { label: "Offers",        value: "offer"        },
  { label: "Sales",         value: "sale"         },
  { label: "Listings",      value: "listing"      },
  { label: "Mints",         value: "mint"         },
  { label: "Announcements", value: "announcement" },
];

function dayLabel(timestamp: string): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString("en", { weekday: "long" });
  return d.toLocaleDateString("en", { month: "long", day: "numeric" });
}

function groupByDay(items: Notification[]): [string, Notification[]][] {
  const map = new Map<string, Notification[]>();
  for (const n of items) {
    const label = dayLabel(n.timestamp);
    const arr = map.get(label) ?? [];
    arr.push(n);
    map.set(label, arr);
  }
  return [...map.entries()];
}

export function NotificationsFeed() {
  const { isLoaded, isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { notifications, unreadCount, markAllRead } = useNotifications(
    isSignedIn ? walletAddress : null
  );
  const [typeFilter, setTypeFilter] = useState<NotificationType | "">("");

  const filtered = typeFilter
    ? notifications.filter((n) => n.type === typeFilter)
    : notifications;

  const groups = groupByDay(filtered);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all font-medium shrink-0",
                typeFilter === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={markAllRead}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Sign-in gate for personal notifications */}
      {isLoaded && !isSignedIn && (
        <div className="rounded-2xl border border-border/50 bg-muted/10 p-6 flex flex-col items-center gap-3 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="font-semibold text-sm">Sign in to see your notifications</p>
            <p className="text-xs text-muted-foreground mt-1">
              Offers, sales, and activity will appear here.
            </p>
          </div>
          <SignInButton mode="modal">
            <Button size="sm">Sign in</Button>
          </SignInButton>
        </div>
      )}

      {/* Feed */}
      {filtered.length === 0 && (isSignedIn || typeFilter === "announcement") ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center">
            <Inbox className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Nothing here</p>
            <p className="text-xs text-muted-foreground">
              {typeFilter ? `No ${typeFilter} notifications yet.` : "You're all caught up."}
            </p>
          </div>
          <Link href="/marketplace" className="text-xs text-primary hover:underline underline-offset-2">
            Browse marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([label, items]) => (
            <div key={label} className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-1 pb-1">
                {label}
              </p>
              <div className="rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/30 bg-card/30">
                {items.map((n) => (
                  <NotificationRow key={n.id} notification={n} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
