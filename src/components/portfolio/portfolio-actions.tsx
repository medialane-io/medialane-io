"use client";

import { useState } from "react";
import type { PortfolioAssetActions, PortfolioOrderActions } from "@medialane/ui";
import type { ApiOrder, ApiToken } from "@medialane/sdk";
import Image from "next/image";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { MarketplaceDialog } from "@/components/marketplace/dialog-frame";
import { useCancelOrder } from "@/hooks/use-cancel-order";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { fulfillOrder } from "@/lib/marketplace-intents";
import { useAcceptOffer } from "@/hooks/use-accept-offer";
import { AcceptOfferDialog } from "@/components/marketplace/accept-offer-dialog";
import { CancelOrderDialog } from "@/components/marketplace/cancel-order-dialog";
import { CounterOfferDialog } from "@/components/marketplace/counter-offer-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { EXPLORER_URL, SUPPORTED_TOKENS } from "@/lib/constants";
import { ArchiveAssetDialog, formatDisplayPrice } from "@medialane/ui";
import { resolveImage } from "@/lib/utils";
import { useT } from "@medialane/ui/i18n";

type Context = { refresh: () => void };

function useCancelActions(variant: "listing" | "offer", { refresh }: Context): PortfolioOrderActions {
  const cancel = useCancelOrder({ onSuccess: refresh });
  return {
    isProcessing: cancel.busy,
    cancel: cancel.select,
    dialogs: <CancelOrderDialog hook={cancel} variant={variant} />,
  };
}

export const useListingActions = (context: Context) => useCancelActions("listing", context);
export const useOfferActions = (context: Context) => useCancelActions("offer", context);

export function useReceivedOfferActions({ refresh }: Context): PortfolioOrderActions {
  const acceptOffer = useAcceptOffer({ mutateListings: refresh });
  const [counterOrder, setCounterOrder] = useState<ApiOrder | null>(null);
  const token = counterOrder ? SUPPORTED_TOKENS.find((t) => t.symbol === counterOrder.price.currency) : undefined;
  return {
    isProcessing: acceptOffer.busy,
    accept: (order) => acceptOffer.handleAcceptClick(order),
    counter: setCounterOrder,
    dialogs: (
      <>
        <AcceptOfferDialog hook={acceptOffer} />
        {counterOrder && (
          <CounterOfferDialog
            open={!!counterOrder}
            onOpenChange={(v) => { if (!v) setCounterOrder(null); }}
            originalOrderHash={counterOrder.orderHash}
            tokenName={counterOrder.token?.name ?? undefined}
            tokenImage={resolveImage(counterOrder.token?.image)}
            tokenId={counterOrder.nftTokenId ?? undefined}
            currentBid={`${formatDisplayPrice(counterOrder.price.formatted)} ${counterOrder.price.currency}`}
            currencySymbol={counterOrder.price.currency ?? ""}
            currencyDecimals={token?.decimals ?? 18}
          />
        )}
      </>
    ),
  };
}

