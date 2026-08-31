"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { assetHref, collectionHref } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { PageContainer, AssetCollectionBar, AssetUtilityIcons, AssetMarketplacePanel, AssetHeaderBlock, AssetMediaColumn } from "@medialane/ui";
import { ipfsToHttp, cn } from "@/lib/utils";
import { Users, ShoppingCart, CheckCircle2, Clock, CalendarX2, Infinity as InfinityIcon } from "lucide-react";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiActivity } from "@medialane/sdk";
import { EXPLORER_URL } from "@/lib/constants";
import { useMembershipOnchain, useIsMemberOf, type MembershipOnchain } from "@/hooks/use-club";
import { HelpIcon } from "@/components/ui/help-icon";
import { ReportDialog } from "@/components/report-dialog";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetProvenanceTab } from "./asset-provenance-tab";
import { AssetCommentsDialog, AssetOwnersPanel } from "./asset-side-panels";
import { AssetOverviewContent } from "./asset-overview-content";
import { AssetMarketplaceDialogs } from "./asset-marketplace-dialogs";
import { ASSET_ACCENTS } from "./accents";
import { useAssetPage } from "./use-asset-page";

type MembershipStatus = "upcoming" | "active" | "ended" | "lifetime";

function membershipStatus(m: MembershipOnchain): MembershipStatus {
  if (m.startTime == null && m.endTime == null) return "lifetime";
  const now = Date.now() / 1000;
  if (m.startTime != null && now < m.startTime) return "upcoming";
  if (m.endTime != null && now >= m.endTime) return "ended";
  return "active";
}

const fmtDate = (ts: number) =>
  new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

function windowLabel(m: MembershipOnchain): string {
  if (m.startTime != null && m.endTime != null) return `Valid from ${fmtDate(m.startTime)} to ${fmtDate(m.endTime)}`;
  if (m.startTime != null) return `Valid from ${fmtDate(m.startTime)}`;
  if (m.endTime != null) return `Valid until ${fmtDate(m.endTime)}`;
  return "Lifetime membership";
}

function MembershipStatusChip({ status }: { status: MembershipStatus }) {
  const styles: Record<MembershipStatus, string> = {
    upcoming: "bg-muted text-muted-foreground border-border",
    active: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    ended: "bg-muted text-muted-foreground border-border",
    lifetime: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
  };
  const labels: Record<MembershipStatus, string> = {
    upcoming: "Upcoming",
    active: "Active",
    ended: "Ended",
    lifetime: "Lifetime",
  };
  const Icon =
    status === "active" ? CheckCircle2 :
    status === "upcoming" ? Clock :
    status === "lifetime" ? InfinityIcon : CalendarX2;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", styles[status])}>
      <Icon className="h-3.5 w-3.5" />
      {labels[status]}
    </span>
  );
}

function MembershipPanel({
  membership,
  myQuantity,
  isMember,
}: {
  membership: MembershipOnchain;
  myQuantity: number;
  isMember: boolean;
}) {
  const status = membershipStatus(membership);
  const hasWindow = membership.startTime != null || membership.endTime != null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-muted/40 to-transparent p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-purple" />
          <span className="text-sm font-semibold">Membership</span>
        </div>
        <MembershipStatusChip status={status} />
      </div>
      {hasWindow && <p className="text-sm text-muted-foreground">{windowLabel(membership)}</p>}
      <div className="flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground">Supply</p>
          <p className="text-sm font-semibold tabular-nums">{membership.maxSupply.toString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Royalty</p>
          <p className="text-sm font-semibold tabular-nums">{(membership.royaltyBps / 100).toFixed(1)}%</p>
        </div>
      </div>
      {myQuantity > 0 && (
        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          {isMember ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
              <p className="text-sm font-medium">
                Active member · {myQuantity} card{myQuantity > 1 ? "s" : ""}
              </p>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {status === "upcoming" ? "Not yet valid" : "Membership ended"} · {myQuantity} card{myQuantity > 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function AssetPageMembership() {
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
  } = useAssetPage({ tokenStandard: "ERC1155", namePrefix: "Membership" });

  const { membership } = useMembershipOnchain(contract, tokenId);
  const { isMember } = useIsMemberOf(contract, tokenId, walletAddress ?? null);
  const myQuantity = quantityOwned != null ? Number(quantityOwned) : 0;

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
              <div className="aspect-square flex items-center justify-center bg-muted">
                <Users className="h-24 w-24 text-brand-purple/40" />
              </div>
            )}
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
              />
              <AssetUtilityIcons
                contractExplorerHref={`${EXPLORER_URL}/contract/${contract}`}
                shareTitle={name}
                onReportClick={() => setReportOpen(true)}
              />
            </div>

            {membership && (
              <MembershipPanel membership={membership} myQuantity={myQuantity} isMember={isMember} />
            )}

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
              {...ASSET_ACCENTS.membership}
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
