"use client";

import { useState } from "react";
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
import { AddressDisplay } from "@/components/shared/address-display";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { ipfsToHttp, timeUntil, timeAgo } from "@/lib/utils";
import { ShoppingCart, Tag, ExternalLink, Clock, HandCoins, ArrowRightLeft, X, CheckCircle, DollarSign, GitBranch, UserCheck, Globe, Bot, Percent, Shield, Calendar, ChevronRight } from "lucide-react";
import { LICENSE_TRAIT_TYPES } from "@/types/ip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { EXPLORER_URL } from "@/lib/constants";
import { useSessionKey } from "@/hooks/use-session-key";
import { useMarketplace } from "@/hooks/use-marketplace";

const TYPE_LABEL: Record<string, string> = {
  transfer: "Transfer",
  listing: "Listed",
  sale: "Sale",
  offer: "Offer",
  cancelled: "Cancelled",
};

export default function AssetPageClient() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const { walletAddress } = useSessionKey();
  const { collection } = useCollection(contract);
  const { token, isLoading } = useToken(contract, tokenId);
  const { listings, mutate: mutateListings } = useTokenListings(contract, tokenId);
  const { history } = useTokenHistory(contract, tokenId);
  const { cancelOrder, fulfillOrder, isProcessing } = useMarketplace();

  const [imgError, setImgError] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState<ApiOrder | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<ApiOrder | null>(null);
  const [cancelPinOpen, setCancelPinOpen] = useState(false);
  const [orderToAccept, setOrderToAccept] = useState<ApiOrder | null>(null);
  const [acceptPinOpen, setAcceptPinOpen] = useState(false);

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

  const handleCancelClick = (order: ApiOrder) => {
    setOrderToCancel(order);
    setCancelPinOpen(true);
  };

  const handleCancelPin = async (pin: string) => {
    setCancelPinOpen(false);
    if (!orderToCancel) return;
    await cancelOrder({ orderHash: orderToCancel.orderHash, pin });
    setOrderToCancel(null);
    mutateListings();
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
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-square w-full rounded-2xl" />
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

  return (
    <>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/collections" className="hover:text-foreground transition-colors shrink-0">
            Collections
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 hidden sm:block" />
          <Link
            href={`/collections/${contract}`}
            className="hover:text-foreground transition-colors truncate max-w-[120px] hidden sm:block"
          >
            {collection?.name ?? contract.slice(0, 10) + "…"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">{name}</span>
        </nav>

        {/* Top: image + info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Image — sticky on desktop */}
          <div className="lg:sticky lg:top-16 relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted">
            {image && !imgError ? (
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                <span className="text-5xl font-mono text-muted-foreground">#{tokenId}</span>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div>
              {token.metadata?.ipType && (
                <Badge variant="secondary" className="mb-2">{token.metadata.ipType}</Badge>
              )}
              <h1 className="text-3xl font-bold">{name}</h1>
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
                    {cheapest.price.formatted} {cheapest.price.currency}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    Expires {timeUntil(cheapest.endTime)}
                  </div>
                </div>

                {isOwner ? (
                  <div className="space-y-2">
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isProcessing}
                      onClick={() => handleCancelClick(myListing ?? cheapest)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel listing
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setListOpen(true)}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      Create new listing
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full h-12 text-base"
                      onClick={() => setPurchaseOrder(cheapest)}
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Buy now
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setOfferOpen(true)}
                    >
                      <HandCoins className="h-4 w-4 mr-2" />
                      Make offer
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-border p-5 space-y-3">
                <p className="text-muted-foreground text-sm">Not listed for sale.</p>
                {isOwner ? (
                  <Button className="w-full" onClick={() => setListOpen(true)}>
                    <Tag className="h-4 w-4 mr-2" />
                    List for sale
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => setOfferOpen(true)}>
                    <HandCoins className="h-4 w-4 mr-2" />
                    Make offer
                  </Button>
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
                          {bid.price.formatted} {bid.price.currency}
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
            <div className="flex gap-3 text-sm">
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
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="license">License</TabsTrigger>
            <TabsTrigger value="listings">
              Listings {activeListings.length > 0 && `(${activeListings.length})`}
            </TabsTrigger>
            <TabsTrigger value="offers">
              Offers {activeBids.length > 0 && `(${activeBids.length})`}
            </TabsTrigger>
            <TabsTrigger value="history">
              History {history.length > 0 && `(${history.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details" className="mt-4 space-y-4">
            {description && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            )}
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
            {attributes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attributes</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {attributes.map((attr, i) => (
                    <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {attr.trait_type ?? "Trait"}
                      </p>
                      <p className="text-sm font-semibold mt-0.5">{attr.value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!description && !token.metadata?.licenseType && attributes.length === 0 && (
              <p className="text-sm text-muted-foreground">No additional details available.</p>
            )}
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
                  {attributes.filter((a) => !LICENSE_TRAIT_TYPES.has(a.trait_type ?? "")).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Additional Attributes
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {attributes
                          .filter((a) => !LICENSE_TRAIT_TYPES.has(a.trait_type ?? ""))
                          .map((attr, i) => (
                            <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 text-center">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                {attr.trait_type ?? "Trait"}
                              </p>
                              <p className="text-sm font-semibold mt-0.5">{attr.value ?? "—"}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* Listings tab */}
          <TabsContent value="listings" className="mt-4">
            {activeListings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No active listings for this token.</p>
            ) : (
              <div className="rounded-xl border border-border divide-y divide-border">
                {activeListings.map((order) => {
                  const isMyOrder = walletAddress && order.offerer.toLowerCase() === walletAddress.toLowerCase();
                  return (
                    <div key={order.orderHash} className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-sm">{order.price.formatted} {order.price.currency}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          {timeUntil(order.endTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <AddressDisplay address={order.offerer} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                        {isMyOrder ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isProcessing}
                            onClick={() => handleCancelClick(order)}
                          >
                            Cancel
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setPurchaseOrder(order)}>
                            Buy
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Offers tab */}
          <TabsContent value="offers" className="mt-4">
            {activeBids.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No active offers for this token.</p>
            ) : (
              <div className="rounded-xl border border-border divide-y divide-border">
                {activeBids.map((bid) => (
                  <div key={bid.orderHash} className="flex items-center justify-between px-4 py-3 gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-sm">{bid.price.formatted} {bid.price.currency}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {timeUntil(bid.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AddressDisplay address={bid.offerer} chars={4} showCopy={false} className="text-xs text-muted-foreground" />
                      {isOwner && (
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleAcceptClick(bid)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="mt-4">
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
                            {event.price.formatted} {event.price.currency}
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
          ? `Accept ${orderToAccept.price.formatted} ${orderToAccept.price.currency} for ${name}?`
          : "Enter your PIN to accept this offer."}
      />
    </>
  );
}