export function useCounterOfferActions({ refresh }: Context): PortfolioOrderActions {
  const t = useT();
  const tx = useMarketplaceTransaction();
  const [selectedCounter, setSelectedCounter] = useState<ApiOrder | null>(null);

  const resultTxHash = tx.txHash;
  const resultError = tx.error;

  const handleAccept = (counter: ApiOrder) => {
    setSelectedCounter(counter);
    void tx.start((ctx) => fulfillOrder(ctx, {
      orderHash: counter.orderHash,
      tokenStandard: counter.consideration.itemType,
    })).then(() => refresh());
  };

  const dismissResult = () => {
    if (tx.busy) return;
    tx.reset();
    setSelectedCounter(null);
  };

  const counterDisplayName =
    selectedCounter?.token?.name || `#${selectedCounter?.nftTokenId ?? ""}`;
  const counterImage = resolveImage(selectedCounter?.token?.image);

  return {
    isProcessing: tx.busy,
    accept: handleAccept,
    dialogs: (
          <MarketplaceDialog
            open={tx.phase !== "idle"}
            onOpenChange={(v) => { if (!v) dismissResult(); }}
            title={t("Counter-offer accept")}
            description={t("On-chain status for the counter-offer you accepted.")}
          >
            <div className="flex flex-col items-center gap-3 pt-6 px-6">
              <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-border bg-muted">
                {counterImage && (
                  <Image
                    src={counterImage}
                    alt={counterDisplayName}
                    fill
                    unoptimized
                    sizes="96px"
                    className="object-cover"
                  />
                )}
                {tx.phase === "success" && (
                  <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                )}
              </div>
              <p className="font-semibold text-base text-center truncate w-full">
                {counterDisplayName}
              </p>
            </div>

            {tx.busy && (
              <div className="flex flex-col items-center gap-4 p-6 pt-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="font-semibold">{t("Confirming onchain…")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Keep this window open until it finishes.")}
                  </p>
                </div>
              </div>
            )}

            {tx.phase === "success" && (
              <div className="flex flex-col items-center gap-4 p-6 pt-3">
                <div className="text-center space-y-1">
                  <p className="font-bold text-lg flex items-center justify-center gap-1.5">
                    {t("Counter-offer accepted")}
                    <Sparkles className="h-4 w-4 text-brand-orange" />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("The token is now yours.")}
                  </p>
                </div>
                {resultTxHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${resultTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors tabular-nums"
                  >
                    {resultTxHash.slice(0, 10)}…{resultTxHash.slice(-8)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Button className="w-full h-11" onClick={dismissResult}>
                  {t("Done")}
                </Button>
              </div>
            )}

            {tx.phase === "error" && (
              <div className="flex flex-col items-center gap-4 p-6 pt-3">
                <div className="h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-base">{t("Accept failed")}</p>
                  <p className="text-sm text-muted-foreground">{resultError}</p>
                </div>
                <Button variant="soft" className="w-full h-11" onClick={dismissResult}>
                  {t("Close")}
                </Button>
              </div>
            )}
          </MarketplaceDialog>
    ),
  };
}

export function useAssetActions({ refresh }: Context): PortfolioAssetActions {
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [transferToken, setTransferToken] = useState<ApiToken | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [archiveToken, setArchiveToken] = useState<ApiToken | null>(null);
  const [cancelToken, setCancelToken] = useState<ApiToken | null>(null);
  const cancelListing = useCancelOrder({ onSuccess: refresh });
  const handleSuccess = refresh;

  return {
    list: (token) => { setSelectedToken(token); setListOpen(true); },
    transfer: (token) => { setTransferToken(token); setTransferOpen(true); },
    archive: setArchiveToken,
    cancel: (token) => {
      const listing = token.activeOrders?.[0];
      if (!listing) return;
      setCancelToken(token);
      cancelListing.select(listing);
    },
    dialogs: (
      <>
        {selectedToken && (
          <ListingDialog
            open={listOpen}
            onOpenChange={(v) => {
              setListOpen(v);
              if (!v) setSelectedToken(null);
            }}
            assetContract={selectedToken.contractAddress}
            tokenId={selectedToken.tokenId}
            tokenName={selectedToken.metadata?.name ?? undefined}
            tokenImage={selectedToken.metadata?.image ?? null}
            tokenStandard={
              selectedToken.activeOrders?.some((o) => o.offer.itemType === "ERC1155")
                ? "ERC1155"
                : undefined
            }
            onSuccess={handleSuccess}
          />
        )}

        <CancelOrderDialog
          hook={cancelListing}
          variant="listing"
          tokenName={cancelToken?.metadata?.name}
          tokenImage={cancelToken?.metadata?.image}
        />

        {transferToken && (
          <TransferDialog
            open={transferOpen}
            onOpenChange={(v) => {
              setTransferOpen(v);
              if (!v) setTransferToken(null);
            }}
            contractAddress={transferToken.contractAddress}
            tokenId={transferToken.tokenId}
            tokenName={transferToken.metadata?.name ?? undefined}
            tokenImage={transferToken.metadata?.image ?? null}
            hasActiveListing={!!transferToken.activeOrders?.[0]}
            tokenStandard={
              transferToken.activeOrders?.some((o) => o.offer.itemType === "ERC1155")
                ? "ERC1155"
                : undefined
            }
            onSuccess={handleSuccess}
          />
        )}
        {archiveToken && (
          <ArchiveAssetDialog
            open
            onOpenChange={(open) => { if (!open) setArchiveToken(null); }}
            contractAddress={archiveToken.contractAddress}
            tokenId={archiveToken.tokenId}
            tokenName={archiveToken.metadata?.name ?? undefined}
            tokenImage={archiveToken.metadata?.image ?? null}
            hasActiveListing={!!archiveToken.activeOrders?.[0]}
            onSuccess={handleSuccess}
          />
        )}
      </>
    ),
  };
}
