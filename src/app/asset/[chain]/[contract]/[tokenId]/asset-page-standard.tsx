"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { assetHref, collectionHref } from "@/lib/routes";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, AssetCollectionBar, AssetUtilityIcons, AssetMarketplacePanel, AssetMediaColumn, isLivingRenderCollection } from "@medialane/ui";
import type { Chain } from "@medialane/sdk";
import { ipfsToHttp } from "@/lib/utils";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiActivity } from "@medialane/sdk";
import { getService } from "@medialane/sdk";
import { resolveRemixPolicy, getDerivativesTerm } from "@medialane/sdk";
import { EXPLORER_URL } from "@/lib/constants";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetProvenanceTab } from "./asset-provenance-tab";
import { useFullTokenData } from "@/hooks/use-full-token-data";
import {
  AssetMarketplaceDialogs,
} from "./asset-marketplace-dialogs";
import {
  AssetCommentsDialog,
  AssetOwnersPanel,
} from "./asset-side-panels";
import { AssetOverviewContent } from "./asset-overview-content";
import { AssetHeaderBlock } from "@/components/asset/asset-header-block";
import { OpenInDappCallout } from "@/components/asset/open-in-dapp-callout";
import { SignedOutAssetActions } from "@/components/asset/signed-out-asset-actions";
import { AssetLightbox } from "@/components/asset/asset-lightbox";
import { ReportDialog } from "@/components/report-dialog";
import { HelpIcon } from "@/components/ui/help-icon";
import { ASSET_ACCENTS } from "./accents";
import { useAssetPage } from "./use-asset-page";

