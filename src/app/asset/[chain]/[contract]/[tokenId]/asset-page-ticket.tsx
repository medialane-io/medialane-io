"use client";

// Ticket asset page — the ip-tickets uiVariant. Same shape as the edition page
// with the token presented as a ticket: the on-chain validity window and supply
// from get_ticket, and a holder-facing "Your ticket" door panel driven by the
// on-chain is_valid check.

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { assetHref, collectionHref } from "@/lib/routes";
import { useToken, useTokenHistory } from "@/hooks/use-tokens";
import { useTokenListings } from "@/hooks/use-orders";
import { useCollection, useCollectionTokens } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { PageContainer, AssetCollectionBar, AssetUtilityIcons, AssetMarketplacePanel, AssetHeaderBlock, AssetMediaColumn } from "@medialane/ui";
import { ipfsToHttp, resolveTokenImage, checkIsOwner, cn } from "@/lib/utils";
import { Ticket, ShoppingCart, CheckCircle2, Clock, CalendarX2 } from "lucide-react";
import { FloatingCommentsButton } from "@/components/asset/floating-comments-button";
import { LICENSE_TRAIT_TYPES } from "@/types/ip";
import type { IPType } from "@/types/ip";
import { IP_TEMPLATES, EMBED_PLATFORM_META, SOCIAL_PLATFORM_META } from "@/lib/ip-templates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ApiActivity } from "@medialane/sdk";
import { useComments } from "@/hooks/use-comments";
import { EXPLORER_URL } from "@/lib/constants";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useOrderActions } from "./use-order-actions";
import { useAcceptOffer } from "@/hooks/use-accept-offer";
import { useDominantColor } from "@/hooks/use-dominant-color";
import { useTokenRemixes } from "@/hooks/use-remix-offers";
import { useTicketOnchain, useTicketValidity, type TicketOnchain } from "@/hooks/use-tickets";
import { HelpIcon } from "@/components/ui/help-icon";
import { ReportDialog } from "@/components/report-dialog";
import { AssetMarketsTab } from "./asset-markets-tab";
import { AssetProvenanceTab } from "./asset-provenance-tab";
import { AssetCommentsDialog, AssetOwnersPanel } from "./asset-side-panels";
import { AssetOverviewContent } from "./asset-overview-content";
import { AssetMarketplaceDialogs, useAssetMarketplaceDialogState } from "./asset-marketplace-dialogs";

// ── Ticket status (window-derived only — that's what affects holders) ────────

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

// ── Ticket panel — one card: identity, supply, royalty, and (if the
// connected wallet holds this ticket) its validity — no separate "Your
// ticket" card duplicating the same status.

