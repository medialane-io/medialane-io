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
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { ipfsToHttp, timeUntil, formatDisplayPrice, checkIsOwner } from "@/lib/utils";
import { DollarSign, UserCheck, Globe, Bot, Percent, Shield, Calendar, ChevronRight, Layers, GitBranch } from "lucide-react";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { HiddenContentBanner } from "@/components/hidden-content-banner";
import { LICENSE_TRAIT_TYPES } from "@/types/ip";
import type { IPType } from "@/types/ip";
import { IP_TEMPLATES } from "@/lib/ip-templates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { PriceHistoryChart } from "@/components/asset/price-history-chart";
import { useComments } from "@/hooks/use-comments";
import { EXPLORER_URL } from "@/lib/constants";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { RemixesTab, ParentAttributionBanner } from "@/components/asset/remixes-tab";
import { useTokenRemixes } from "@/hooks/use-remix-offers";
import { HelpIcon } from "@/components/ui/help-icon";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetProvenanceTab } from "./asset-provenance-tab";
import { AssetMarketplacePanel } from "./asset-marketplace-panel";
import {
  AssetMarketplaceDialogs,
  useAssetMarketplaceDialogState,
} from "./asset-marketplace-dialogs";
import {
  AssetCommentsDialog,
  AssetLinksRow,
  AssetOwnersPanel,
} from "./asset-side-panels";
import { AssetOverviewContent } from "./asset-overview-content";
import { useOrderActions } from "./use-order-actions";

export function AssetPageStandard() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { walletAddress } = useSessionKey();
  const { collection } = useCollection(contract);
  const { token, isLoading } = useToken(contract, tokenId);
  const { listings, mutate: mutateListings } = useTokenListings(contract, tokenId);
  const { history } = useTokenHistory(contract, tokenId);

  const {
    isProcessing,
    orderToCancel, cancelPinOpen, cancelStep, cancelError,
    orderToAccept, acceptPinOpen,
    handleCancelClick, handleCancelPin,
    handleAcceptClick, handleAcceptPin,
    dismissCancelPin, dismissAcceptPin, resetCancelStep,
  } = useOrderActions({ mutateListings });

  const { addItem, items: cartItems, setIsOpen: setCartOpen } = useCart();
  const shouldReduce = useReducedMotion();

  const imageUrl = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const { imgRef, dynamicTheme } = useDominantColor(imageUrl);

  const [imgError, setImgError] = useState(false);
  const {
    purchaseOrder,
    setPurchaseOrder,
    listOpen,
    setListOpen,
    offerOpen,
    setOfferOpen,
    transferOpen,
    setTransferOpen,
  } = useAssetMarketplaceDialogState();
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
  const isERC1155 = (token?.standard ?? collection?.standard) === "ERC1155";

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
              {/* ERC-721 ownership — shown above the title */}
              {!isERC1155 && (token.balances?.[0]?.owner ?? token.owner) ? (
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Owner</span>
                  <Link href={`/creator/${token.balances?.[0]?.owner ?? token.owner}`} className="hover:text-primary transition-colors font-medium">
                    <AddressDisplay address={(token.balances?.[0]?.owner ?? token.owner)!} />
                  </Link>
                </div>
              ) : null}
              <h1 className="text-3xl lg:text-5xl font-bold">{name}</h1>
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{description}</p>
              )}
            </div>

            <AssetMarketplacePanel
              cheapest={cheapest}
              isOwner={isOwner}
              isSignedIn={!!isSignedIn}
              isProcessing={isProcessing}
              isERC1155={isERC1155}
              myListing={myListing ?? null}
              activeBids={activeBids}
              walletAddress={walletAddress}
              inCart={inCart}
              remixEnabled
              onCancelClick={handleCancelClick}
              onAcceptBid={handleAcceptClick}
              onOpenListing={() => setListOpen(true)}
              onOpenTransfer={() => setTransferOpen(true)}
              onOpenPurchase={setPurchaseOrder}
              onAddToCart={handleAddToCart}
              onOpenOffer={() => setOfferOpen(true)}
              onOpenRemix={handleAutoRemix}
            />

            {/* ERC-1155 ownership — shown after marketplace buttons */}
            {isERC1155 && token.balances && token.balances.length > 0 ? (
              <AssetOwnersPanel balances={token.balances} maxVisible={5} />
            ) : null}

            <AssetLinksRow
              contractHref={`${EXPLORER_URL}/contract/${token.contractAddress}`}
              collectionHref={`/collections/${token.contractAddress}`}
              collection={collection}
              shareTitle={name ?? `Token #${token?.tokenId}`}
              reportTarget={{
                type: "TOKEN",
                contract: token.contractAddress,
                tokenId: token.tokenId,
                name: name ?? undefined,
              }}
              reportOpen={reportOpen}
              onReportOpenChange={setReportOpen}
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
          <TabsContent value="overview">
            <AssetOverviewContent
              attributes={attributes}
              hasTemplateData={hasTemplateData}
              isDisplayAttr={isDisplayAttr}
            />
          </TabsContent>


          {/* Markets tab — listings + offers */}
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

          {/* Provenance tab — history + remixes */}
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

      <AssetCommentsDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        contract={contract}
        tokenId={tokenId}
        name={name}
        imageUrl={imageUrl}
        commentTotal={commentTotal}
        accentBorderClassName="border-brand-blue/20"
        accentHeaderStyle="linear-gradient(135deg, hsl(var(--brand-blue) / 0.10), hsl(var(--brand-purple) / 0.08))"
        accentAvatarStyle="linear-gradient(135deg, hsl(var(--brand-blue) / 0.3), hsl(var(--brand-purple) / 0.3))"
        accentCountStyle={{ background: "hsl(var(--brand-blue))" }}
      />

      <AssetMarketplaceDialogs
        contract={contract}
        tokenId={tokenId}
        tokenName={name}
        tokenImage={imageUrl}
        tokenStandard={token?.standard ?? collection?.standard ?? "UNKNOWN"}
        hasActiveListing={activeListings.length > 0}
        mutateListings={mutateListings}
        purchaseOrder={purchaseOrder}
        setPurchaseOrder={setPurchaseOrder}
        listOpen={listOpen}
        setListOpen={setListOpen}
        offerOpen={offerOpen}
        setOfferOpen={setOfferOpen}
        transferOpen={transferOpen}
        setTransferOpen={setTransferOpen}
        cancelPinOpen={cancelPinOpen}
        handleCancelPin={handleCancelPin}
        dismissCancelPin={dismissCancelPin}
        acceptPinOpen={acceptPinOpen}
        handleAcceptPin={handleAcceptPin}
        dismissAcceptPin={dismissAcceptPin}
        orderToAccept={orderToAccept}
        cancelStep={cancelStep}
        cancelError={cancelError}
        resetCancelStep={resetCancelStep}
      />
    </div>
  );
}