export function AssetPageStandard() {
  const {
    contract, tokenId, router, shouldReduce,
    hasWallet, walletAddress, listingRequiresEmailVerification,
    collection, token, isLoading, isIndexing, mutateListings, history, collectionTokens,
    commentTotal, remixCount,
    activeListings, activeBids, cheapest, cheapestUsd, lastSaleRaw,
    isOwner, isERC1155, myListing, canListMoreEditions,
    isProcessing, cancelStep, cancelError, handleCancelClick, resetCancelStep, acceptOffer,
    purchaseOrder, setPurchaseOrder, listOpen, setListOpen,
    offerOpen, setOfferOpen, transferOpen, setTransferOpen,
    reportOpen, setReportOpen, commentOpen, setCommentOpen, imgError, setImgError,
    imageUrl, image, name, description, attributes, hasTemplateData, isDisplayAttr,
  } = useAssetPage({ namePrefix: "Token" });

  const [lightboxOpen, setLightboxOpen] = useState(false);

  const live = token ? isLivingRenderCollection(token.chain as Chain, token.contractAddress) : false;

  const { data: fullTokenData } = useFullTokenData({
    ipNftAddress: contract,
    tokenId: tokenId ? (() => { try { return BigInt(tokenId); } catch { return undefined; } })() : undefined,
  });

  const remixPolicy = resolveRemixPolicy({
    parentNoDerivatives: getDerivativesTerm(token?.metadata?.attributes) === "Not Allowed",
    viewerIsParentOwner: isOwner,
    dealAvailable: !!getService(collection?.service),
  });

  const goToRemix = () => router.push(`/create/remix/${contract}/${tokenId}`);

  const autoActionRef = useRef(false);
  useEffect(() => {
    if (autoActionRef.current || isLoading || !token || !isOwner) return;
    const action = new URLSearchParams(window.location.search).get("action");
    if (action === "list") {
      setListOpen(true);
      autoActionRef.current = true;
    } else if (action === "transfer") {
      setTransferOpen(true);
      autoActionRef.current = true;
    }
  }, [isLoading, token, isOwner, setListOpen, setTransferOpen]);

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

  if (!token && isIndexing) {
    return (
      <PageContainer className="py-24 text-center">
        <p className="text-2xl font-bold">Preparing this asset</p>
        <p className="text-muted-foreground mt-2">
          It is live onchain and will appear here in a moment.
        </p>
      </PageContainer>
    );
  }

  if (!token) {
    return (
      <PageContainer className="py-24 text-center">
        <p className="text-2xl font-bold">Asset not found</p>
        <p className="text-muted-foreground mt-2">
          Check the collection address and token ID.
        </p>
      </PageContainer>
    );
  }


  const parentContract = attributes.find((a) => a.trait_type === "Parent Contract")?.value ?? null;
  const parentTokenId = attributes.find((a) => a.trait_type === "Parent Token ID")?.value ?? null;

  return (
    <div className="relative z-0 min-h-screen">

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            aria-hidden
            fill
            className="object-cover opacity-30 scale-110"
            style={{ filter: "blur(60px) saturate(1.5)" }}
          />
        )}
      </div>

      <PageContainer className="pt-20 space-y-8 pb-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10 gap-6 items-start">
          <div className="space-y-3">
            <AssetMediaColumn
              shouldReduce={Boolean(shouldReduce)}
              image={image}
              imageAlt={name}
              imgError={imgError}
              onImageError={() => setImgError(true)}
              onZoom={() => setLightboxOpen(true)}
              animationUrl={token.metadata?.animationUrl}
              live={live}
              fallback={(
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-primary/10 to-brand-purple/10">
                  <span className="text-5xl tabular-nums text-muted-foreground">#{tokenId}</span>
                </div>
              )}
            />
          </div>

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
              usdValue={cheapestUsd}
              isOwner={isOwner}
              isSignedIn={hasWallet}
              isProcessing={isProcessing}
              canListMoreEditions={canListMoreEditions}
              isERC1155={isERC1155}
              myListing={myListing ?? null}
              activeBids={activeBids}
              walletAddress={walletAddress}
              remixEnabled={remixPolicy.canRemixDirect}
              showDealOption={remixPolicy.showDealOption}
              floorPriceRaw={collection?.floorPrice}
              lastSaleRaw={lastSaleRaw}
              listingRequiresEmailVerification={listingRequiresEmailVerification}
              settingsHref="/verify"
              renderAuthAction={() => (
                <SignedOutAssetActions chain={token.chain} contract={contract} tokenId={tokenId} />
              )}
              renderHelp={(content) => <HelpIcon content={content} side="top" />}
              onCancelClick={handleCancelClick}
              onAcceptBid={acceptOffer.handleAcceptClick}
              onOpenListing={() => setListOpen(true)}
              onOpenTransfer={() => setTransferOpen(true)}
              onOpenPurchase={setPurchaseOrder}
              onOpenOffer={() => setOfferOpen(true)}
              onOpenRemix={goToRemix}

            />

            {hasWallet && <OpenInDappCallout chain={token.chain} contract={contract} tokenId={tokenId} />}

            {isERC1155 && token.balances && token.balances.length > 0 ? (
              <AssetOwnersPanel balances={token.balances} maxVisible={5} />
            ) : null}

            <div className="pt-5 border-t border-border/40 space-y-5">
              <AssetCollectionBar
                collectionName={collection?.name ?? contract.slice(0, 8) + "…"}
                collectionImage={collection?.image ? ipfsToHttp(collection.image) : null}
                collectionHref={collectionHref("STARKNET", contract)}
                currentTokenId={tokenId}
                siblingTokens={collectionTokens.map((t) => ({
                  tokenId: t.tokenId,
                  image: t.metadata?.image ? ipfsToHttp(t.metadata.image) : null,
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

          <TabsContent value="overview">
            <AssetOverviewContent
              attributes={attributes}
              hasTemplateData={hasTemplateData}
              isDisplayAttr={isDisplayAttr}
            />
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
              onAcceptClick={acceptOffer.handleAcceptClick}
            />
          </TabsContent>

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
              {...ASSET_ACCENTS.standard}
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
        cancelStep={cancelStep}
        cancelError={cancelError}
        resetCancelStep={resetCancelStep}
        acceptOfferHook={acceptOffer}
        onCancelListing={handleCancelClick}
      />

    </div>
  );
}
