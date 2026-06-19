"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import {
  ListingCard as PackageListingCard,
  ListingCardSkeleton,
} from "@medialane/ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Layers, ArrowRightLeft, Flag, GitBranch, HandCoins, ArrowUpRight, Zap, UserCircle2, XCircle, Loader2 } from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import { validatePin } from "@/components/ui/pin-input";
import { useMarketplace } from "@/hooks/use-marketplace";
import { MarketplacePinStep, MarketplaceDialogHero } from "@/components/marketplace/marketplace-dialog-primitives";
import { CancelListingDialog } from "@/app/asset/[chain]/[contract]/[tokenId]/cancel-listing-dialog";
import { ReportDialog } from "@/components/report-dialog";
import { useWalletAuthMethod } from "@/hooks/use-wallet-auth-method";
import type { ApiOrder } from "@medialane/sdk";

export { ListingCardSkeleton };

interface ListingCardProps {
  order: ApiOrder;
  onBuy?: (order: ApiOrder) => void;
  /** Compact mode: tighter layout, no action buttons. For dense grids. */
  compact?: boolean;
  /** True when the viewer owns this listing — shows owner actions instead of buyer actions. */
  isOwner?: boolean;
}

/**
 * io's ListingCard is a thin wrapper over `@medialane/ui`'s shared card: the
 * package owns layout/visuals; this wrapper keeps io's ChipiPay-coupled owner
 * cancel flow (PIN / passkey) and the action menus, injected via the card's
 * `primaryAction` + `overflowMenu` slots.
 */
