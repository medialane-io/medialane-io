"use client";

// Ticket asset page — the ip-tickets uiVariant. Same shape as the edition page
// with the token presented as a ticket: the on-chain validity window and supply
// from get_ticket, and a holder-facing "Your ticket" door panel driven by the
// on-chain is_valid check.

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { assetHref, collectionHref } from "@/lib/routes";
import { useToken, useTokenHistory } from "@/hooks/use-tokens";
import { useTokenListings } from "@/hooks/use-orders";
import { useCollection, useCollectionTokens } from "@/hooks/use-collections";
import { Button } from "@/components/ui/button";
import { PageContainer, AssetCollectionBar, AssetUtilityIcons, AssetMarketplacePanel, AssetHeaderBlock } from "@medialane/ui";
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

function TicketInfoPanel({ ticket }: { ticket: TicketOnchain }) {
  const status = ticketStatus(ticket);
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
    </div>
  );
}

function YourTicketPanel({
  contract,
  tokenId,
  quantity,
  ticket,
}: {
  contract: string;
  tokenId: string;
  quantity: number;
  ticket: TicketOnchain | null;
}) {
  const { walletAddress } = useSessionKey();
  const { valid, isLoading } = useTicketValidity(contract, tokenId, walletAddress ?? null);
  if (!walletAddress || quantity <= 0) return null;

  const status = ticket ? ticketStatus(ticket) : null;
  const invalidReason =
    status === "upcoming" ? "Not valid yet — the validity window hasn't opened." :
    status === "ended" ? "The validity window has ended." :
    "No valid ticket for this wallet.";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 space-y-2",
        valid ? "border-teal-500/40 bg-teal-500/5" : "border-border bg-card/60"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">Your ticket</p>
        <span className="text-xs text-muted-foreground tabular-nums">×{quantity}</span>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Checking on-chain…</p>
      ) : valid ? (
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Valid ticket — ready to present</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{invalidReason}</p>
      )}
    </div>
  );
}

// ── Ticket media — a stub-shaped card, not a full-bleed artwork square ───────
// Tickets aren't collectible art, so they don't get the generic
// AssetMediaColumn (unbounded-aspect image + edition-count tiles). A fixed
// aspect ratio keeps the image from ballooning to its native size, and the
// perforated divider + "Admit One" footer reads as a ticket at a glance.

function TicketMediaCard({
  shouldReduce,
  image,
  imageAlt,
  imgError,
  onImageError,
  totalMinted,
  maxSupply,
}: {
  shouldReduce: boolean;
  image: string | null;
  imageAlt: string;
  imgError: boolean;
  onImageError: () => void;
  totalMinted: number;
  maxSupply: number | null;
}) {
  return (
    <motion.div
      initial={shouldReduce ? false : { scale: 1.0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="lg:sticky lg:top-16"
    >
      <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-sm">
        <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-teal-500/15 to-teal-500/5">
          {image && !imgError ? (
            <Image
              src={image}
              alt={imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              onError={onImageError}
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Ticket className="h-16 w-16 text-teal-500/40" />
            </div>
          )}
        </div>

        <div className="relative h-6">
          <div className="absolute inset-y-0 left-0 w-6 -translate-x-1/2 rounded-full bg-background" />
          <div className="absolute inset-y-0 right-0 w-6 translate-x-1/2 rounded-full bg-background" />
          <div className="absolute inset-x-9 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-border" />
        </div>

        <div className="flex items-center justify-between px-5 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Admit One
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {totalMinted.toLocaleString()}{maxSupply != null ? ` of ${maxSupply.toLocaleString()}` : ""} minted
          </span>
        </div>
      </div>
    </motion.div>
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

  const totalMinted = ticket ? Number(ticket.minted) : holders.reduce((sum, b) => sum + Number(b.amount), 0);

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
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] lg:gap-10 gap-8 items-start">
          <TicketMediaCard
            shouldReduce={Boolean(shouldReduce)}
            image={image}
            imageAlt={name}
            imgError={imgError}
            onImageError={() => setImgError(true)}
            totalMinted={totalMinted}
            maxSupply={ticket ? Number(ticket.maxSupply) : null}
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

            {ticket && <TicketInfoPanel ticket={ticket} />}

            <YourTicketPanel
              contract={contract}
              tokenId={tokenId}
              quantity={myQuantity}
              ticket={ticket}
            />

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
