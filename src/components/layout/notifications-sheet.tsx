"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell, X, Tag, ShoppingCart, ArrowRightLeft,
  XCircle, ArrowRight, Inbox, HandCoins,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useNotifications } from "@/hooks/use-notifications";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { formatDisplayPrice, ipfsToHttp, cn } from "@/lib/utils";
import type { ApiOrder, ApiActivity } from "@medialane/sdk";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const ACTIVITY_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  accent: string;
}> = {
  sale:      { label: "Sale",      icon: ShoppingCart,  iconColor: "text-green-500",          iconBg: "bg-green-500/10",  accent: "border-green-500/40"  },
  listing:   { label: "Listed",    icon: Tag,           iconColor: "text-blue-500",            iconBg: "bg-blue-500/10",   accent: "border-blue-500/40"   },
  offer:     { label: "Offer",     icon: HandCoins,     iconColor: "text-violet-500",          iconBg: "bg-violet-500/10", accent: "border-violet-500/40" },
  transfer:  { label: "Transfer",  icon: ArrowRightLeft, iconColor: "text-muted-foreground",  iconBg: "bg-muted/40",      accent: "border-border/40"     },
  cancelled: { label: "Cancelled", icon: XCircle,       iconColor: "text-red-400",             iconBg: "bg-red-500/10",    accent: "border-red-500/30"    },
};

const FALLBACK_CONFIG = {
  label: "Activity", icon: Bell, iconColor: "text-muted-foreground", iconBg: "bg-muted/40", accent: "border-border/40",
};

// ── Offer notification row ────────────────────────────────────────────────────

function OfferRow({ offer, onClose }: { offer: ApiOrder; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);
  const image = offer.token?.image && !imgError ? ipfsToHttp(offer.token.image) : null;
  const href = `/asset/${offer.consideration.token}/${offer.consideration.identifier}`;

  return (
    <div className="relative flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors border-l-2 border-blue-500/60 bg-blue-500/[0.03]">
      {/* Thumbnail */}
      <Link href={href} onClick={onClose} className="shrink-0 block">
        <div className="h-11 w-11 rounded-xl overflow-hidden bg-muted ring-1 ring-border/50">
          {image ? (
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-violet-500/20" />
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">New offer</span>
          <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
        </div>
        <p className="text-sm font-medium leading-snug truncate">
          {offer.token?.name ?? `Token #${offer.consideration.identifier}`}
        </p>
        {offer.price?.formatted && (
          <p className="flex items-center gap-1 text-xs font-semibold mt-0.5">
            <CurrencyIcon symbol={offer.price.currency} size={11} />
            {formatDisplayPrice(offer.price.formatted)}
            <span className="text-muted-foreground font-normal">{offer.price.currency}</span>
          </p>
        )}
      </div>

      {/* Timestamp + action */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[10px] text-muted-foreground/60">
          {offer.createdAt ? formatTimestamp(offer.createdAt) : ""}
        </span>
        <Link
          href={href}
          onClick={onClose}
          className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-500 hover:text-blue-400 transition-colors"
        >
          View <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityRow({ event }: { event: ApiActivity }) {
  const cfg = ACTIVITY_CONFIG[event.type] ?? FALLBACK_CONFIG;
  const Icon = cfg.icon;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-l-2",
      cfg.accent
    )}>
      {/* Icon */}
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", cfg.iconBg)}>
        <Icon className={cn("h-4 w-4", cfg.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground">{cfg.label}</p>
        {event.price?.formatted && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <CurrencyIcon symbol={event.price.currency} size={10} />
            {formatDisplayPrice(event.price.formatted)}
            <span>{event.price.currency}</span>
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-muted-foreground/50 shrink-0">
        {formatTimestamp(event.timestamp)}
      </span>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 gap-3 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Inbox className="h-6 w-6 text-muted-foreground/30" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">All caught up</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          New offers and activity on your assets will appear here.
        </p>
      </div>
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[360px] p-0 flex flex-col gap-0">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-sm font-semibold">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                  onClick={markAllSeen}
                >
                  Mark read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {!hasContent ? (
              <EmptyState />
            ) : (
              <div>
                {/* Unseen offers */}
                {unseenOffers.length > 0 && (
                  <>
                    <SectionLabel>New · {unseenOffers.length} offer{unseenOffers.length > 1 ? "s" : ""}</SectionLabel>
                    {unseenOffers.map((offer) => (
                      <OfferRow key={offer.orderHash} offer={offer} onClose={() => setOpen(false)} />
                    ))}
                  </>
                )}

                {/* Recent activity */}
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
          <div className="px-4 py-3 border-t border-border/60 shrink-0 flex items-center justify-between gap-3">
            <Link
              href="/portfolio/offers"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              All offers <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/portfolio/activity"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              All activity <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

        </SheetContent>
      </Sheet>
    </>
  );
}