export function ListingCard({ order, onBuy, compact = false, isOwner = false }: ListingCardProps) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { cancelOrder } = useMarketplace();
  // Authoritative passkey-vs-PIN (cross-device), not just device-local WebAuthn support.
  const { usesPasskey, authenticate, encryptKey } = useWalletAuthMethod();
  const isPasskeyUser = usesPasskey;

  const [reportOpen, setReportOpen] = useState(false);

  // ─── Cancel flow state ────────────────────────────────────────────────────
  const [cancelPinOpen, setCancelPinOpen] = useState(false);
  const [cancelPin, setCancelPin] = useState("");
  const [cancelPinError, setCancelPinError] = useState<string | null>(null);
  const [cancelStep, setCancelStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);

  const invalidateOrders = () =>
    mutate((key) => typeof key === "string" && key.includes("/v1/orders"), undefined, { revalidate: true });

  const executeCancel = async (pinOrKey: string) => {
    setCancelStep("processing");
    setCancelError(null);
    try {
      const nftStandard = order.offer.itemType === "ERC20"
        ? order.consideration.itemType
        : order.offer.itemType;
      const hash = await cancelOrder({ orderHash: order.orderHash, pin: pinOrKey, tokenStandard: nftStandard });
      if (!hash) throw new Error("Cancellation failed");
      setCancelStep("success");
      invalidateOrders();
    } catch (err) {
      setCancelStep("error");
      setCancelError(err instanceof Error ? err.message : "Cancellation failed");
    }
  };

  const handleCancelClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPasskeyUser) {
      setIsAuthenticatingPasskey(true);
      try {
        const derived = encryptKey ?? await authenticate();
        if (!derived) throw new Error("Passkey authentication failed.");
        await executeCancel(derived);
      } catch (err) {
        toast.error("Passkey failed", { description: err instanceof Error ? err.message : undefined });
      } finally {
        setIsAuthenticatingPasskey(false);
      }
    } else {
      setCancelPinOpen(true);
    }
  };

  const handlePinSubmit = async () => {
    const err = validatePin(cancelPin);
    if (err) { setCancelPinError(err); return; }
    setCancelPinError(null);
    setCancelPinOpen(false);
    await executeCancel(cancelPin);
    setCancelPin("");
  };

  const isListing = order.offer.itemType === "ERC721" || order.offer.itemType === "ERC1155";
  const name = order.token?.name ?? `Token #${order.nftTokenId}`;
  const image = order.token?.image ? ipfsToHttp(order.token.image) : null;

  // Compact grids: delegate entirely (no actions).
  if (compact) {
    return <PackageListingCard order={order} compact />;
  }

  // ─── Owner cancel — the auth-coupled primary control stays here ─────────────
  const cancelPrimary = (
    <button
      disabled={isAuthenticatingPasskey}
      className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-[9px] border border-brand-orange/50 bg-brand-orange/10 text-brand-orange text-xs font-semibold hover:bg-brand-orange/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
      onClick={handleCancelClick}
    >
      {isAuthenticatingPasskey
        ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
        : <XCircle className="h-3.5 w-3.5 shrink-0" />}
      Cancel
    </button>
  );

  // ─── Overflow menus ─────────────────────────────────────────────────────────
  const ownerMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0 rounded-[9px]" onClick={(e) => e.preventDefault()} aria-label="More actions">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="flex items-center gap-2">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            View asset
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2 text-brand-orange focus:text-brand-orange" onClick={handleCancelClick}>
          <XCircle className="h-3.5 w-3.5" />
          Cancel listing
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 text-brand-purple focus:text-brand-purple"
          onClick={(e) => { e.preventDefault(); router.push(`/create/remix/${order.nftContract}/${order.nftTokenId}`); }}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Remix
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/collections/${order.nftContract}`} className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            View collection
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="flex items-center gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
            Transfer
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const buyerMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0 rounded-[9px]" onClick={(e) => e.preventDefault()} aria-label="More actions">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="flex items-center gap-2">
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            View asset
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {onBuy && (
          <DropdownMenuItem
            className="flex items-center gap-2 text-brand-blue focus:text-brand-blue"
            onClick={(e) => { e.preventDefault(); onBuy(order); }}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="flex items-center gap-1">
              Buy —
              <CurrencyIcon symbol={order.price.currency} size={12} />
              {formatDisplayPrice(order.price.formatted)}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="flex items-center gap-2 text-brand-orange focus:text-brand-orange"
          onClick={(e) => { e.preventDefault(); router.push(`/asset/${order.nftContract}/${order.nftTokenId}`); }}
        >
          <HandCoins className="h-3.5 w-3.5" />
          Make offer
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center gap-2 text-brand-purple focus:text-brand-purple"
          onClick={(e) => { e.preventDefault(); router.push(`/create/remix/${order.nftContract}/${order.nftTokenId}`); }}
        >
          <GitBranch className="h-3.5 w-3.5" />
          Remix
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/collections/${order.nftContract}`} className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            View collection
          </Link>
        </DropdownMenuItem>
        {order.offerer && (
          <DropdownMenuItem asChild>
            <Link href={`/account/${order.offerer}`} className="flex items-center gap-2">
              <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              View owner
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={`/asset/${order.nftContract}/${order.nftTokenId}`} className="flex items-center gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
            Transfer
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-muted-foreground focus:text-muted-foreground"
          onClick={(e) => { e.preventDefault(); setReportOpen(true); }}
        >
          <Flag className="h-3.5 w-3.5" />
          Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const offerMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 w-9 p-0 shrink-0 rounded-[9px]" onClick={(e) => e.preventDefault()} aria-label="More actions">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/collections/${order.nftContract}`} className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            View collection
          </Link>
        </DropdownMenuItem>
        {order.offerer && (
          <DropdownMenuItem asChild>
            <Link href={`/account/${order.offerer}`} className="flex items-center gap-2">
              <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
              View bidder
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-muted-foreground focus:text-muted-foreground"
          onClick={(e) => { e.preventDefault(); setReportOpen(true); }}
        >
          <Flag className="h-3.5 w-3.5" />
          Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <PackageListingCard
        order={order}
        onBuy={isListing && !isOwner ? onBuy : undefined}
        primaryAction={isListing && isOwner ? cancelPrimary : undefined}
        overflowMenu={isListing ? (isOwner ? ownerMenu : buyerMenu) : offerMenu}
      />

      {reportOpen && (
        <ReportDialog
          target={{ type: "TOKEN", contract: order.nftContract ?? "", tokenId: order.nftTokenId ?? "", name: order.token?.name ?? undefined }}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}

      {/* PIN dialog — only shown for PIN users */}
      {!isPasskeyUser && (
        <Dialog open={cancelPinOpen} onOpenChange={(v) => { if (!v) { setCancelPinOpen(false); setCancelPin(""); setCancelPinError(null); } }}>
          <DialogContent className="max-w-[calc(100%-12px)] sm:max-w-sm rounded-2xl p-0 overflow-hidden gap-0">
            <DialogTitle className="sr-only">Cancel listing — {name}</DialogTitle>
            <MarketplaceDialogHero
              tokenImage={image}
              tokenName={name}
              tokenId={order.nftTokenId ?? ""}
              fallbackIcon={<XCircle className="h-12 w-12 text-brand-orange/30" />}
            />
            <div className="flex items-end justify-between px-6 pt-3 pb-1">
              <div className="min-w-0">
                <p className="font-bold text-lg leading-tight truncate">{name}</p>
                {order.price && (
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                    <CurrencyIcon symbol={order.price.currency} size={12} />
                    {formatDisplayPrice(order.price.formatted)} {order.price.currency}
                  </p>
                )}
              </div>
            </div>
            <MarketplacePinStep
              description="Enter your PIN to cancel this listing."
              pin={cancelPin}
              onPinChange={(v) => { setCancelPin(v); setCancelPinError(null); }}
              pinError={cancelPinError}
              secondaryLabel="Back"
              onSecondary={() => { setCancelPinOpen(false); setCancelPin(""); setCancelPinError(null); }}
              primaryLabel="Cancel listing"
              primaryVariant="destructive"
              onPrimary={handlePinSubmit}
              primaryDisabled={cancelPin.length < 6}
              passkeySupported={false}
            />
          </DialogContent>
        </Dialog>
      )}

      <CancelListingDialog
        cancelStep={cancelStep}
        cancelError={cancelError}
        tokenName={name}
        tokenImage={image}
        onReset={() => { setCancelStep("idle"); setCancelError(null); }}
      />
    </>
  );
}
