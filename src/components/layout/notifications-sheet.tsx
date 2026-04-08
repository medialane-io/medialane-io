"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ArrowRight, Inbox } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useNotifications } from "@/hooks/use-notifications";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { formatDisplayPrice } from "@/lib/utils";
import type { ApiOrder, ApiActivity } from "@medialane/sdk";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACTIVITY_LABEL: Record<string, string> = {
  sale:      "Sale",
  listing:   "Listed",
  offer:     "Offer",
  transfer:  "Transfer",
  cancelled: "Cancelled",
};

function formatTimestamp(ts: string | number): string {
  const date = new Date(typeof ts === "number" ? ts * 1000 : ts);
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString();
}

// ── Notification rows (original clean style) ─────────────────────────────────

function OfferRow({ offer, onClose }: { offer: ApiOrder; onClose: () => void }) {
  return (
    <Link
      href={`/asset/${offer.consideration.token}/${offer.consideration.identifier}`}
      onClick={onClose}
      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">New offer received</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {offer.token?.name ?? `Token #${offer.consideration.identifier}`}
        </p>
        {offer.price?.formatted && (
          <p className="flex items-center gap-1 text-xs font-semibold mt-0.5">
            <CurrencyIcon symbol={offer.price.currency} size={10} />
            {formatDisplayPrice(offer.price.formatted)}
            <span className="text-muted-foreground font-normal">{offer.price.currency}</span>
          </p>
        )}
      </div>
      {offer.createdAt && (
        <span className="text-[10px] text-muted-foreground/50 shrink-0 mt-0.5">
          {formatTimestamp(offer.createdAt)}
        </span>
      )}
    </Link>
  );
}

function ActivityRow({ event }: { event: ApiActivity }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/30 mt-1.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground leading-snug">
          {ACTIVITY_LABEL[event.type] ?? event.type}
        </p>
        {event.price?.formatted && (
          <p className="flex items-center gap-1 text-xs font-semibold text-foreground mt-0.5">
            <CurrencyIcon symbol={event.price.currency} size={10} />
            {formatDisplayPrice(event.price.formatted)}
            <span className="text-muted-foreground font-normal">{event.price.currency}</span>
          </p>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground/50 shrink-0 mt-0.5">
        {formatTimestamp(event.timestamp)}
      </span>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 bg-muted/20 border-y border-border/40">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        {children}
      </p>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 gap-3 text-center">
      <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center">
        <Inbox className="h-5 w-5 text-muted-foreground/30" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">All caught up</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          New offers and activity will appear here.
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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

  const hasContent = unseenOffers.length > 0 || recentActivities.length > 0;

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-sm p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">

          {/* Header — pr-10 to clear the Dialog's built-in close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 pr-10">
            <div className="flex items-center gap-2">
              <DialogTitle className="text-sm font-semibold">Notifications</DialogTitle>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
                onClick={markAllSeen}
              >
                Mark read
              </Button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {!hasContent ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-border/50">
                {unseenOffers.length > 0 && (
                  <>
                    <SectionLabel>
                      New · {unseenOffers.length} offer{unseenOffers.length > 1 ? "s" : ""}
                    </SectionLabel>
                    {unseenOffers.map((offer) => (
                      <OfferRow key={offer.orderHash} offer={offer} onClose={() => setOpen(false)} />
                    ))}
                  </>
                )}
                {recentActivities.length > 0 && (
                  <>
                    <SectionLabel>Recent activity</SectionLabel>
                    {recentActivities.map((event, i) => (
                      <ActivityRow key={i} event={event} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border shrink-0 flex items-center justify-between">
            <Link
              href="/portfolio/offers"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              All offers <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/portfolio/activity"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              All activity <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
}
