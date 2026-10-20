"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { assetHref, collectionHref } from "@/lib/routes";
import { PageContainer, AssetCollectionBar, AssetUtilityIcons, AssetMarketplacePanel, AssetHeaderBlock, AssetMediaColumn, AssetOwnersPanel, AssetProvenanceTab, AssetUnavailable, ASSET_ACCENTS } from "@medialane/ui";
import { ipfsToHttp, cn } from "@/lib/utils";
import { Ticket, CheckCircle2, Clock, CalendarX2 } from "lucide-react";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiActivity } from "@medialane/sdk";
import { EXPLORER_URL } from "@/lib/constants";
import { useTicketOnchain, type TicketOnchain } from "@/hooks/use-tickets";
import { HelpIcon } from "@/components/ui/help-icon";
import { ReportDialog } from "@/components/report-dialog";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetCommentsDialog } from "./asset-side-panels";
import { AssetOverviewContent } from "./asset-overview-content";
import { AssetMarketplaceDialogs } from "./asset-marketplace-dialogs";
import { useAssetPage } from "./use-asset-page";

type TicketStatus = "upcoming" | "valid" | "ended";

function ticketStatus(t: TicketOnchain): TicketStatus {
  const now = Date.now() / 1000;
  if (t.startTime != null && now < t.startTime) return "upcoming";
  if (t.endTime != null && now >= t.endTime) return "ended";
  return "valid";
}

const fmtDate = (ts: number) =>
  new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

function windowLabel(t: TicketOnchain): string {
  if (t.startTime != null && t.endTime != null) return `Valid from ${fmtDate(t.startTime)} to ${fmtDate(t.endTime)}`;
  if (t.startTime != null) return `Valid from ${fmtDate(t.startTime)}`;
  if (t.endTime != null) return `Valid until ${fmtDate(t.endTime)}`;
  return "Always valid";
}

function TicketStatusChip({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    upcoming: "bg-muted text-muted-foreground border-border",
    valid: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30",
    ended: "bg-muted text-muted-foreground border-border",
  };
  const labels: Record<TicketStatus, string> = {
    upcoming: "Upcoming",
    valid: "Valid now",
    ended: "Ended",
  };
  const Icon = status === "valid" ? CheckCircle2 : status === "upcoming" ? Clock : CalendarX2;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", styles[status])}>
      <Icon className="h-3.5 w-3.5" />
      {labels[status]}
    </span>
  );
}

function TicketPanel({ ticket }: { ticket: TicketOnchain }) {
  const status = ticketStatus(ticket);
  const hasWindow = ticket.startTime != null || ticket.endTime != null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-muted/40 to-transparent p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-teal-500" />
          <span className="text-sm font-semibold">Ticket</span>
        </div>
        <TicketStatusChip status={status} />
      </div>
      {hasWindow && <p className="text-sm text-muted-foreground">{windowLabel(ticket)}</p>}
      <div className="flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground">Quantity</p>
          <p className="text-sm font-semibold tabular-nums">{ticket.maxSupply.toString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Royalty</p>
          <p className="text-sm font-semibold tabular-nums">{(ticket.royaltyBps / 100).toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

export function AssetPageTicket() {
  const {
    contract, tokenId, router, shouldReduce,
    hasWallet, walletAddress,
    collection, token, mutateListings, history, collectionTokens,
    commentTotal, remixCount,
    activeListings, activeBids, cheapest, cheapestUsd, lastSaleRaw,
    isOwner, holders, quantityOwned, myListing, canListMoreEditions,
    isProcessing, cancelStep, cancelError, handleCancelClick, resetCancelStep, acceptOffer,
    purchaseOrder, setPurchaseOrder, listOpen, setListOpen,
    offerOpen, setOfferOpen, transferOpen, setTransferOpen,
    reportOpen, setReportOpen, commentOpen, setCommentOpen, imgError, setImgError,
    imageUrl, image, name, description, attributes, hasTemplateData, isDisplayAttr, isIndexing,
  } = useAssetPage({ tokenStandard: "ERC1155", namePrefix: "Ticket" });

  const { ticket } = useTicketOnchain(contract, tokenId);

  if (!token) return <AssetUnavailable isIndexing={isIndexing} />;


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
                <Ticket className="h-24 w-24 text-teal-500/40" />
              </div>
            )}
          />

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
              utilities={(
                <AssetUtilityIcons
                  contractExplorerHref={`${EXPLORER_URL}/contract/${contract}`}
                  shareTitle={name}
                  onReportClick={() => setReportOpen(true)}
                />
              )}
            />

            {ticket && <TicketPanel ticket={ticket} />}

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
              lastSaleRaw={lastSaleRaw}
              asset={token}
              renderHelp={(content) => <HelpIcon content={content} side="top" />}
              onCancelClick={handleCancelClick}
              onAcceptBid={acceptOffer.handleAcceptClick}
              onOpenListing={() => setListOpen(true)}
              onOpenTransfer={() => setTransferOpen(true)}
              onOpenPurchase={setPurchaseOrder}
              onOpenOffer={() => setOfferOpen(true)}
            />

            <AssetOwnersPanel balances={holders} total={token.holderCount} editions={Number(token.supply ?? 0)} />

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
              {...ASSET_ACCENTS.ticket}
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
