"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Package, ChevronRight, ExternalLink, Clock, HandCoins,
  Tag, ArrowRightLeft, ShoppingCart, X, CheckCircle,
  Loader2, Flag, GitBranch, DollarSign, Users, Shield, Calendar,
} from "lucide-react";
import { useToken, useTokenHistory } from "@/hooks/use-tokens";
import { useCollection } from "@/hooks/use-collections";
import { useDropInfo, getDropStatus, type DropConditions } from "@/hooks/use-drops";
import { useTokenListings } from "@/hooks/use-orders";
import { useSessionKey } from "@/hooks/use-session-key";
import { useOrderActions } from "./use-order-actions";
import { CancelListingDialog } from "./cancel-listing-dialog";
import { useCart } from "@/hooks/use-cart";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useComments } from "@/hooks/use-comments";
import { useTokenRemixes } from "@/hooks/use-remix-offers";
import { ipfsToHttp, formatDisplayPrice, timeUntil, checkIsOwner } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { AddressDisplay } from "@/components/shared/address-display";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { ShareButton } from "@/components/shared/share-button";
import { ReportDialog } from "@/components/report-dialog";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { CommentsSection } from "@/components/asset/comments-section";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { EXPLORER_URL } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetProvenanceTab } from "./asset-provenance-tab";
import { HelpIcon } from "@/components/ui/help-icon";
import { getListableTokens } from "@medialane/sdk";
import type { ApiOrder, ApiActivity } from "@medialane/sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getTokenByAddress(address: string) {
  return getListableTokens().find((t) => t.address.toLowerCase() === address.toLowerCase()) ?? null;
}

function DropStatusBadge({ status }: { status: ReturnType<typeof getDropStatus> }) {
  const map = {
    live:     { label: "Live",     cls: "text-green-400 bg-green-500/10 border-green-500/20", dot: true  },
    upcoming: { label: "Upcoming", cls: "text-blue-400 bg-blue-500/10 border-blue-500/20",   dot: false },
    ended:    { label: "Ended",    cls: "text-muted-foreground bg-muted border-border",       dot: false },
    sold_out: { label: "Sold out", cls: "text-orange-400 bg-orange-500/10 border-orange-500/20", dot: false },
  } as const;
  const { label, cls, dot } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-1 border", cls)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />}
      {label}
    </span>
  );
}

