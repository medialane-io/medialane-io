"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { assetHref, collectionHref } from "@/lib/routes";
import { useToken, useTokenHistory } from "@/hooks/use-tokens";
import { useTokenListings } from "@/hooks/use-orders";
import { useCollection, useNearbyCollectionTokens } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { PageContainer, AssetCollectionBar, AssetUtilityIcons, AssetMarketplacePanel } from "@medialane/ui";
import { ipfsToHttp, timeUntil, formatDisplayPrice, checkIsOwner } from "@/lib/utils";
import { DollarSign, UserCheck, Globe, Bot, Percent, Shield, Calendar, ShoppingCart, Layers, GitBranch } from "lucide-react";
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
import { useFullTokenData } from "@/hooks/use-full-token-data";
import {
  AssetMarketplaceDialogs,
  useAssetMarketplaceDialogState,
} from "./asset-marketplace-dialogs";
import {
  AssetCommentsDialog,
  AssetOwnersPanel,
} from "./asset-side-panels";
import { AssetOverviewContent } from "./asset-overview-content";
import { AssetHeaderBlock } from "@/components/asset/asset-header-block";
import { OpenInDappCallout } from "@/components/asset/open-in-dapp-callout";
import { AssetMediaColumn } from "@/components/asset/asset-media-column";
import { AssetLightbox } from "@/components/asset/asset-lightbox";
import { ReportDialog } from "@/components/report-dialog";
import { HelpIcon } from "@/components/ui/help-icon";
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

  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Collection siblings for the filmstrip nav — from the (paged) collection
  // token list; the filmstrip hides itself when the collection has ≤1 item.
  const { tokens: collectionTokens } = useNearbyCollectionTokens(contract, tokenId);

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

  // Most recent "sale" activity — `history`'s sort order isn't guaranteed, so
  // pick the max-timestamp entry explicitly rather than assuming array order.
  const lastSale = (history as ApiActivity[])
    .filter((h) => h.type === "sale" && h.price?.formatted)
    .reduce<ApiActivity | null>((latest, h) => (!latest || h.timestamp > latest.timestamp ? h : latest), null);
  const lastSaleRaw = lastSale?.price ? `${lastSale.price.formatted} ${lastSale.price.currency ?? ""}`.trim() : null;

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
  const image = token.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
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
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-primary/10 to-brand-purple/10">
                  <span className="text-5xl tabular-nums text-muted-foreground">#{tokenId}</span>
                </div>
              )}
            />
          </div>

          {/* Right column */}
          <motion.div
            initial={shouldReduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-start justify-between gap-3">
              <AssetHeaderBlock
                name={name}
                description={description}
                ipType={token.metadata?.ipType}
                showMultiEditionBadge={Boolean(isERC1155)}
                parentContract={parentContract}
                parentTokenId={parentTokenId}
                ownerAddress={!isERC1155 ? (token.balances?.[0]?.owner ?? token.owner ?? null) : null}
              />
              <AssetUtilityIcons
                contractExplorerHref={`${EXPLORER_URL}/contract/${token.contractAddress}`}
                shareTitle={name ?? `Token #${token?.tokenId}`}
                onReportClick={() => setReportOpen(true)}
              />
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
              remixEnabled={remixPolicy.canRemixDirect}
              showDealOption={remixPolicy.showDealOption}
              floorPriceRaw={collection?.floorPrice}
              lastSaleRaw={lastSaleRaw}
              renderAuthAction={(label) => (
                <SignInButton mode="modal">
                  <div className="btn-border-animated p-[1px] rounded-2xl">
                    <Button className="w-full h-12 text-base bg-transparent text-white rounded-[15px] flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]">
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {label}
                    </Button>
                  </div>
                </SignInButton>
              )}
              renderHelp={(content) => <HelpIcon content={content} side="top" />}
              onCancelClick={handleCancelClick}
              onAcceptBid={acceptOffer.handleAcceptClick}
              onOpenListing={() => setListOpen(true)}
              onOpenTransfer={() => setTransferOpen(true)}
              onOpenPurchase={setPurchaseOrder}
              onOpenOffer={() => setOfferOpen(true)}
              onOpenRemix={goToRemix}
              onProposeDeal={goToDeal}
            />

            {/* Bridge to the chain-native dapp for self-custody / web3 users */}
            <OpenInDappCallout chain={token.chain} contract={contract} tokenId={tokenId} />

            {/* ERC-1155 ownership — shown after marketplace buttons */}
            {isERC1155 && token.balances && token.balances.length > 0 ? (
              <AssetOwnersPanel balances={token.balances} maxVisible={5} />
            ) : null}

            {/* Details + rights — separated from the action group by a hairline
                so the column reads as placard sections, not one flat stack. */}
            <div className="pt-5 border-t border-border/40 space-y-5">
              <AssetCollectionBar
                collectionName={collection?.name ?? contract.slice(0, 8) + "…"}
                collectionImage={collection?.image ? ipfsToHttp(collection.image, 96) : null}
                collectionHref={collectionHref("STARKNET", contract)}
                currentTokenId={tokenId}
                siblingTokens={collectionTokens.map((t) => ({
                  tokenId: t.tokenId,
                  image: t.metadata?.image ? ipfsToHttp(t.metadata.image, 96) : null,
                }))}
                onNavigate={(id) => router.push(assetHref("STARKNET", contract, id))}
              />
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
