"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useToken, useTokenHistory } from "@/hooks/use-tokens";
import { useTokenListings } from "@/hooks/use-orders";
import { useCollection } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { AddressDisplay } from "@/components/shared/address-display";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { ipfsToHttp, timeUntil, timeAgo, formatDisplayPrice } from "@/lib/utils";
import { ShoppingCart, Tag, ExternalLink, Clock, HandCoins, ArrowRightLeft, X, CheckCircle, DollarSign, GitBranch, UserCheck, Globe, Bot, Percent, Shield, Calendar, ChevronRight, Flag, Loader2 } from "lucide-react";
import { ReportDialog } from "@/components/report-dialog";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import { LICENSE_TRAIT_TYPES } from "@/types/ip";
import type { IPType } from "@/types/ip";
import { IP_TEMPLATES } from "@/lib/ip-templates";
import { IPTypeDisplay } from "@/components/ip-type-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { EXPLORER_URL } from "@/lib/constants";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useDominantColor } from "@/hooks/use-dominant-color";

const TYPE_LABEL: Record<string, string> = {
  transfer: "Transfer",
  listing: "Listed",
  sale: "Sale",
  offer: "Offer",
  cancelled: "Cancelled",
};

export default function AssetPageClient() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const { isSignedIn } = useAuth();
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

  // Listings = ERC721 in offer (someone selling the NFT)
  const activeListings = listings.filter(
    (l) => l.status === "ACTIVE" && l.offer.itemType === "ERC721"
  );
  // Bids = ERC20 in offer (someone bidding to buy the NFT)
  const activeBids = listings.filter(
    (l) => l.status === "ACTIVE" && l.offer.itemType === "ERC20"
  );

  const cheapest = [...activeListings].sort((a, b) =>
    BigInt(a.consideration.startAmount) < BigInt(b.consideration.startAmount) ? -1 : 1
  )[0];

  const isOwner = !!(
    token && walletAddress &&
    token.owner.toLowerCase() === walletAddress.toLowerCase()
  );

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
              {token.metadata?.ipType && (
                <Badge variant="secondary" className="mb-2">{token.metadata.ipType}</Badge>
              )}
              <h1 className="text-3xl font-bold">{name}</h1>
              {description && (
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            )}
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>Owned by</span>
                <Link href={`/creator/${token.owner}`} className="hover:text-primary transition-colors">
                  <AddressDisplay address={token.owner} />
                </Link>
              </div>
            </div>

            {/* Price / action box */}
            {cheapest ? (
              <div className="rounded-xl border border-border p-5 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    {isOwner ? "Your listing" : "Current price"}
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {formatDisplayPrice(cheapest.price.formatted)} {cheapest.price.currency}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    Expires {timeUntil(cheapest.endTime)}
                  </div>
                </div>

                {isOwner ? (
                  <div className="space-y-2">
                    {myListing && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isProcessing}
                      onClick={() => handleCancelClick(myListing)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel listing
                    </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setListOpen(true)}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Create new listing
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setTransferOpen(true)}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Transfer
                    </Button>
                  </div>
                ) : isSignedIn ? (
                  <div className="space-y-2">
                    <motion.div
                      animate={shouldReduce ? {} : {
                        boxShadow: [
                          "0 0 0 0 hsl(var(--dynamic-primary) / 0.4)",
                          "0 0 0 12px hsl(var(--dynamic-primary) / 0)",
                        ],
                      }}
                      transition={{ duration: 1.2, ease: "easeOut", repeat: 0 }}
                      style={{ borderRadius: "inherit" }}
                    >
                      <Button
                        className="w-full h-12 text-base"
                        style={dynamicTheme ? { background: `hsl(var(--dynamic-primary))`, color: "white" } : {}}
                        onClick={() => setPurchaseOrder(cheapest)}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Buy now
                      </Button>
                    </motion.div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        style={dynamicTheme ? { borderColor: `hsl(var(--dynamic-primary))`, color: `hsl(var(--dynamic-primary))` } : {}}
                        disabled={inCart}
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {inCart ? "In cart" : "Add to cart"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        style={dynamicTheme ? { borderColor: `hsl(var(--dynamic-primary))`, color: `hsl(var(--dynamic-primary))` } : {}}
                        onClick={() => setOfferOpen(true)}
                      >
                        <HandCoins className="h-4 w-4 mr-2" />
                        Make offer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <SignInButton mode="modal">
                    <Button className="w-full h-12 text-base">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Sign in to trade
                    </Button>
                  </SignInButton>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border p-5 space-y-3">
                <p className="text-muted-foreground text-sm">Not listed for sale.</p>
                {isOwner ? (
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => setListOpen(true)}>
                      <Tag className="h-4 w-4 mr-2" />
                      List for sale
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setTransferOpen(true)}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Transfer
                    </Button>
                  </div>
                ) : isSignedIn ? (
                  <Button variant="outline" className="w-full" onClick={() => setOfferOpen(true)}>
                    <HandCoins className="h-4 w-4 mr-2" />
                    Make offer
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button variant="outline" className="w-full">
                      Sign in to make an offer
                    </Button>
                  </SignInButton>
                )}
              </div>
            )}

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
                          {formatDisplayPrice(bid.price.formatted)} {bid.price.currency}
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
              <Link
                href={`/collections/${token.contractAddress}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                Collection
              </Link>
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
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="markets">
              Markets {(activeListings.length + activeBids.length) > 0 && `(${activeListings.length + activeBids.length})`}
            </TabsTrigger>
            <TabsTrigger value="provenance">
              Provenance {history.length > 0 && `(${history.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Overview tab — media embeds + attributes */}
          <TabsContent value="overview" className="mt-4 space-y-6">
            {/* Media embeds (YouTube, Spotify, etc.) — shown first when present */}
            {hasTemplateData && (
              <IPTypeDisplay
                attributes={token.metadata?.attributes as { trait_type?: string; value?: string }[] | null}
              />
            )}
            <div className="space-y-4">
            
            {token.metadata?.licenseType && (
              <div className="rounded-lg bg-muted/30 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">License</p>
                <p className="text-sm font-medium">{token.metadata.licenseType}</p>
              </div>
            )}
            {token.metadata?.commercialUse !== undefined && token.metadata?.commercialUse !== null && (
              <div className="rounded-lg bg-muted/30 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commercial use</p>
                <p className="text-sm font-medium">{String(token.metadata.commercialUse)}</p>
              </div>
            )}
            {token.metadata?.author && (
              <div className="rounded-lg bg-muted/30 p-4 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Author</p>
                <p className="text-sm font-medium">{token.metadata.author as string}</p>
              </div>
            )}
            {attributes.filter(
              (a) => isDisplayAttr(a)
            ).length > 0 && (
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
            {!description && !token.metadata?.licenseType && attributes.length === 0 && (
              <p className="text-sm text-muted-foreground">No additional details available.</p>
            )}
            </div>
          </TabsContent>

          {/* License tab */}
          <TabsContent value="license" className="mt-4">
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

              if (!hasLicenseData) {
                return (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No licensing information attached to this asset.
                  </p>
                );
              }

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
                <div className="space-y-4">
                  {standard && (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                      <Shield className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary">
                          {standard} Compliant
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Licensing terms are immutably embedded in IPFS metadata and compliant with international copyright law.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-border divide-y divide-border">
                    {rows.map(({ icon, label, value }) => (
                      <div key={label} className="flex items-center justify-between px-4 py-3 gap-4">
                        <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
                          {icon}
                          <span className="text-sm">{label}</span>
                        </div>
                        <span className="text-sm font-medium text-right">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Non-license attributes */}
                  {attributes.filter(
                    (a) => isDisplayAttr(a)
                  ).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Additional Attributes
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {attributes
                          .filter(
                            (a) => isDisplayAttr(a)
                          )
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
                </div>
              );
            })()}
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
                          <p className="font-bold text-sm">{formatDisplayPrice(order.price.formatted)} {order.price.currency}</p>
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
                        <p className="font-bold text-sm">{formatDisplayPrice(bid.price.formatted)} {bid.price.currency}</p>
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

          {/* Provenance tab */}
          <TabsContent value="provenance" className="mt-4">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No activity recorded yet.</p>
            ) : (
              <div className="rounded-xl border border-border divide-y divide-border">
                {(history as ApiActivity[]).map((event, i) => {
                  const actor = event.offerer ?? event.fulfiller ?? event.from ?? "";
                  const txLink = event.txHash ? `${EXPLORER_URL}/tx/${event.txHash}` : null;
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{TYPE_LABEL[event.type] ?? event.type}</p>
                          {actor && (
                            <AddressDisplay address={actor} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {event.price?.formatted && (
                          <span className="text-sm font-bold">
                            {formatDisplayPrice(event.price.formatted)} {event.price.currency}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground" title={new Date(event.timestamp).toLocaleString()}>
                          {timeAgo(event.timestamp)}
                        </span>
                        {txLink && (
                          <a href={txLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile floating buy pill */}
      {cheapest && !isOwner && walletAddress && (
        <div className="fixed bottom-6 left-4 z-40 md:hidden">
          <Button
            className="h-12 px-5 rounded-full text-sm font-semibold shadow-lg shadow-black/20"
            style={dynamicTheme ? { background: `hsl(var(--dynamic-primary))`, color: "white" } : {}}
            onClick={() => setPurchaseOrder(cheapest)}
          >
            <ShoppingCart className="h-4 w-4 mr-2 shrink-0" />
            {formatDisplayPrice(cheapest.price.formatted)} {cheapest.price.currency}
          </Button>
        </div>
      )}

      {/* Dialogs */}
      {purchaseOrder && (
        <PurchaseDialog
          order={purchaseOrder}
          open
          onOpenChange={(v) => { if (!v) setPurchaseOrder(null); }}
        />
      )}

      <ListingDialog
        open={listOpen}
        onOpenChange={setListOpen}
        assetContract={contract}
        tokenId={tokenId}
        tokenName={name}
        onSuccess={mutateListings}
      />

      <OfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        assetContract={contract}
        tokenId={tokenId}
        tokenName={name}
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
        onSuccess={mutateListings}
      />
    </div>
  );
}
