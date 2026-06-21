"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { assetHref, collectionHref } from "@/lib/routes";
import { useToken, useTokenHistory } from "@/hooks/use-tokens";
import { useTokenListings } from "@/hooks/use-orders";
import { useCollection, useCollectionTokens } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { IpTypeBadge } from "@/components/shared/ip-type-badge";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { PageContainer } from "@medialane/ui";
import { ipfsToHttp, timeUntil, formatDisplayPrice, checkIsOwner } from "@/lib/utils";
import { DollarSign, UserCheck, Globe, Bot, Percent, Shield, Calendar, ChevronRight, ChevronLeft, Layers, GitBranch } from "lucide-react";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { LICENSE_TRAIT_TYPES } from "@/types/ip";
import type { IPType } from "@/types/ip";
import { IP_TEMPLATES, EMBED_PLATFORM_META, SOCIAL_PLATFORM_META } from "@/lib/ip-templates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiActivity, ApiOrder } from "@medialane/sdk";
import { getService } from "@medialane/sdk";
import { resolveRemixPolicy, getDerivativesTerm } from "@/lib/remix-policy";
import { PriceHistoryChart } from "@/components/asset/price-history-chart";
import { useComments } from "@/hooks/use-comments";
import { EXPLORER_URL } from "@/lib/constants";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { toast } from "sonner";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { RemixesTab, ParentAttributionBanner } from "@/components/asset/remixes-tab";
import { useTokenRemixes } from "@/hooks/use-remix-offers";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetProvenanceTab } from "./asset-provenance-tab";
import { AssetMarketplacePanel } from "./asset-marketplace-panel";
import { useFullTokenData } from "@/hooks/use-full-token-data";
import {
  AssetMarketplaceDialogs,
  useAssetMarketplaceDialogState,
} from "./asset-marketplace-dialogs";
import {
  AssetCommentsDialog,
  AssetLinksRow,
  AssetOwnersPanel,
} from "./asset-side-panels";
import { AssetOverviewContent } from "@/components/asset/asset-overview-content";
import { AssetHeaderBlock } from "@/components/asset/asset-header-block";
import { AssetMediaColumn } from "@/components/asset/asset-media-column";
import { AssetLightbox } from "@/components/asset/asset-lightbox";
import { useOrderActions } from "./use-order-actions";
import { useAcceptOffer } from "@/hooks/use-accept-offer";

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
    handleCancelClick, handleCancelPin,
    dismissCancelPin, resetCancelStep,
  } = useOrderActions({ mutateListings });
  const acceptOffer = useAcceptOffer({ mutateListings, activeListings: listings.filter(
    (l) => l.status === "ACTIVE" && (l.offer.itemType === "ERC721" || l.offer.itemType === "ERC1155")
  ) });

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

  // Lightbox + collection prev/next. Neighbours come from the (paged) collection
  // token list; arrows are hidden when a neighbour isn't in the loaded page.
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { tokens: collectionTokens } = useCollectionTokens(contract);
  const tokenIndex = collectionTokens.findIndex((t) => String(t.tokenId) === String(tokenId));
  const prevToken = tokenIndex > 0 ? collectionTokens[tokenIndex - 1] : null;
  const nextToken =
    tokenIndex >= 0 && tokenIndex < collectionTokens.length - 1 ? collectionTokens[tokenIndex + 1] : null;

  // Audited IPNft creation record — null for legacy / external contracts.
  const { data: fullTokenData } = useFullTokenData({
    ipNftAddress: contract,
    tokenId: tokenId ? (() => { try { return BigInt(tokenId); } catch { return undefined; } })() : undefined,
  });
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


  // Remix is permissionless (self-mint), gated only by the creator's declared
  // Derivatives term at the app layer. The deal flow is the consent override.
  const remixPolicy = resolveRemixPolicy({
    parentNoDerivatives: getDerivativesTerm(token?.metadata?.attributes) === "Not Allowed",
    viewerIsParentOwner: isOwner,
    dealAvailable: !!getService(collection?.service),
  });

  const goToRemix = () => router.push(`/create/remix/${contract}/${tokenId}`);
  const goToDeal = () => router.push(`/create/licensing/${contract}/${tokenId}`);

  if (isLoading) {
    return (
      <PageContainer className="pt-20 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10 gap-6 items-start">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-9 w-28" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-2xl" />
              ))}
            </div>
            <div className="pt-5 border-t border-border/40 space-y-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <div className="space-y-2.5">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-24 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!token) {
    return (
      <PageContainer className="py-24 text-center">
        <p className="text-2xl font-bold">Asset not found</p>
        <p className="text-muted-foreground mt-2">This token hasn&apos;t been indexed yet.</p>
      </PageContainer>
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
  // Keys rendered by IPTypeDisplay (embeds + socials) — kept out of the generic
  // attribute grid. Trait values (Artist, Genre, custom traits) intentionally
  // fall through to the Attributes grid.
  const activeTemplateEmbedSocialKeys = activeTemplate
    ? [
        ...(activeTemplate.embeds ?? []).map((p) => EMBED_PLATFORM_META[p].traitKey),
        ...(activeTemplate.socials ?? []).map((p) => SOCIAL_PLATFORM_META[p].traitKey),
          ...(activeTemplate.docUpload ? [activeTemplate.docUpload.traitType] : []),
      ]
    : [];
  const activeTemplateKeys = new Set<string>(["IP Type", ...activeTemplateEmbedSocialKeys]);
  const hasTemplateData = activeTemplateEmbedSocialKeys.some((k) =>
    attributes.some((a) => a.trait_type === k && a.value)
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
      {/*
       * `Token.isHidden` exists on the backend Prisma schema as a filter
       * column — hidden tokens are excluded from every list AND single-
       * token endpoint (see medialane-backend tokens.ts:39,157,201,218).
       * The field is never serialised on the response, so this banner
       * can never render: a hidden token would 404 before reaching this
       * component. Removing the cast + dead branch.
       *
       * If we ever want to display hidden tokens with a moderation
       * banner instead of 404'ing them, the change is in backend: drop
       * `isHidden: false` from the WHERE clause + include the field in
       * serialize(), then add to ApiToken in @medialane/sdk, then
       * restore this check.
       */}
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
            className="absolute inset-0 w-full h-full object-cover opacity-30 scale-110"
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

      <PageContainer className="pt-20 space-y-8 pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <Link
            href={collectionHref("STARKNET", contract)}
            className="hover:text-foreground transition-colors truncate max-w-[140px] shrink-0"
          >
            {collection?.name ?? contract.slice(0, 8) + "…"}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate">{name}</span>
        </nav>

        {/* Top: image + info — 50/50 on desktop, image-first single column on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10 gap-6 items-start">
          <div className="space-y-3">
            <AssetMediaColumn
              shouldReduce={Boolean(shouldReduce)}
              image={image}
              imageAlt={name}
              imgError={imgError}
              onImageError={() => setImgError(true)}
              onZoom={() => setLightboxOpen(true)}
              fallback={(
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-500/10">
                  <span className="text-5xl font-mono text-muted-foreground">#{tokenId}</span>
                </div>
              )}
            />
            {(prevToken || nextToken) && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={!prevToken}
                  onClick={() => prevToken && router.push(assetHref("STARKNET", contract, prevToken.tokenId))}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  type="button"
                  disabled={!nextToken}
                  onClick={() => nextToken && router.push(assetHref("STARKNET", contract, nextToken.tokenId))}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right column */}
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <AssetHeaderBlock
              name={name}
              description={description}
              ipType={token.metadata?.ipType}
              showMultiEditionBadge={Boolean(isERC1155)}
              parentContract={parentContract}
              parentTokenId={parentTokenId}
              ownerAddress={!isERC1155 ? (token.balances?.[0]?.owner ?? token.owner ?? null) : null}
            />

            <AssetMarketplacePanel
              cheapest={cheapest}
              isOwner={isOwner}
              isSignedIn={!!isSignedIn}
              isProcessing={isProcessing}
              isERC1155={isERC1155}
              myListing={myListing ?? null}
              activeBids={activeBids}
              walletAddress={walletAddress}
              remixEnabled={remixPolicy.canRemixDirect}
              showDealOption={remixPolicy.showDealOption}
              onCancelClick={handleCancelClick}
              onAcceptBid={acceptOffer.handleAcceptClick}
              onOpenListing={() => setListOpen(true)}
              onOpenTransfer={() => setTransferOpen(true)}
              onOpenPurchase={setPurchaseOrder}
              onOpenOffer={() => setOfferOpen(true)}
              onOpenRemix={goToRemix}
              onProposeDeal={goToDeal}
            />

            {/* ERC-1155 ownership — shown after marketplace buttons */}
            {isERC1155 && token.balances && token.balances.length > 0 ? (
              <AssetOwnersPanel balances={token.balances} maxVisible={5} />
            ) : null}

            {/* Details + rights — separated from the action group by a hairline
                so the column reads as placard sections, not one flat stack. */}
            <div className="pt-5 border-t border-border/40 space-y-5">
              <AssetLinksRow
                contractHref={`${EXPLORER_URL}/contract/${token.contractAddress}`}
                collectionHref={collectionHref("STARKNET", token.contractAddress)}
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
            </div>
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
              onAcceptClick={acceptOffer.handleAcceptClick}
            />
          </TabsContent>

          {/* Provenance tab — history + remixes */}
          <TabsContent value="provenance">
            <AssetProvenanceTab
              history={history as ApiActivity[]}
              contract={contract}
              tokenId={tokenId}
              remixCount={remixCount}
              originalCreator={fullTokenData?.originalCreator}
              registeredAt={fullTokenData?.registeredAt}
            />
          </TabsContent>

        </Tabs>
      </PageContainer>


      <AssetLightbox open={lightboxOpen} onOpenChange={setLightboxOpen} image={image} alt={name} />

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
        cancelStep={cancelStep}
        cancelError={cancelError}
        resetCancelStep={resetCancelStep}
        acceptOfferHook={acceptOffer}
        onCancelListing={handleCancelClick}
      />

    </div>
  );
}
