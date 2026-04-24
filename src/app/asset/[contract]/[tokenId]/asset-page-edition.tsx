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
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { AddressDisplay } from "@/components/shared/address-display";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { ipfsToHttp, timeUntil, formatDisplayPrice, checkIsOwner } from "@/lib/utils";
import {
  ShoppingCart,
  Tag,
  ExternalLink,
  Clock,
  HandCoins,
  ArrowRightLeft,
  X,
  CheckCircle,
  DollarSign,
  GitBranch,
  UserCheck,
  Globe,
  Bot,
  Percent,
  Shield,
  Calendar,
  ChevronRight,
  Flag,
  Loader2,
  Layers,
  Users,
} from "lucide-react";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/shared/share-button";
import { LICENSE_TRAIT_TYPES } from "@/types/ip";
import type { IPType } from "@/types/ip";
import { IP_TEMPLATES } from "@/lib/ip-templates";
import { IPTypeDisplay } from "@/components/ip-type-display";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { CommentsSection } from "@/components/asset/comments-section";
import { useComments } from "@/hooks/use-comments";
import { EXPLORER_URL } from "@/lib/constants";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { useTokenRemixes } from "@/hooks/use-remix-offers";
import { HelpIcon } from "@/components/ui/help-icon";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetProvenanceTab } from "./asset-provenance-tab";

