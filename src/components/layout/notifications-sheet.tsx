"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useNotifications } from "@/hooks/use-notifications";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDisplayPrice } from "@/lib/utils";

const ACTIVITY_LABEL: Record<string, string> = {
  sale: "Sale",
  listing: "Listed",
  offer: "Offer",
  transfer: "Transfer",
  cancelled: "Cancelled",
};

function formatTimestamp(ts: string | number): string {
  const date = new Date(typeof ts === "number" ? ts * 1000 : ts);
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function NotificationsItem() {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useUser();
  const { walletAddress } = useSessionKey();
  const { unreadCount, unseenOffers, recentActivities, markAllSeen } =
    useNotifications(isSignedIn ? walletAddress : null);

  function handleOpen() {
    setOpen(true);
    markAllSeen();
  }

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
          <span>
            Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-80 p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
            <SheetTitle className="text-sm">Notifications</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {unseenOffers.length === 0 && recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {unseenOffers.map((offer) => (
                  <Link
                    key={offer.orderHash}
                    href={`/asset/${offer.consideration.token}/${offer.consideration.identifier}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">
                        New offer received
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {offer.token?.name ??
                          `Token #${offer.consideration.identifier}`}
                      </p>
                      {offer.price?.formatted && (
                        <p className="text-xs font-semibold text-foreground mt-0.5">
                          {formatDisplayPrice(offer.price.formatted)}{" "}
                          {offer.price.currency ?? ""}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
                {recentActivities.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-2 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground leading-snug">
                        {ACTIVITY_LABEL[event.type] ?? event.type}
                      </p>
                      {event.price?.formatted && (
                        <p className="text-xs font-semibold text-foreground mt-0.5">
                          {formatDisplayPrice(event.price.formatted)}{" "}
                          {event.price.currency ?? ""}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-border shrink-0">
            <Link
              href="/portfolio/offers"
              onClick={() => setOpen(false)}
              className="text-xs text-primary hover:underline underline-offset-2"
            >
              View all offers →
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
