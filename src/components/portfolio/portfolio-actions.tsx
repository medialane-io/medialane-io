"use client";

import { useState } from "react";
import { UserFacingError, type PortfolioAssetActions, type PortfolioOrderActions } from "@medialane/ui";
import type { ApiOrder, ApiToken } from "@medialane/sdk";
import Image from "next/image";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Button } from "@medialane/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@medialane/ui/dialog";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useAcceptOffer } from "@/hooks/use-accept-offer";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { AcceptOfferDialog } from "@/components/marketplace/accept-offer-dialog";
import { CancelOrderDialog } from "@/components/marketplace/cancel-order-dialog";
import { CounterOfferDialog } from "@/components/marketplace/counter-offer-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { EXPLORER_URL, SUPPORTED_TOKENS } from "@/lib/constants";
import { resolveImage, formatDisplayPrice } from "@/lib/utils";

type Context = { refresh: () => void };

function useCancelActions(variant: "listing" | "offer", { refresh }: Context): PortfolioOrderActions {
  const { isProcessing } = useMarketplace();
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
  return {
    isProcessing,
    cancel: setSelectedOrder,
    dialogs: (
      <CancelOrderDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(v) => { if (!v) setSelectedOrder(null); }}
        onSuccess={refresh}
        variant={variant}
      />
    ),
  };
}

export const useListingActions = (context: Context) => useCancelActions("listing", context);
export const useOfferActions = (context: Context) => useCancelActions("offer", context);

export function useReceivedOfferActions({ refresh }: Context): PortfolioOrderActions {
  const acceptOffer = useAcceptOffer({ mutateListings: refresh });
  const [counterOrder, setCounterOrder] = useState<ApiOrder | null>(null);
  const token = counterOrder ? SUPPORTED_TOKENS.find((t) => t.symbol === counterOrder.price.currency) : undefined;
  return {
    isProcessing: acceptOffer.status === "processing" || acceptOffer.status === "confirming",
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
  const { fulfillOrder, isProcessing } = useMarketplace();
  const action = useWalletWriteAction();
  const [selectedCounter, setSelectedCounter] = useState<ApiOrder | null>(null);
  const mutate = refresh;

  const resultStep = action.status;
  const resultTxHash = action.txHash;
  const resultError = action.error;

  const handleAccept = (counter: ApiOrder) => {
    setSelectedCounter(counter);
    void action.run(() => handleUnlocked(counter));
  };

  const handleUnlocked = async (counter: ApiOrder) => {

    const hash = await fulfillOrder({
      orderHash: counter.orderHash,
      tokenStandard: counter.consideration.itemType,
    });
    if (!hash) {
      mutate();

      throw new UserFacingError(
        "We couldn't complete the counter-offer accept. The transaction may have been rejected or the order may have expired. Please refresh and try again."
      );
    }
    mutate();
    return { txHash: hash };
  };

  const dismissResult = () => {

    if (action.status === "processing" || action.status === "confirming") return;
    action.reset();
    setSelectedCounter(null);
  };

  const counterDisplayName =
    selectedCounter?.token?.name || `#${selectedCounter?.nftTokenId ?? ""}`;
  const counterImage = resolveImage(selectedCounter?.token?.image);

  return {
    isProcessing,
    accept: handleAccept,
    dialogs: (
          <Dialog
            open={resultStep !== "idle"}
            onOpenChange={(v) => { if (!v) dismissResult(); }}
          >
            <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
              <DialogTitle className="sr-only">Counter-offer accept</DialogTitle>
              <DialogDescription className="sr-only">
                On-chain status for the counter-offer you accepted.
              </DialogDescription>

              <div className="flex flex-col items-center gap-3 pt-6 px-6">
                <div className="relative h-24 w-24 rounded-xl overflow-hidden border border-border bg-gradient-to-br from-muted to-muted-foreground/20">
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
                  {resultStep === "success" && (
                    <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                  )}
                </div>
                <p className="font-semibold text-base text-center truncate w-full">
                  {counterDisplayName}
                </p>
              </div>

              {resultStep === "processing" && (
                <div className="flex flex-col items-center gap-4 p-6 pt-3">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <div className="text-center space-y-1">
                    <p className="font-semibold">Confirming on Starknet…</p>
                    <p className="text-xs text-muted-foreground">
                      Please wait, do not close this window.
                    </p>
                  </div>
                </div>
              )}

              {resultStep === "success" && (
                <div className="flex flex-col items-center gap-4 p-6 pt-3">
                  <div className="text-center space-y-1">
                    <p className="font-bold text-lg flex items-center justify-center gap-1.5">
                      Counter-offer accepted
                      <Sparkles className="h-4 w-4 text-brand-orange" />
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The token is now yours.
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
                    Done
                  </Button>
                </div>
              )}

              {resultStep === "error" && (
                <div className="flex flex-col items-center gap-4 p-6 pt-3">
                  <div className="h-12 w-12 rounded-full bg-destructive/15 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-bold text-base">Accept failed</p>
                    <p className="text-sm text-muted-foreground">{resultError}</p>
                  </div>
                  <Button variant="outline" className="w-full h-11" onClick={dismissResult}>
                    Close
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
    ),
  };
}

export function useAssetActions({ refresh }: Context): PortfolioAssetActions {
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [transferToken, setTransferToken] = useState<ApiToken | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [cancelToken, setCancelToken] = useState<ApiToken | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const handleSuccess = refresh;

  return {
    list: (token) => { setSelectedToken(token); setListOpen(true); },
    transfer: (token) => { setTransferToken(token); setTransferOpen(true); },
    cancel: (token) => { setCancelToken(token); setCancelOpen(true); },
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
          order={cancelToken?.activeOrders?.[0] ?? null}
          open={cancelOpen}
          onOpenChange={(v) => { setCancelOpen(v); if (!v) setCancelToken(null); }}
          onSuccess={handleSuccess}
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
      </>
    ),
  };
}