function TicketPanel({
  contract,
  tokenId,
  quantity,
  ticket,
}: {
  contract: string;
  tokenId: string;
  quantity: number;
  ticket: TicketOnchain;
}) {
  const { walletAddress } = useSessionKey();
  const { valid, isLoading } = useTicketValidity(contract, tokenId, walletAddress && quantity > 0 ? walletAddress : null);
  const status = ticketStatus(ticket);
  const showHolderStatus = !!walletAddress && quantity > 0;
  const invalidReason =
    status === "upcoming" ? "Not valid yet — the validity window hasn't opened." :
    status === "ended" ? "The validity window has ended." :
    "No valid ticket for this wallet.";

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-teal-500" />
          <span className="text-sm font-semibold">Ticket</span>
        </div>
        <TicketStatusChip status={status} />
      </div>
      <p className="text-sm text-muted-foreground">{windowLabel(ticket)}</p>
      <div className="flex gap-8">
        <div>
          <p className="text-xs text-muted-foreground">Minted</p>
          <p className="text-sm font-semibold tabular-nums">
            {ticket.minted.toString()} of {ticket.maxSupply.toString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Royalty</p>
          <p className="text-sm font-semibold tabular-nums">{(ticket.royaltyBps / 100).toFixed(1)}%</p>
        </div>
      </div>

      {showHolderStatus && (
        <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">You hold ×{quantity}</span>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Checking on-chain…</p>
          ) : valid ? (
            <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="text-xs font-medium">Valid — ready to present</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{invalidReason}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AssetPageTicket() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { walletAddress } = useSessionKey();
  const { collection } = useCollection(contract);
  const { token } = useToken(contract, tokenId);
  const { listings, mutate: mutateListings } = useTokenListings(contract, tokenId);
  const { history } = useTokenHistory(contract, tokenId);
  const { tokens: collectionTokens } = useCollectionTokens(contract);
  const { ticket } = useTicketOnchain(contract, tokenId);
  const {
    isProcessing,
    orderToCancel: _orderToCancel, cancelPinOpen, cancelStep, cancelError,
    handleCancelClick, handleCancelPin,
    dismissCancelPin, resetCancelStep,
  } = useOrderActions({ mutateListings, tokenStandard: "ERC1155" });
  const acceptOffer = useAcceptOffer({ mutateListings, tokenStandard: "ERC1155", activeListings: listings.filter(
    (l) => l.status === "ACTIVE" && (l.offer.itemType === "ERC721" || l.offer.itemType === "ERC1155")
  ) });
  const shouldReduce = useReducedMotion();

  const imageUrl = token?.metadata?.image ? ipfsToHttp(token.metadata.image) : null;
  const { imgRef, dynamicTheme } = useDominantColor(imageUrl);

  const [imgError, setImgError] = useState(false);
  const {
    purchaseOrder, setPurchaseOrder,
    listOpen, setListOpen,
    offerOpen, setOfferOpen,
    transferOpen, setTransferOpen,
  } = useAssetMarketplaceDialogState();
  const [reportOpen, setReportOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);

  const { total: commentTotal } = useComments(contract, tokenId);
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

  const lastSale = (history as ApiActivity[])
    .filter((h) => h.type === "sale" && h.price?.formatted)
    .reduce<ApiActivity | null>((latest, h) => (!latest || h.timestamp > latest.timestamp ? h : latest), null);
  const lastSaleRaw = lastSale?.price ? `${lastSale.price.formatted} ${lastSale.price.currency ?? ""}`.trim() : null;

  const isOwner = checkIsOwner(token, walletAddress);
  const holders = token?.balances ?? [];
  const quantityOwned = walletAddress
    ? holders.find((h) => h.owner.toLowerCase() === walletAddress.toLowerCase())?.amount
    : undefined;
  const myQuantity = quantityOwned != null ? Number(quantityOwned) : 0;

  const myListing = isOwner
    ? activeListings.find((l) => l.offerer.toLowerCase() === walletAddress!.toLowerCase())
    : null;

  if (!token) return null;

  const name = token.metadata?.name || `Ticket #${token.tokenId}`;
  const image = resolveTokenImage(token.metadata?.image);
  const description = token.metadata?.description;
  const attributes = Array.isArray(token.metadata?.attributes)
    ? (token.metadata.attributes as { trait_type?: string; value?: string }[])
    : [];

  const activeTemplate = IP_TEMPLATES[
    (attributes.find((a) => a.trait_type?.toLowerCase() === "ip type")?.value ?? "") as IPType
  ];
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

            {ticket && (
              <TicketPanel
                contract={contract}
                tokenId={tokenId}
                quantity={myQuantity}
                ticket={ticket}
              />
            )}

            <AssetMarketplacePanel
              cheapest={cheapest}
              isOwner={isOwner}
              isSignedIn={!!isSignedIn}
              isProcessing={isProcessing}
              isERC1155
              myListing={myListing ?? null}
              activeBids={activeBids}
              walletAddress={walletAddress}
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
            />

            <AssetOwnersPanel balances={holders} maxVisible={8} />

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
        accentBorderClassName="border-teal-500/20"
        accentHeaderStyle="linear-gradient(135deg, hsl(173 80% 40% / 0.10), hsl(var(--brand-blue) / 0.08))"
        accentAvatarStyle="linear-gradient(135deg, hsl(173 80% 40% / 0.3), hsl(var(--brand-blue) / 0.3))"
        accentLabelClassName="text-teal-500"
        accentCountStyle={{ background: "rgb(13 148 136)" }}
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
