"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useToken, useTokenHistory } from "@/hooks/use-tokens";
import { useTokenListings } from "@/hooks/use-orders";
import { useCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { AddressDisplay } from "@/components/shared/address-display";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { ipfsToHttp, timeUntil, timeAgo, formatDisplayPrice, checkIsOwner } from "@/lib/utils";
import { ShoppingCart, Tag, ExternalLink, Clock, HandCoins, ArrowRightLeft, X, CheckCircle, DollarSign, GitBranch, UserCheck, Globe, Bot, Percent, Shield, Calendar, ChevronRight, Flag, Loader2, TrendingUp, Activity, ArrowRight, Fingerprint, Layers } from "lucide-react";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/shared/share-button";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import { LICENSE_TRAIT_TYPES } from "@/types/ip";
import type { IPType } from "@/types/ip";
import { IP_TEMPLATES } from "@/lib/ip-templates";
import { IPTypeDisplay } from "@/components/ip-type-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { PriceHistoryChart } from "@/components/asset/price-history-chart";
import { CommentsSection } from "@/components/asset/comments-section";
import { useComments } from "@/hooks/use-comments";
import { EXPLORER_URL } from "@/lib/constants";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { RemixesTab, ParentAttributionBanner } from "@/components/asset/remixes-tab";
import { useTokenRemixes } from "@/hooks/use-remix-offers";
import { HelpIcon } from "@/components/ui/help-icon";

const CURRENCY_ICONS: Record<string, string> = {
  STRK: "/strk.svg",
  ETH: "/eth.svg",
  USDC: "/usdc.svg",
  USDT: "/usdt.svg",
  WBTC: "/btc.svg",
};

function CurrencyIcon({ symbol, size = 20 }: { symbol: string; size?: number }) {
  const src = CURRENCY_ICONS[symbol?.toUpperCase()];
  if (!src) return <span className="text-sm font-semibold">{symbol}</span>;
  return <Image src={src} alt={symbol} width={size} height={size} className="inline-block" />;
}

const TYPE_LABEL: Record<string, string> = {
  transfer: "Transfer",
  listing: "Listed",
  sale: "Sale",
  offer: "Offer",
  cancelled: "Cancelled",
};

export default function AssetPageClient() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const { walletAddress } = useSessionKey();
  const { collection } = useCollection(contract);
  const { token, isLoading } = useToken(contract, tokenId);
  const { listings, mutate: mutateListings } = useTokenListings(contract, tokenId);
  const { history } = useTokenHistory(contract, tokenId);
  const { cancelOrder, fulfillOrder, isProcessing } = useMarketplace();

  const { addItem, items: cartItems, setIsOpen: setCartOpen } = useCart();
  const shouldReduce = useReducedMotion();

  const imageUrl = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const { imgRef, dynamicTheme } = useDominantColor(imageUrl);

  const [imgError, setImgError] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState<ApiOrder | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<ApiOrder | null>(null);
  const [cancelPinOpen, setCancelPinOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [orderToAccept, setOrderToAccept] = useState<ApiOrder | null>(null);
  const [acceptPinOpen, setAcceptPinOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  const { comments, total: commentTotal } = useComments(contract, tokenId);
  const { total: remixCount } = useTokenRemixes(contract, tokenId);

  // Listings = NFT in offer (ERC721 or ERC1155 — someone selling the token)
  const activeListings = listings.filter(
    (l) => l.status === "ACTIVE" && (l.offer.itemType === "ERC721" || l.offer.itemType === "ERC1155")
  );
  // Bids = ERC20 in offer (someone bidding to buy the NFT)
  const activeBids = listings.filter(
    (l) => l.status === "ACTIVE" && l.offer.itemType === "ERC20"
  );

  const cheapest = [...activeListings].sort((a, b) =>
    BigInt(a.consideration.startAmount) < BigInt(b.consideration.startAmount) ? -1 : 1
  )[0];

  const isOwner = checkIsOwner(token, walletAddress);
  const isERC1155 = collection?.standard === "ERC1155";

  const myListing = isOwner
    ? activeListings.find((l) => l.offerer.toLowerCase() === walletAddress!.toLowerCase())
    : null;

  const inCart = cheapest ? cartItems.some((i) => i.orderHash === cheapest.orderHash) : false;

  const handleAddToCart = () => {
    if (!cheapest || inCart) return;
    addItem(
      {
        orderHash: cheapest.orderHash,
        nftContract: contract,
        nftTokenId: tokenId,
        itemType: (cheapest.offer.itemType === "ERC1155" ? "ERC1155" : "ERC721"),
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
    toast.success("Added to cart", {
      action: { label: "View cart", onClick: () => setCartOpen(true) },
    });
  };

  const handleCancelClick = (order: ApiOrder) => {
    setOrderToCancel(order);
    setCancelPinOpen(true);
  };

  const handleCancelPin = async (pin: string) => {
    setCancelPinOpen(false);
    if (!orderToCancel) return;
    setCancelStep("processing");
    setCancelError(null);
    try {
      await cancelOrder({ orderHash: orderToCancel.orderHash, pin });
      setCancelStep("success");
      mutateListings();
    } catch (err: unknown) {
      setCancelStep("error");
      setCancelError(err instanceof Error ? err.message : "Cancellation failed");
    }
  };

  const handleAcceptClick = (order: ApiOrder) => {
    setOrderToAccept(order);
    setAcceptPinOpen(true);
  };

  const handleAcceptPin = async (pin: string) => {
    setAcceptPinOpen(false);
    if (!orderToAccept) return;
    await fulfillOrder({ orderHash: orderToAccept.orderHash, pin });
    setOrderToAccept(null);
    mutateListings();
  };

  const handleAutoRemix = () => {
    router.push(`/create/remix/${contract}/${tokenId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:gap-10 gap-8">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-2xl font-bold">Asset not found</p>
        <p className="text-muted-foreground mt-2">This token hasn&apos;t been indexed yet.</p>
      </div>
    );
  }

  const name = token.metadata?.name || `Token #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const description = token.metadata?.description;
  const attributes = Array.isArray(token.metadata?.attributes)
    ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
    : [];

  // Derive active template once — shared by Media tab visibility check and attribute grid filtering.
  // Per-type keys avoid cross-type collisions from shared keys like "Genre", "Duration".
  const activeTemplate = IP_TEMPLATES[
    (attributes.find((a) => a.trait_type?.toLowerCase() === "ip type")?.value ?? "") as IPType
  ];
  const activeTemplateKeys = new Set<string>([
    "IP Type",
    ...(activeTemplate?.fields.map((f) => f.key) ?? []),
  ]);
  const hasTemplateData =
    !!activeTemplate &&
    activeTemplate.fields.length > 0 &&
    activeTemplate.fields.some((f) =>
      attributes.some((a) => a.trait_type === f.key && a.value)
    );

  // Predicate for filtering template + license attributes out of attribute grids.
  const isDisplayAttr = (a: { trait_type?: string }): boolean =>
    !LICENSE_TRAIT_TYPES.has(a.trait_type ?? "") && !activeTemplateKeys.has(a.trait_type ?? "");

  // Remix / parent detection
  const parentContract = attributes.find((a) => a.trait_type === "Parent Contract")?.value ?? null;
  const parentTokenId = attributes.find((a) => a.trait_type === "Parent Token ID")?.value ?? null;

  return (
    <div
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
      className="relative z-0 min-h-screen"
    >
      {(token as any).isHidden && <HiddenContentBanner />}
      {/* Hidden extraction image for dominant color — must be in component tree */}
      {imageUrl && (
        <img
          ref={imgRef}
          src={imageUrl}
          crossOrigin="anonymous"
          aria-hidden
          alt=""
          fetchPriority="high"
          style={{ display: "none" }}
        />
      )}
      {/* Full-bleed atmospheric background from asset image */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover opacity-20 scale-110"
            style={{ filter: "blur(60px) saturate(1.5)" }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: dynamicTheme
              ? `hsl(var(--dynamic-primary) / 0.08)`
              : "transparent"
          }}
        />
      </div>

      <div className={`container mx-auto px-4 pt-14 space-y-8 pb-8`}>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <Link
            href={`/collections/${contract}`}
            className="hover:text-foreground transition-colors truncate max-w-[140px] shrink-0"
          >
            {collection?.name ?? contract.slice(0, 8) + "…"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">{name}</span>
        </nav>

        {/* Top: image + info */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:gap-10 gap-8 items-start">
          {/* Image — sticky on desktop */}
          <motion.div
            initial={shouldReduce ? false : { scale: 1.0, opacity: 0 }}
            animate={{ scale: 1.02, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="overflow-hidden rounded-xl lg:sticky lg:top-16"
          >
            <div className="rounded-2xl overflow-hidden border border-border bg-muted">
              {image && !imgError ? (
                <Image
                  src={image}
                  alt={name}
                  width={0}
                  height={0}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="w-full h-auto"
                  onError={() => setImgError(true)}
                  priority
                />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                  <span className="text-5xl font-mono text-muted-foreground">#{tokenId}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              {parentContract && parentTokenId && (
                <div className="mb-3">
                  <ParentAttributionBanner
                    parentContract={parentContract}
                    parentTokenId={parentTokenId}
                    parentName={`Token #${parentTokenId}`}
                  />
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {token.metadata?.ipType && (
                  <IpTypeBadge ipType={token.metadata.ipType} size="md" />
                )}
                {isERC1155 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-500">
                    <Layers className="h-3 w-3" />
                    Multi-edition
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold">{name}</h1>
              {description && (
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            )}
              {/* Ownership display — single owner for ERC-721, holder list for ERC-1155 */}
              {isERC1155 ? (
                token.balances && token.balances.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {token.balances.length === 1 ? "Holder" : `${token.balances.length} holders`}
                    </p>
                    {token.balances.slice(0, 3).map((b) => (
                      <div key={b.owner} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href={`/creator/${b.owner}`} className="hover:text-primary transition-colors">
                          <AddressDisplay address={b.owner} />
                        </Link>
                        <span className="text-xs text-muted-foreground/60">× {b.amount}</span>
                      </div>
                    ))}
                    {token.balances.length > 3 && (
                      <p className="text-xs text-muted-foreground/60">+{token.balances.length - 3} more</p>
                    )}
                  </div>
                )
              ) : (token.balances?.[0]?.owner ?? token.owner) ? (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>Owned by</span>
                  <Link href={`/creator/${token.balances?.[0]?.owner ?? token.owner}`} className="hover:text-primary transition-colors">
                    <AddressDisplay address={(token.balances?.[0]?.owner ?? token.owner)!} />
                  </Link>
                </div>
              ) : null}
            </div>

            {/* Price / action box */}
            {cheapest ? (
              <div className="rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CurrencyIcon symbol={cheapest.price.currency ?? ""} size={22} />
                  <span className="text-3xl font-bold">
                    {formatDisplayPrice(cheapest.price.formatted)}
                  </span>
                  <HelpIcon
                    content={`${isOwner ? "Your listing" : "Current price"} · Expires ${timeUntil(cheapest.endTime)}`}
                    side="top"
                  />
                </div>

                {isOwner ? (
                  <div className="space-y-2">
                    {myListing && (
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-destructive disabled:opacity-50"
                        disabled={isProcessing}
                        onClick={() => handleCancelClick(myListing)}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Cancel listing
                      </button>
                    </div>
                    )}
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-blue"
                        onClick={() => setListOpen(true)}
                      >
                        <Tag className="h-4 w-4" />
                        {isERC1155 ? "List edition for sale" : "Create new listing"}
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange"
                        onClick={() => setTransferOpen(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Transfer
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-purple"
                        onClick={() => router.push(`/create/remix/${contract}/${tokenId}`)}
                      >
                        <GitBranch className="h-4 w-4" />
                        Create a Remix
                        <HelpIcon content="Build a licensed derivative of this IP asset — your remix is minted as a new onchain NFT linked to the original" side="top" />
                      </button>
                    </div>
                  </div>
                ) : isSignedIn ? (
                  <div className="space-y-2">
                    {/* Buy Now — flat bg/30, animated gradient border */}
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-12 text-base font-semibold text-white rounded-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
                        onClick={() => setPurchaseOrder(cheapest)}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        {isERC1155 ? "Buy Edition" : "Buy Asset"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Add to cart — flat brand-orange, animated gradient border */}
                      <div className={`btn-border-animated p-[1px] rounded-2xl ${inCart ? "opacity-40 pointer-events-none" : ""}`}>
                        <button
                          className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-blue"
                          disabled={inCart}
                          onClick={handleAddToCart}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {inCart ? "In cart" : "Add to cart"}
                        </button>
                      </div>
                      {/* Make offer — flat brand-purple, animated gradient border */}
                      <div className="btn-border-animated p-[1px] rounded-2xl">
                        <button
                          className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange"
                          onClick={() => setOfferOpen(true)}
                        >
                          <HandCoins className="h-4 w-4" />
                          Make offer
                        </button>
                      </div>
                    </div>
                    {/* Create a Remix */}
                    {!isOwner && (
                      <div className="btn-border-animated p-[1px] rounded-2xl">
                        <button
                          className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-purple"
                          onClick={handleAutoRemix}
                        >
                          <GitBranch className="h-4 w-4" />
                          Create a Remix
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <SignInButton mode="modal">
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                    <Button className="w-full h-12 text-base bg-background/30 text-white rounded-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Sign in to trade
                    </Button>
                    </div>
                  </SignInButton>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border p-5 space-y-3">
                {isOwner ? (
                  <div className="space-y-2">
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
                        onClick={() => setListOpen(true)}
                      >
                        <Tag className="h-4 w-4" />
                        {isERC1155 ? "List edition for sale" : "List for sale"}
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange"
                        onClick={() => setTransferOpen(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Transfer
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-purple"
                        onClick={() => router.push(`/create/remix/${contract}/${tokenId}`)}
                      >
                        <GitBranch className="h-4 w-4" />
                        Create a Remix
                        <HelpIcon content="Build a licensed derivative of this IP asset — your remix is minted as a new onchain NFT linked to the original" side="top" />
                      </button>
                    </div>
                  </div>
                ) : isSignedIn ? (
                  <div className="space-y-2">
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange"
                        onClick={() => setOfferOpen(true)}
                      >
                        <HandCoins className="h-4 w-4" />
                        Make offer
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-purple"
                        onClick={handleAutoRemix}
                      >
                        <GitBranch className="h-4 w-4" />
                        Create a Remix
                        <HelpIcon content="Build a licensed derivative of this IP asset — your remix is minted as a new onchain NFT linked to the original" side="top" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <SignInButton mode="modal">
                    <Button variant="outline" className="w-full">
                      Sign in to make an offer
                    </Button>
                  </SignInButton>
                )}
              </div>
            )}

            {/* My active offer banner — visible to the bidder only */}
            {!isOwner && walletAddress && (() => {
              const myBid = activeBids.find(
                (b) => b.offerer.toLowerCase() === walletAddress.toLowerCase()
              );
              if (!myBid) return null;
              return (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <HandCoins className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-amber-500">Your active offer</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-foreground inline-flex items-center gap-1">
                          {formatDisplayPrice(myBid.price.formatted)}
                          <CurrencyIcon symbol={myBid.price.currency ?? ""} size={12} />
                        </span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        {timeUntil(myBid.endTime)}
                      </p>
                    </div>
                  </div>
                  <button
                    className="shrink-0 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                    onClick={() => handleCancelClick(myBid)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              );
            })()}

            {/* Incoming offers — visible to owner only */}
            {isOwner && activeBids.length > 0 && (
              <div className="rounded-xl border border-border p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Incoming offers ({activeBids.length})
                </p>
                <div className="space-y-2">
                  {activeBids.map((bid) => (
                    <div
                      key={bid.orderHash}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold">
                          <span className="inline-flex items-center gap-1.5">{formatDisplayPrice(bid.price.formatted)} <CurrencyIcon symbol={bid.price.currency ?? ""} size={14} /></span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <AddressDisplay
                            address={bid.offerer}
                            chars={4}
                            showCopy={false}
                            className="text-xs text-muted-foreground"
                          />
                          <span className="text-xs text-muted-foreground">·</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {timeUntil(bid.endTime)}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleAcceptClick(bid)}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 text-sm">
              <a
                href={`${EXPLORER_URL}/contract/${token.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                Contract <ExternalLink className="h-3 w-3" />
              </a>
              {collection && (
                <Link
                  href={`/collections/${token.contractAddress}`}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-1.5 hover:bg-muted/40 transition-colors group min-w-0"
                >
                  <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-primary/20 to-purple-500/20 ring-1 ring-border">
                    {collection.image && (
                      <Image src={ipfsToHttp(collection.image)} alt="" fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <span className="text-xs font-medium truncate group-hover:text-primary transition-colors max-w-[120px]">{collection.name}</span>
                </Link>
              )}
              <ShareButton title={name ?? `Token #${token?.tokenId}`} variant="ghost" size="icon" />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setReportOpen(true)}
                title="Report this asset"
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>

            <ReportDialog
              target={{
                type: "TOKEN",
                contract: token.contractAddress,
                tokenId: token.tokenId,
                name: name ?? undefined,
              }}
              open={reportOpen}
              onOpenChange={setReportOpen}
            />
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="markets" className="flex items-center gap-1">
              Markets {(activeListings.length + activeBids.length) > 0 && `(${activeListings.length + activeBids.length})`}
              <HelpIcon content="Active listings for sale and open offers on this asset" side="bottom" />
            </TabsTrigger>
            <TabsTrigger value="provenance" className="flex items-center gap-1">
              Provenance {history.length > 0 && `(${history.length})`}
              <HelpIcon content="Full transfer and sale history recorded onchain — immutable proof of ownership" side="bottom" />
            </TabsTrigger>
          </TabsList>

          {/* Overview tab — media embeds + license + attributes */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Media embeds (YouTube, Spotify, etc.) — shown first when present */}
            {hasTemplateData && (
              <IPTypeDisplay
                attributes={token.metadata?.attributes as { trait_type?: string; value?: string }[] | null}
              />
            )}

            {/* License section (inline from attributes) */}
            {(() => {
              const attr = (trait: string) =>
                attributes.find((a) => a.trait_type === trait)?.value;
              const licenseType = attr("License");
              const commercialUse = attr("Commercial Use");
              const derivatives = attr("Derivatives");
              const attribution = attr("Attribution");
              const territory = attr("Territory");
              const aiPolicy = attr("AI Policy");
              const royalty = attr("Royalty");
              const standard = attr("Standard");
              const registration = attr("Registration");
              const hasLicenseData = licenseType || commercialUse || derivatives || attribution;
              if (!hasLicenseData) return null;
              const rows: { icon: React.ReactNode; label: string; value: string | undefined }[] = [
                { icon: <Shield className="h-4 w-4" />, label: "License", value: licenseType },
                { icon: <DollarSign className="h-4 w-4" />, label: "Commercial Use", value: commercialUse },
                { icon: <GitBranch className="h-4 w-4" />, label: "Derivatives", value: derivatives },
                { icon: <UserCheck className="h-4 w-4" />, label: "Attribution", value: attribution },
                { icon: <Globe className="h-4 w-4" />, label: "Territory", value: territory },
                { icon: <Bot className="h-4 w-4" />, label: "AI & Data Mining", value: aiPolicy },
                { icon: <Percent className="h-4 w-4" />, label: "Royalty", value: royalty },
                { icon: <Calendar className="h-4 w-4" />, label: "Registration", value: registration },
              ].filter((r) => !!r.value);
              return (
                <div className="space-y-3">
                  {standard && (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                      <Shield className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary">{standard} Compliant</p>
                        <p className="text-xs text-muted-foreground">Licensing terms are immutably embedded in IPFS metadata and compliant with international copyright law.</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {rows.map(({ icon, label, value }) => (
                      <div key={label} className="rounded-lg border border-border bg-muted/20 p-3 text-center overflow-hidden">
                        <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
                        <p className="text-sm font-semibold mt-0.5 truncate" title={value}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Attributes grid */}
            {attributes.filter((a) => isDisplayAttr(a)).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attributes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {attributes
                    .filter((a) => isDisplayAttr(a))
                    .map((attr, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 text-center overflow-hidden">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate" title={attr.trait_type ?? "Trait"}>
                          {attr.trait_type ?? "Trait"}
                        </p>
                        <p className="text-sm font-semibold mt-0.5 truncate" title={attr.value ?? "—"}>
                          {attr.value ?? "—"}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {!hasTemplateData && attributes.filter((a) => isDisplayAttr(a)).length === 0 && (
              <p className="text-sm text-muted-foreground">No additional details available.</p>
            )}
          </TabsContent>


          {/* Markets tab — listings + offers */}
          <TabsContent value="markets" className="mt-4 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Listings</p>
              {activeListings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active listings.</p>
              ) : (
                <div className="rounded-xl border border-border divide-y divide-border">
                  {activeListings.map((order) => {
                    const isMyOrder = walletAddress && order.offerer.toLowerCase() === walletAddress.toLowerCase();
                    return (
                      <div key={order.orderHash} className="flex items-center justify-between px-4 py-3 gap-4">
                        <div className="min-w-0">
                          <p className="font-bold text-sm inline-flex items-center gap-1.5">{formatDisplayPrice(order.price.formatted)} <CurrencyIcon symbol={order.price.currency ?? ""} size={14} /></p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            {timeUntil(order.endTime)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <AddressDisplay address={order.offerer} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                          {isMyOrder ? (
                            <Button size="sm" variant="destructive" disabled={isProcessing} onClick={() => handleCancelClick(order)}>
                              Cancel
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => setPurchaseOrder(order)}>Buy</Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Offers</p>
              {activeBids.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No active offers.</p>
              ) : (
                <div className="rounded-xl border border-border divide-y divide-border">
                  {activeBids.map((bid) => (
                    <div key={bid.orderHash} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-sm"><span className="inline-flex items-center gap-1.5">{formatDisplayPrice(bid.price.formatted)} <CurrencyIcon symbol={bid.price.currency ?? ""} size={14} /></span></p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          {timeUntil(bid.endTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <AddressDisplay address={bid.offerer} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                        {isOwner && (
                          <Button size="sm" disabled={isProcessing} onClick={() => handleAcceptClick(bid)}>
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                            Accept
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Provenance tab — history + remixes */}
          <TabsContent value="provenance" className="mt-4">
            {(() => {
              const historyTyped = history as ApiActivity[];

              // ── Computed stats ──────────────────────────────────────────────
              const sales = historyTyped.filter((e) => e.type === "sale");
              const totalVolumeParts = sales.reduce<Record<string, { amount: number; currency: string }>>((acc, e) => {
                if (!e.price?.formatted || !e.price.currency) return acc;
                const key = e.price.currency;
                const parsed = parseFloat(e.price.formatted.replace(/,/g, ""));
                if (!isNaN(parsed)) {
                  acc[key] = { amount: (acc[key]?.amount ?? 0) + parsed, currency: key };
                }
                return acc;
              }, {});
              const volumeSummary = Object.values(totalVolumeParts);

              const allActors = new Set(
                historyTyped.flatMap((e) => [e.offerer, e.fulfiller, (e as any).from].filter(Boolean))
              );
              const firstEvent = historyTyped[historyTyped.length - 1];

              // ── Event type config ───────────────────────────────────────────
              const EVENT_STYLE: Record<string, { label: string; icon: React.ReactNode; badgeCls: string }> = {
                sale:      { label: "Sale",      icon: <ShoppingCart className="h-3.5 w-3.5" />, badgeCls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" },
                mint:      { label: "Minted",    icon: <CheckCircle className="h-3.5 w-3.5" />,  badgeCls: "bg-teal-500/15 text-teal-500 border-teal-500/20"          },
                listing:   { label: "Listed",    icon: <Tag className="h-3.5 w-3.5" />,          badgeCls: "bg-blue-500/15 text-blue-500 border-blue-500/20"         },
                offer:     { label: "Offer",     icon: <HandCoins className="h-3.5 w-3.5" />,    badgeCls: "bg-amber-500/15 text-amber-500 border-amber-500/20"       },
                transfer:  { label: "Transfer",  icon: <ArrowRightLeft className="h-3.5 w-3.5" />, badgeCls: "bg-purple-500/15 text-purple-500 border-purple-500/20"  },
                cancelled: { label: "Cancelled", icon: <X className="h-3.5 w-3.5" />,            badgeCls: "bg-red-500/15 text-red-400 border-red-500/20"             },
              };

              return (
                <div className="space-y-6">

                  {/* ── Onchain attestation badge ─────────────────────────── */}
                  <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2.5">
                    <Fingerprint className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary">Onchain Provenance</p>
                      <p className="text-xs text-muted-foreground">Every transfer and sale is immutably recorded on Starknet — this history cannot be altered.</p>
                    </div>
                    <a
                      href={`${EXPLORER_URL}/contract/${contract}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
                    >
                      Contract <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* ── Stats grid ────────────────────────────────────────── */}
                  {historyTyped.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <Activity className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-lg font-bold">{historyTyped.length}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Events</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-lg font-bold">{sales.length}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sales</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <TrendingUp className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        {volumeSummary.length > 0 ? (
                          <div className="space-y-0.5">
                            {volumeSummary.map((v) => (
                              <p key={v.currency} className="text-sm font-bold leading-tight">
                                {v.amount.toFixed(v.amount < 1 ? 4 : 2)} {v.currency}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-lg font-bold">—</p>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Volume</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-3 text-center">
                        <UserCheck className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-lg font-bold">{allActors.size}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Participants</p>
                      </div>
                    </div>
                  )}

                  {/* ── Remixes section ───────────────────────────────────── */}
                  {remixCount > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remixes ({remixCount})</p>
                      <RemixesTab contractAddress={contract} tokenId={tokenId} />
                    </div>
                  )}

                  {/* ── Price history chart ───────────────────────────────── */}
                  <PriceHistoryChart history={historyTyped} />

                  {/* ── Event timeline ────────────────────────────────────── */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      History
                      {firstEvent && (
                        <span className="ml-2 font-normal normal-case">
                          · first activity {timeAgo(firstEvent.timestamp)}
                        </span>
                      )}
                    </p>

                    {historyTyped.length === 0 ? (
                      <div className="rounded-xl border border-border bg-muted/10 py-12 flex flex-col items-center gap-3 text-center">
                        <Activity className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                      </div>
                    ) : (
                      <div className="relative">
                        {/* Timeline spine */}
                        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-border/60" />

                        <div className="space-y-1">
                          {historyTyped.map((event, i) => {
                            const style = EVENT_STYLE[event.type] ?? { label: event.type, icon: <Activity className="h-3.5 w-3.5" />, badgeCls: "bg-muted/60 text-muted-foreground border-border" };
                            const actor = event.offerer ?? (event as any).from ?? "";
                            // For transfers/mints use `to`; for sales use `fulfiller`
                            const toAddr = (event as any).to as string | undefined;
                            const counterpart = event.fulfiller && event.fulfiller !== actor
                              ? event.fulfiller
                              : (event.type === "transfer" || event.type === "mint") && toAddr
                              ? toAddr
                              : null;
                            const amount = (event as any).amount as string | undefined;
                            const txLink = event.txHash ? `${EXPLORER_URL}/tx/${event.txHash}` : null;
                            const voyagerActor = actor ? `${EXPLORER_URL}/contract/${actor}` : null;

                            return (
                              <div key={i} className="relative flex gap-4 group">
                                {/* Timeline dot */}
                                <div className={`relative z-10 h-10 w-10 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-colors group-hover:border-primary/50 ${style.badgeCls}`}>
                                  {style.icon}
                                </div>

                                {/* Row content */}
                                <div className={`flex-1 min-w-0 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 transition-colors group-hover:border-border group-hover:bg-card/60 ${txLink ? "cursor-pointer" : ""}`}
                                  onClick={() => txLink && window.open(txLink, "_blank", "noopener,noreferrer")}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      {/* Type + addresses */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${style.badgeCls}`}>
                                          {style.icon}
                                          {style.label}
                                        </span>
                                        {actor && (
                                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            {voyagerActor ? (
                                              <a
                                                href={voyagerActor}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="hover:text-foreground transition-colors font-mono"
                                              >
                                                {actor.slice(0, 6)}…{actor.slice(-4)}
                                              </a>
                                            ) : (
                                              <span className="font-mono">{actor.slice(0, 6)}…{actor.slice(-4)}</span>
                                            )}
                                          </span>
                                        )}
                                        {counterpart && (
                                          <>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                            <a
                                              href={`${EXPLORER_URL}/contract/${counterpart}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                                            >
                                              {counterpart.slice(0, 6)}…{counterpart.slice(-4)}
                                            </a>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Price + amount + time + tx link */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      {amount && BigInt(amount) > 1n && (
                                        <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                                          ×{amount}
                                        </span>
                                      )}
                                      {event.price?.formatted && (
                                        <span className="text-sm font-bold inline-flex items-center gap-1">
                                          {formatDisplayPrice(event.price.formatted)}
                                          <CurrencyIcon symbol={event.price.currency ?? ""} size={13} />
                                        </span>
                                      )}
                                      <span
                                        className="text-[11px] text-muted-foreground/60 whitespace-nowrap"
                                        title={new Date(event.timestamp).toLocaleString()}
                                      >
                                        {timeAgo(event.timestamp)}
                                      </span>
                                      {txLink && (
                                        <a
                                          href={txLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                          title="View transaction"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}
          </TabsContent>

        </Tabs>
      </div>


      <FloatingCommentsButton onClick={() => setCommentOpen(true)} commentTotal={commentTotal} />

      {/* Comments Dialog — centered panel with blurred backdrop */}
      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="w-full max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">
          {/* Header */}
          <div
            className="flex items-center gap-3 pr-10 pl-4 pt-4 pb-3 shrink-0 border-b border-brand-blue/20"
            style={{ background: "linear-gradient(135deg, hsl(var(--brand-blue) / 0.10), hsl(var(--brand-purple) / 0.08))" }}
          >
            {/* Asset avatar */}
            <div
              className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 ring-2 ring-white/20"
              style={{ background: "linear-gradient(135deg, hsl(var(--brand-blue) / 0.3), hsl(var(--brand-purple) / 0.3))" }}
            >
              {imageUrl && (
                <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle asChild>
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "hsl(var(--brand-blue))" }}>Comments</p>
              </DialogTitle>
              <p className="text-sm font-semibold truncate text-foreground">{name}</p>
            </div>
            {commentTotal > 0 && (
              <span
                className="shrink-0 text-xs font-bold rounded-full px-2 py-0.5 text-white"
                style={{ background: "hsl(var(--brand-blue))" }}
              >
                {commentTotal}
              </span>
            )}
          </div>
          {/* Body */}
          <div className="flex-1 overflow-hidden">
            <CommentsSection contract={contract} tokenId={tokenId} className="h-full rounded-none border-0" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      {purchaseOrder && (
        <PurchaseDialog
          order={purchaseOrder}
          open
          onOpenChange={(v) => { if (!v) setPurchaseOrder(null); }}
          onSuccess={mutateListings}
        />
      )}

      <ListingDialog
        open={listOpen}
        onOpenChange={setListOpen}
        assetContract={contract}
        tokenId={tokenId}
        tokenName={name}
        tokenStandard={collection?.standard}
        tokenImage={imageUrl}
        onSuccess={mutateListings}
      />

      <OfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        assetContract={contract}
        tokenId={tokenId}
        tokenName={name}
        tokenImage={imageUrl ?? undefined}
      />

      <PinDialog
        open={cancelPinOpen}
        onSubmit={handleCancelPin}
        onCancel={() => { setCancelPinOpen(false); setOrderToCancel(null); }}
        title="Cancel listing"
        description={`Enter your PIN to cancel the listing for ${name}.`}
      />

      <PinDialog
        open={acceptPinOpen}
        onSubmit={handleAcceptPin}
        onCancel={() => { setAcceptPinOpen(false); setOrderToAccept(null); }}
        title="Accept offer"
        description={orderToAccept
          ? `Accept ${formatDisplayPrice(orderToAccept.price.formatted)} ${orderToAccept.price.currency} for ${name}?`
          : "Enter your PIN to accept this offer."}
      />

      {/* Cancel listing status dialog */}
      <Dialog
        open={cancelStep !== "idle"}
        onOpenChange={(v) => { if (!v) { setCancelStep("idle"); setCancelError(null); } }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {cancelStep === "processing" && "Cancelling listing…"}
              {cancelStep === "success" && "Listing cancelled"}
              {cancelStep === "error" && "Cancellation failed"}
            </DialogTitle>
            {cancelStep === "processing" && (
              <DialogDescription>
                Submitting your cancellation to the network. Please wait.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {cancelStep === "processing" && (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            )}
            {cancelStep === "success" && (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm text-center text-muted-foreground">
                  Your listing has been cancelled successfully.
                </p>
                <Button className="w-full" onClick={() => { setCancelStep("idle"); setCancelError(null); }}>
                  Done
                </Button>
              </>
            )}
            {cancelStep === "error" && (
              <>
                <X className="h-10 w-10 text-destructive" />
                <p className="text-sm text-center text-muted-foreground">
                  {cancelError ?? "Something went wrong. Please try again."}
                </p>
                <Button variant="outline" className="w-full" onClick={() => { setCancelStep("idle"); setCancelError(null); }}>
                  Dismiss
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        contractAddress={contract}
        tokenId={tokenId}
        tokenName={name}
        hasActiveListing={activeListings.length > 0}
        tokenStandard={collection?.standard}
        onSuccess={mutateListings}
      />
    </div>
  );
}