export function AssetPageEdition() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const { isSignedIn } = useAuth();
  const { walletAddress } = useSessionKey();
  const { collection } = useCollection(contract);
  const { token } = useToken(contract, tokenId);
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

  const { comments: _comments, total: commentTotal } = useComments(contract, tokenId);
  const { total: remixCount } = useTokenRemixes(contract, tokenId);

  const activeListings = listings.filter(
    (l) => l.status === "ACTIVE" && (l.offer.itemType === "ERC721" || l.offer.itemType === "ERC1155")
  );
  const activeBids = listings.filter(
    (l) => l.status === "ACTIVE" && l.offer.itemType === "ERC20"
  );

  const cheapest = [...activeListings].sort((a, b) =>
    BigInt(a.consideration.startAmount) < BigInt(b.consideration.startAmount) ? -1 : 1
  )[0];

  const isOwner = checkIsOwner(token, walletAddress);

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
        itemType: "ERC1155",
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
      await cancelOrder({ orderHash: orderToCancel.orderHash, pin, tokenStandard: "ERC1155" });
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
    await fulfillOrder({ orderHash: orderToAccept.orderHash, pin, tokenStandard: "ERC1155" });
    setOrderToAccept(null);
    mutateListings();
  };

  if (!token) return null;

  const name = token.metadata?.name || `Edition #${token.tokenId}`;
  const image = ipfsToHttp(token.metadata?.image);
  const description = token.metadata?.description;
  const attributes = Array.isArray(token.metadata?.attributes)
    ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
    : [];

  const totalEditions = collection?.totalSupply ?? 0;
  const holders = token.balances ?? [];
  const uniqueOwners = holders.length;

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

  const isDisplayAttr = (a: { trait_type?: string }): boolean =>
    !LICENSE_TRAIT_TYPES.has(a.trait_type ?? "") && !activeTemplateKeys.has(a.trait_type ?? "");

  return (
    <div
      style={dynamicTheme ? (dynamicTheme as React.CSSProperties) : {}}
      className="relative z-0 min-h-screen"
    >
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
      </div>

      <div className="container mx-auto px-4 pt-14 space-y-8 pb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:gap-10 gap-8 items-start">
          {/* Image */}
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
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                  <Layers className="h-24 w-24 text-violet-500/40" />
                </div>
              )}
            </div>

            {/* Edition stats below image */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <p className="text-2xl font-black">{totalEditions.toLocaleString()}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <Layers className="h-3 w-3" />
                  editions minted
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-center">
                <p className="text-2xl font-black">{uniqueOwners.toLocaleString()}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="h-3 w-3" />
                  unique owners
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {token.metadata?.ipType && (
                  <IpTypeBadge ipType={token.metadata.ipType} size="md" />
                )}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-500">
                  <Layers className="h-3 w-3" />
                  Multi-Edition
                </span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold">{name}</h1>
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{description}</p>
              )}
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
                        List edition for sale
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange"
                        onClick={() => setTransferOpen(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Transfer edition
                      </button>
                    </div>
                  </div>
                ) : isSignedIn ? (
                  <div className="space-y-2">
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-12 text-base font-semibold text-white rounded-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
                        onClick={() => setPurchaseOrder(cheapest)}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Buy Edition
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
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
                        List edition for sale
                      </button>
                    </div>
                    <div className="btn-border-animated p-[1px] rounded-2xl">
                      <button
                        className="w-full h-10 rounded-[15px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-brand-orange"
                        onClick={() => setTransferOpen(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        Transfer edition
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

            {/* My active offer banner */}
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

            {/* Incoming offers — visible to owner */}
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
                          <span className="inline-flex items-center gap-1.5">
                            {formatDisplayPrice(bid.price.formatted)}
                            <CurrencyIcon symbol={bid.price.currency ?? ""} size={14} />
                          </span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <AddressDisplay address={bid.offerer} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">·</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {timeUntil(bid.endTime)}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" disabled={isProcessing} onClick={() => handleAcceptClick(bid)}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Holders panel */}
            {holders.length > 0 && (
              <div className="rounded-xl border border-border px-4 py-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {holders.length === 1 ? "1 owner" : `${holders.length} owners`}
                </p>
                <div className="flex flex-col gap-1.5">
                  {holders.slice(0, 8).map((b) => (
                    <div key={b.owner} className="flex items-center justify-between gap-2">
                      <Link href={`/creator/${b.owner}`} className="hover:text-primary transition-colors font-medium text-sm truncate">
                        <AddressDisplay address={b.owner} chars={6} showCopy={false} />
                      </Link>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">× {b.amount}</span>
                    </div>
                  ))}
                  {holders.length > 8 && (
                    <p className="text-xs text-muted-foreground/60">+{holders.length - 8} more holders</p>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            <div className="flex items-center gap-3 text-sm">
              <a
                href={`${EXPLORER_URL}/contract/${contract}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                Contract <ExternalLink className="h-3 w-3" />
              </a>
              {collection && (
                <Link
                  href={`/collections/${contract}`}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-1.5 hover:bg-muted/40 transition-colors group min-w-0"
                >
                  <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-violet-500/20 to-purple-600/20 ring-1 ring-border">
                    {collection.image && (
                      <Image src={ipfsToHttp(collection.image)} alt="" fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <span className="text-xs font-medium truncate group-hover:text-primary transition-colors max-w-[120px]">{collection.name}</span>
                </Link>
              )}
              <ShareButton title={name} variant="ghost" size="icon" />
              <button
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setReportOpen(true)}
                title="Report this asset"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>

            <ReportDialog
              target={{ type: "TOKEN", contract, tokenId, name: name ?? undefined }}
              open={reportOpen}
              onOpenChange={setReportOpen}
            />
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="markets">
              Markets {(activeListings.length + activeBids.length) > 0 && `(${activeListings.length + activeBids.length})`}
            </TabsTrigger>
            <TabsTrigger value="provenance">
              Provenance {history.length > 0 && `(${history.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-6">
            {hasTemplateData && (
              <IPTypeDisplay
                attributes={token.metadata?.attributes as { trait_type?: string; value?: string }[] | null}
              />
            )}

            {/* License */}
            {(() => {
              const attr = (trait: string) => attributes.find((a) => a.trait_type === trait)?.value;
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

            {/* Attributes */}
            {attributes.filter((a) => isDisplayAttr(a)).length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attributes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {attributes.filter((a) => isDisplayAttr(a)).map((attr, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 text-center overflow-hidden">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate" title={attr.trait_type ?? "Trait"}>
                        {attr.trait_type ?? "Trait"}
                      </p>
                      <p className="text-sm font-semibold mt-0.5 truncate" title={attr.value ?? "—"}>{attr.value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!hasTemplateData && attributes.filter((a) => isDisplayAttr(a)).length === 0 && (
              <p className="text-sm text-muted-foreground">No additional details available.</p>
            )}
          </TabsContent>

          <TabsContent value="markets">
            <AssetMarketsTab
              activeListings={activeListings}
              activeBids={activeBids}
              walletAddress={walletAddress ?? undefined}
              isOwner={isOwner}
              isProcessing={isProcessing}
              onBuyClick={setPurchaseOrder}
              onCancelClick={handleCancelClick}
              onAcceptClick={handleAcceptClick}
            />
          </TabsContent>

          <TabsContent value="provenance">
            <AssetProvenanceTab
              history={history as ApiActivity[]}
              contract={contract}
              tokenId={tokenId}
              remixCount={remixCount}
            />
          </TabsContent>
        </Tabs>
      </div>

      <FloatingCommentsButton onClick={() => setCommentOpen(true)} commentTotal={commentTotal} />

      <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
        <DialogContent className="w-full max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[85svh]">
          <div
            className="flex items-center gap-3 pr-10 pl-4 pt-4 pb-3 shrink-0 border-b border-violet-500/20"
            style={{ background: "linear-gradient(135deg, hsl(var(--brand-purple) / 0.10), hsl(var(--brand-blue) / 0.08))" }}
          >
            <div
              className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 ring-2 ring-white/20"
              style={{ background: "linear-gradient(135deg, hsl(266 80% 60% / 0.3), hsl(var(--brand-blue) / 0.3))" }}
            >
              {imageUrl && (
                <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle asChild>
                <p className="text-[10px] font-medium uppercase tracking-wider text-violet-400">Comments</p>
              </DialogTitle>
              <p className="text-sm font-semibold truncate text-foreground">{name}</p>
            </div>
            {commentTotal > 0 && (
              <span className="shrink-0 text-xs font-bold rounded-full px-2 py-0.5 text-white bg-violet-500">
                {commentTotal}
              </span>
            )}
          </div>
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
        tokenStandard="ERC1155"
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
            {cancelStep === "processing" && <Loader2 className="h-10 w-10 animate-spin text-primary" />}
            {cancelStep === "success" && (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm text-center text-muted-foreground">Your listing has been cancelled successfully.</p>
                <Button className="w-full" onClick={() => { setCancelStep("idle"); setCancelError(null); }}>Done</Button>
              </>
            )}
            {cancelStep === "error" && (
              <>
                <X className="h-10 w-10 text-destructive" />
                <p className="text-sm text-center text-muted-foreground">{cancelError ?? "Something went wrong. Please try again."}</p>
                <Button variant="outline" className="w-full" onClick={() => { setCancelStep("idle"); setCancelError(null); }}>Dismiss</Button>
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
        tokenStandard="ERC1155"
        onSuccess={mutateListings}
      />
    </div>
  );
}
