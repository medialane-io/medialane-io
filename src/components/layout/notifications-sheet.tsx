"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, ArrowRight, Inbox, HandCoins, Zap, ArrowRightLeft, Tag, Sparkles, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useNotifications } from "@/hooks/use-notifications";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { formatDisplayPrice, timeAgo, ipfsToHttp } from "@/lib/utils";
import type { ApiOrder, ApiActivity } from "@medialane/sdk";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  sale:      Zap,
  listing:   Tag,
  offer:     HandCoins,
  transfer:  ArrowRightLeft,
  cancelled: X,
  mint:      Sparkles,
};

const ACTIVITY_COLOR: Record<string, string> = {
  sale:      "text-violet-400 bg-violet-500/10",
  listing:   "text-sky-400 bg-sky-500/10",
  offer:     "text-amber-400 bg-amber-500/10",
  transfer:  "text-slate-400 bg-slate-500/10",
  cancelled: "text-rose-400 bg-rose-500/10",
  mint:      "text-emerald-400 bg-emerald-500/10",
};

const ACTIVITY_LABEL: Record<string, string> = {
  sale:      "Sold",
  listing:   "Listed",
  offer:     "Offer received",
  transfer:  "Transferred",
  cancelled: "Cancelled",
  mint:      "Minted",
};

// ── Offer row ─────────────────────────────────────────────────────────────────

function OfferRow({ offer, onClose }: { offer: ApiOrder; onClose: () => void }) {
  const image = offer.token?.image ? ipfsToHttp(offer.token.image) : null;
  const name = offer.token?.name ?? `Token #${offer.consideration.identifier}`;

  return (
    <Link
      href={`/asset/${offer.consideration.token}/${offer.consideration.identifier}`}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group"
    >
      {/* Token thumb */}
      <div className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0 bg-muted">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
            <HandCoins className="h-4 w-4 text-amber-400" aria-hidden />
          </div>
        )}
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" aria-label="New" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug truncate">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">New offer received</p>
        {offer.price?.formatted && (
          <p className="flex items-center gap-1 text-xs font-bold mt-0.5 text-foreground">
            <CurrencyIcon symbol={offer.price.currency} size={10} aria-hidden />
            {formatDisplayPrice(offer.price.formatted)}
            <span className="text-muted-foreground font-normal">{offer.price.currency}</span>
          </p>
        )}
      </div>

      {offer.createdAt && (
        <span className="text-[10px] text-muted-foreground/50 shrink-0 self-start mt-0.5">
          {timeAgo(offer.createdAt)}
        </span>
      )}
    </Link>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────

function ActivityEventRow({ event }: { event: ApiActivity }) {
  const Icon = ACTIVITY_ICON[event.type] ?? Sparkles;
  const colorClass = ACTIVITY_COLOR[event.type] ?? "text-muted-foreground bg-muted";
  const label = ACTIVITY_LABEL[event.type] ?? event.type;

  const contract = event.nftContract ?? event.contractAddress ?? null;
  const tokenId = event.nftTokenId ?? event.tokenId ?? null;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug truncate">
          {label}
          {contract && tokenId && (
            <>
              {" · "}
              <Link
                href={`/asset/${contract}/${tokenId}`}
                className="text-primary hover:underline underline-offset-2"
              >
                #{tokenId}
              </Link>
            </>
          )}
        </p>
        {event.price?.formatted && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <CurrencyIcon symbol={event.price.currency} size={10} aria-hidden />
            {formatDisplayPrice(event.price.formatted)}
            <span>{event.price.currency}</span>
          </p>
        )}
      </div>

      <span className="text-[10px] text-muted-foreground/50 shrink-0 self-start mt-0.5">
        {timeAgo(event.timestamp)}
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
    <div className="flex flex-col items-center justify-center py-16 px-6 gap-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-center">
        <Inbox className="h-6 w-6 text-muted-foreground/40" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">All caught up</p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
          New offers and marketplace activity will appear here.
        </p>
      </div>
      <div className="flex gap-2">
        <Link
          href="/marketplace"
          className="text-xs text-primary hover:underline underline-offset-2"
        >
          Browse marketplace
        </Link>
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
            <Bell className="size-4" aria-hidden />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center"
                aria-label={`${unreadCount} unread`}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span>Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-sm p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 pr-12">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" aria-hidden />
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
                Mark all read
              </Button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {!hasContent ? (
              <EmptyState />
            ) : (
              <>
                {unseenOffers.length > 0 && (
                  <>
                    <SectionLabel>
                      {unseenOffers.length} new offer{unseenOffers.length > 1 ? "s" : ""}
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
                      <ActivityEventRow key={i} event={event} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border shrink-0 flex items-center justify-between bg-muted/20">
            <Link
              href="/portfolio/offers"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              All offers <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/activities"
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