function SupplyProgress({ minted, max }: { minted: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (minted / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minted.toLocaleString()} minted</span>
        <span>of {max.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-orange-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% minted</p>
    </div>
  );
}

function DropInfoPanel({ conditions, totalMinted }: { conditions: DropConditions | null; totalMinted: number }) {
  if (!conditions) return null;
  const status = getDropStatus(conditions, totalMinted);
  const maxSupply = parseInt(conditions.maxSupply, 10);
  const formatTs = (ts: number) =>
    new Date(ts * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  const priceToken =
    conditions.price !== "0" && conditions.paymentToken !== "0x0"
      ? getTokenByAddress(conditions.paymentToken)
      : null;
  const priceNum = priceToken
    ? Number(BigInt(conditions.price) * 10000n / BigInt(10 ** priceToken.decimals)) / 10000
    : null;

  return (
    <div className="rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-orange-500" />
        <p className="text-sm font-semibold">Drop</p>
        <DropStatusBadge status={status} />
      </div>

      {maxSupply > 0 && <SupplyProgress minted={totalMinted} max={maxSupply} />}

      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 shrink-0" />
          {priceNum !== null ? `${priceNum} ${priceToken?.symbol}` : "Free mint"}
        </div>
        {conditions.maxPerWallet !== "0" && (
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 shrink-0" />
            Max {conditions.maxPerWallet} per wallet
          </div>
        )}
        <div className="flex items-center gap-1.5 col-span-2">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formatTs(conditions.startTime)} → {formatTs(conditions.endTime)}
        </div>
      </div>
    </div>
  );
}

export function AssetPageDrop() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { walletAddress } = useSessionKey();
  const { token } = useToken(contract, tokenId);
  const { collection } = useCollection(contract);
  const { dropInfo } = useDropInfo(contract);
  const { history } = useTokenHistory(contract, tokenId);
  const { listings, mutate: mutateListings } = useTokenListings(contract, tokenId);
  const {
    isProcessing,
    orderToCancel, cancelPinOpen, cancelStep, cancelError,
    orderToAccept, acceptPinOpen,
    handleCancelClick, handleCancelPin,
    handleAcceptClick, handleAcceptPin,
    dismissCancelPin, dismissAcceptPin, resetCancelStep,
  } = useOrderActions({ mutateListings });
  const { addItem, items: cartItems, setIsOpen: setCartOpen } = useCart();
  const { total: commentTotal } = useComments(contract, tokenId);
  const { total: remixCount } = useTokenRemixes(contract, tokenId);
  const shouldReduce = useReducedMotion();

  const imageUrl = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const { imgRef, dynamicTheme } = useDominantColor(imageUrl);

  const [imgError, setImgError] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState<ApiOrder | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  const activeListings = listings.filter(
    (l) => l.status === "ACTIVE" && (l.offer.itemType === "ERC721" || l.offer.itemType === "ERC1155")
  );
  const activeBids = listings.filter((l) => l.status === "ACTIVE" && l.offer.itemType === "ERC20");
  const cheapest = [...activeListings].sort((a, b) =>
    BigInt(a.consideration.startAmount) < BigInt(b.consideration.startAmount) ? -1 : 1
  )[0];
  const isOwner = checkIsOwner(token, walletAddress);
  const myListing = isOwner
    ? activeListings.find((l) => l.offerer.toLowerCase() === walletAddress!.toLowerCase())
    : null;
  const inCart = cheapest ? cartItems.some((i) => i.orderHash === cheapest.orderHash) : false;

  const name = token?.metadata?.name ?? `Token #${tokenId}`;

  const handleAddToCart = () => {
    if (!cheapest || inCart) return;
    addItem(
      {
        orderHash: cheapest.orderHash,
        nftContract: contract,
        nftTokenId: tokenId,
        itemType: "ERC721",
        name,
        image: ipfsToHttp(token?.metadata?.image) ?? "",
        price: formatDisplayPrice(cheapest.price.formatted),
        currency: cheapest.price.currency ?? "",
        currencyDecimals: cheapest.price.decimals,
        offerer: cheapest.offerer,
        considerationToken: cheapest.consideration.token,
        considerationAmount: cheapest.consideration.startAmount,
      },
      walletAddress ?? undefined
    );
    toast.success("Added to cart", { action: { label: "View cart", onClick: () => setCartOpen(true) } });
  };

  return (
    <div
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
      className="relative z-0 min-h-screen"
    >
      {imageUrl && (
        <img ref={imgRef} src={imageUrl} crossOrigin="anonymous" aria-hidden alt="" fetchPriority="high" style={{ display: "none" }} />
      )}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {imageUrl && (
          <img src={imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110" style={{ filter: "blur(60px) saturate(1.5)" }} />
        )}
      </div>

      <div className="container mx-auto px-4 pt-14 space-y-8 pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <Link href={`/collections/${contract}`} className="hover:text-foreground transition-colors truncate max-w-[140px] shrink-0">
            {collection?.name ?? contract.slice(0, 8) + "…"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:gap-10 gap-8 items-start">
          {/* Image */}
          <motion.div
            initial={shouldReduce ? false : { scale: 1.0, opacity: 0 }}
            animate={{ scale: 1.02, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="overflow-hidden rounded-xl lg:sticky lg:top-16"
          >
            <div className="rounded-2xl overflow-hidden border border-border bg-muted">
              {imageUrl && !imgError ? (
                <Image src={imageUrl} alt={name} width={0} height={0} sizes="(max-width: 1024px) 100vw, 66vw" className="w-full h-auto" onError={() => setImgError(true)} priority />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-amber-600/10">
                  <Package className="h-20 w-20 text-orange-500/30" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-5"
          >
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-500">
                  <Package className="h-3 w-3" />
                  Drop
                </span>
              </div>
              {(token?.balances?.[0]?.owner ?? token?.owner) ? (
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Owner</span>
                  <Link href={`/creator/${token?.balances?.[0]?.owner ?? token?.owner}`} className="hover:text-primary transition-colors font-medium">
                    <AddressDisplay address={(token?.balances?.[0]?.owner ?? token?.owner)!} />
                  </Link>
                </div>
              ) : null}
              <h1 className="text-3xl lg:text-5xl font-bold">{name}</h1>
              {token?.metadata?.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{token.metadata.description}</p>
              )}
            </div>

            {/* Drop info panel */}
            {dropInfo && <DropInfoPanel conditions={dropInfo.conditions} totalMinted={dropInfo.totalMinted} />}

            {/* Secondary market action box */}
            {cheapest ? (
              <div className="rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CurrencyIcon symbol={cheapest.price.currency ?? ""} size={22} />
                  <span className="text-3xl font-bold">{formatDisplayPrice(cheapest.price.formatted)}</span>
                  <HelpIcon content={`${isOwner ? "Your listing" : "Current price"} · Expires ${timeUntil(cheapest.endTime)}`} side="top" />
                </div>
                {isOwner ? (
                  <div className="space-y-2">
                    {myListing && (
                      <div className="btn-border-animated p-[1px] rounded-2xl">
                        <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-destructive disabled:opacity-50" disabled={isProcessing} onClick={() => handleCancelClick(myListing)}>
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          Cancel listing
                        </button>
                      </div>
                    )}
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-blue" onClick={() => setListOpen(true)}>
                        <Tag className="h-4 w-4" />List for sale
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange" onClick={() => setTransferOpen(true)}>
                        <ArrowRightLeft className="h-4 w-4" />Transfer
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-purple" onClick={() => router.push(`/create/remix/${contract}/${tokenId}`)}>
                        <GitBranch className="h-4 w-4" />Create a Remix
                      </button>
                    </div>
                  </div>
                ) : isSignedIn ? (
                  <div className="space-y-2">
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button className="w-full h-12 text-base font-semibold text-white rounded-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-background/30" onClick={() => setPurchaseOrder(cheapest)}>
                        <ShoppingCart className="h-5 w-5" />Buy Asset
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`btn-border-animated p-[1px] rounded-2xl ${inCart ? "opacity-40 pointer-events-none" : ""}`}>
                        <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-blue" disabled={inCart} onClick={handleAddToCart}>
                          <ShoppingCart className="h-4 w-4" />{inCart ? "In cart" : "Add to cart"}
                        </button>
                      </div>
                      <div className="btn-border-animated p-[1px] rounded-2xl">
                        <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange" onClick={() => setOfferOpen(true)}>
                          <HandCoins className="h-4 w-4" />Make offer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <SignInButton mode="modal">
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <Button className="w-full h-12 text-base bg-background/30 text-white rounded-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]">
                        <ShoppingCart className="h-5 w-5 mr-2" />Sign in to trade
                      </Button>
                    </div>
                  </SignInButton>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border p-5 space-y-2">
                {isOwner ? (
                  <>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30" onClick={() => setListOpen(true)}>
                        <Tag className="h-4 w-4" />List for sale
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange" onClick={() => setTransferOpen(true)}>
                        <ArrowRightLeft className="h-4 w-4" />Transfer
                      </button>
                    </div>
                  </>
                ) : isSignedIn ? (
                  <div className="btn-border-animated p-[1px] rounded-2xl">
                    <button className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange" onClick={() => setOfferOpen(true)}>
                      <HandCoins className="h-4 w-4" />Make offer
                    </button>
                  </div>
                ) : (
                  <SignInButton mode="modal">
                    <Button variant="outline" className="w-full">Sign in to make an offer</Button>
                  </SignInButton>
                )}
              </div>
            )}

            {/* My active bid banner */}
            {!isOwner && walletAddress && (() => {
              const myBid = activeBids.find((b) => b.offerer.toLowerCase() === walletAddress.toLowerCase());
              if (!myBid) return null;
              return (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <HandCoins className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-500">Your active offer</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-foreground inline-flex items-center gap-1">{formatDisplayPrice(myBid.price.formatted)}<CurrencyIcon symbol={myBid.price.currency ?? ""} size={12} /></span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />{timeUntil(myBid.endTime)}
                      </p>
                    </div>
                  </div>
                  <button className="shrink-0 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1" onClick={() => handleCancelClick(myBid)}>
                    <X className="h-3.5 w-3.5" />Cancel
                  </button>
                </div>
              );
            })()}

            {/* Incoming offers (owner only) */}
            {isOwner && activeBids.length > 0 && (
              <div className="rounded-xl border border-border p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incoming offers ({activeBids.length})</p>
                <div className="space-y-2">
                  {activeBids.map((bid) => (
                    <div key={bid.orderHash} className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold inline-flex items-center gap-1.5">{formatDisplayPrice(bid.price.formatted)} <CurrencyIcon symbol={bid.price.currency ?? ""} size={14} /></p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <AddressDisplay address={bid.offerer} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">·</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{timeUntil(bid.endTime)}</div>
                        </div>
                      </div>
                      <Button size="sm" disabled={isProcessing} onClick={() => handleAcceptClick(bid)}><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Accept</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 text-sm">
              <a href={`${EXPLORER_URL}/contract/${contract}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                Contract <ExternalLink className="h-3 w-3" />
              </a>
              <Link href={`/launchpad/drop/${contract}`} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-1.5 hover:bg-muted/40 transition-colors group min-w-0">
                <Package className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="text-xs font-medium truncate group-hover:text-primary transition-colors">Drop page</span>
              </Link>
              <ShareButton title={name} variant="ghost" size="icon" />
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground" onClick={() => setReportOpen(true)}><Flag className="w-4 h-4" /></button>
            </div>

            <ReportDialog target={{ type: "TOKEN", contract, tokenId, name }} open={reportOpen} onOpenChange={setReportOpen} />
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="markets">
          <TabsList>
            <TabsTrigger value="markets">
              Markets {(activeListings.length + activeBids.length) > 0 && `(${activeListings.length + activeBids.length})`}
            </TabsTrigger>
            <TabsTrigger value="provenance">
              Provenance {history.length > 0 && `(${history.length})`}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="markets">
            <AssetMarketsTab activeListings={activeListings} activeBids={activeBids} walletAddress={walletAddress ?? undefined} isOwner={isOwner} isProcessing={isProcessing} onBuyClick={setPurchaseOrder} onCancelClick={handleCancelClick} onAcceptClick={handleAcceptClick} />
          </TabsContent>
          <TabsContent value="provenance">
            <AssetProvenanceTab history={history as ApiActivity[]} contract={contract} tokenId={tokenId} remixCount={remixCount} />
          </TabsContent>
        </Tabs>
      </div>

      <FloatingCommentsButton onClick={() => setCommentOpen(true)} commentTotal={commentTotal} />

      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="w-full max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">
          <div className="flex items-center gap-3 pr-10 pl-4 pt-4 pb-3 shrink-0 border-b border-orange-500/20" style={{ background: "linear-gradient(135deg, hsl(var(--brand-orange) / 0.10), hsl(var(--brand-purple) / 0.08))" }}>
            <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 ring-2 ring-white/20 bg-orange-500/20">
              {imageUrl && <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized />}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle asChild><p className="text-[10px] font-medium uppercase tracking-wider text-orange-400">Comments</p></DialogTitle>
              <p className="text-sm font-semibold truncate text-foreground">{name}</p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <CommentsSection contract={contract} tokenId={tokenId} className="h-full rounded-none border-0" />
          </div>
        </DialogContent>
      </Dialog>

      {purchaseOrder && <PurchaseDialog order={purchaseOrder} open onOpenChange={(v) => { if (!v) setPurchaseOrder(null); }} onSuccess={mutateListings} />}
      <ListingDialog open={listOpen} onOpenChange={setListOpen} assetContract={contract} tokenId={tokenId} tokenName={name} tokenStandard="ERC721" tokenImage={imageUrl} onSuccess={mutateListings} />
      <OfferDialog open={offerOpen} onOpenChange={setOfferOpen} assetContract={contract} tokenId={tokenId} tokenName={name} tokenImage={imageUrl ?? undefined} tokenStandard="ERC721" />
      <PinDialog open={cancelPinOpen} onSubmit={handleCancelPin} onCancel={dismissCancelPin} title="Cancel listing" description={`Enter your PIN to cancel the listing for ${name}.`} />
      <PinDialog open={acceptPinOpen} onSubmit={handleAcceptPin} onCancel={dismissAcceptPin} title="Accept offer" description={orderToAccept ? `Accept ${formatDisplayPrice(orderToAccept.price.formatted)} ${orderToAccept.price.currency} for ${name}?` : "Enter your PIN to accept this offer."} />
      <CancelListingDialog cancelStep={cancelStep} cancelError={cancelError} onReset={resetCancelStep} />

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} contractAddress={contract} tokenId={tokenId} tokenName={name} hasActiveListing={activeListings.length > 0} tokenStandard="ERC721" onSuccess={mutateListings} />
    </div>
  );
}
