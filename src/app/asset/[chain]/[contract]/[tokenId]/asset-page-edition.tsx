"use client";

import { useEffect, useRef } from "react";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { assetHref, collectionHref } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { PageContainer, AssetCollectionBar, AssetUtilityIcons, AssetMarketplacePanel, AssetHeaderBlock, AssetMediaColumn, buildEditionStats } from "@medialane/ui";
import { ipfsToHttp } from "@/lib/utils";
import {
  Layers,
  ShoppingCart,
} from "lucide-react";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiActivity } from "@medialane/sdk";
import { EXPLORER_URL } from "@/lib/constants";
import { HelpIcon } from "@/components/ui/help-icon";
import { ReportDialog } from "@/components/report-dialog";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetProvenanceTab } from "./asset-provenance-tab";
import {
  AssetCommentsDialog,
  AssetOwnersPanel,
} from "./asset-side-panels";
import { AssetOverviewContent } from "./asset-overview-content";
import {
  AssetMarketplaceDialogs,
} from "./asset-marketplace-dialogs";
import { ASSET_ACCENTS } from "./accents";
import { useAssetPage } from "./use-asset-page";

export function AssetPageEdition() {
  const {
    contract, tokenId, pathname, router, shouldReduce,
    hasWallet, walletAddress, listingRequiresEmailVerification,
    collection, token, mutateListings, history, collectionTokens,
    commentTotal, remixCount,
    activeListings, activeBids, cheapest, cheapestUsd, lastSaleRaw,
    isOwner, holders, quantityOwned, myListing, canListMoreEditions, isERC1155,
    isProcessing, cancelStep, cancelError, handleCancelClick, resetCancelStep, acceptOffer,
    purchaseOrder, setPurchaseOrder, listOpen, setListOpen,
    offerOpen, setOfferOpen, transferOpen, setTransferOpen,
    reportOpen, setReportOpen, commentOpen, setCommentOpen, imgError, setImgError,
    imageUrl, image, name, description, attributes, hasTemplateData, isDisplayAttr, isIndexing,
  } = useAssetPage({ tokenStandard: "ERC1155", namePrefix: "Edition" });

  const totalEditions = collection?.totalSupply ?? 0;
  const uniqueOwners = holders.length;

  const autoActionRef = useRef(false);
  useEffect(() => {
    if (autoActionRef.current || !token || !isOwner) return;
    const action = new URLSearchParams(window.location.search).get("action");
    if (action === "list") {
      setListOpen(true);
      autoActionRef.current = true;
    } else if (action === "transfer") {
      setTransferOpen(true);
      autoActionRef.current = true;
    }
  }, [token, isOwner, setListOpen, setTransferOpen]);


  if (!token) return null;


  return (
    <div className="relative z-0 min-h-screen">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            aria-hidden
            fill
            className="object-cover opacity-20 scale-110"
            style={{ filter: "blur(60px) saturate(1.5)" }}
          />
        )}
      </div>

      <PageContainer className="pt-20 space-y-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-10 gap-8 items-start">
          <AssetMediaColumn
            shouldReduce={Boolean(shouldReduce)}
            image={image ?? ""}
            imageAlt={name}
            imgError={imgError}
            onImageError={() => setImgError(true)}
            fallback={(
              <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-brand-purple/20 to-brand-purple/20">
                <Layers className="h-24 w-24 text-brand-purple/40" />
              </div>
            )}
            stats={buildEditionStats(totalEditions, uniqueOwners)}
          />

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
                showMultiEditionBadge={true}
              />
              <AssetUtilityIcons
                contractExplorerHref={`${EXPLORER_URL}/contract/${contract}`}
                shareTitle={name}
                onReportClick={() => setReportOpen(true)}
              />
            </div>

            <AssetMarketplacePanel
              canListMoreEditions={canListMoreEditions}
              cheapest={cheapest}
              usdValue={cheapestUsd}
              isOwner={isOwner}
              isSignedIn={hasWallet}
              isProcessing={isProcessing}
              isERC1155
              myListing={myListing ?? null}
              activeBids={activeBids}
              walletAddress={walletAddress}
              floorPriceRaw={collection?.floorPrice}
              listingRequiresEmailVerification={listingRequiresEmailVerification}
              settingsHref="/verify"
              lastSaleRaw={lastSaleRaw}
              renderAuthAction={() => (
                <div className="btn-border-animated p-[1px] rounded-2xl">
                  <Button asChild className="w-full h-12 text-base bg-transparent text-white rounded-[15px] flex items-center justify-center gap-2">
                    <Link href={`/connect?redirect_url=${encodeURIComponent(pathname)}`}>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Set up account
                    </Link>
                  </Button>
                </div>
              )}
              renderHelp={(content) => <HelpIcon content={content} side="top" />}
              onCancelClick={handleCancelClick}
              onAcceptBid={acceptOffer.handleAcceptClick}
              onOpenListing={() => setListOpen(true)}
              onOpenTransfer={() => setTransferOpen(true)}
              onOpenPurchase={setPurchaseOrder}
              onOpenOffer={() => setOfferOpen(true)}
            />

            <AssetOwnersPanel balances={holders} maxVisible={8} />

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
              target={{ type: "TOKEN", contract, tokenId, name: name ?? undefined }}
              open={reportOpen}
              onOpenChange={setReportOpen}
            />
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
            />
          </TabsContent>
        </Tabs>
      </PageContainer>

      <FloatingCommentsButton onClick={() => setCommentOpen(true)} commentTotal={commentTotal} />

      <AssetCommentsDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        contract={contract}
        tokenId={tokenId}
        name={name}
        imageUrl={imageUrl}
        commentTotal={commentTotal}
              {...ASSET_ACCENTS.edition}
      />

      <AssetMarketplaceDialogs
        contract={contract}
        tokenId={tokenId}
        tokenName={name}
        tokenImage={imageUrl}
        tokenStandard="ERC1155"
        quantityOwned={quantityOwned != null ? Number(quantityOwned) : undefined}
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
