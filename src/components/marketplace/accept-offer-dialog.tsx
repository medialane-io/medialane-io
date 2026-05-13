"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import {
  MarketplaceDialogHero,
  MarketplacePinStep,
  MarketplaceProcessingState,
  MarketplaceSuccessState,
  MarketplaceErrorState,
  MarketplaceActivatingSession,
} from "@/components/marketplace/marketplace-dialog-primitives";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, HandCoins, Tag, X } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import type { AcceptOfferHook } from "@/hooks/use-accept-offer";
import type { ApiOrder } from "@medialane/sdk";

interface AcceptOfferDialogProps {
  hook: AcceptOfferHook;
  /** Fallback token name shown when order.token is null */
  tokenName?: string;
  /** Fallback token image shown when order.token is null */
  tokenImage?: string | null;
  /** Called when user clicks "Cancel listing" on one of the blocking listings */
  onCancelListing?: (order: ApiOrder) => void;
}

export function AcceptOfferDialog({ hook, tokenName, tokenImage, onCancelListing }: AcceptOfferDialogProps) {
  const {
    isOpen,
    selectedOrder,
    buyerHasFunds,
    resultStep,
    txHash,
    error,
    passkeySupported,
    walletSetupOpen,
    setWalletSetupOpen,
    pin,
    setPin,
    pinError,
    isAuthenticatingPasskey,
    isActivatingSession,
    handlePin,
    handleUsePasskey,
    dismiss,
    setStep,
    warningOpen,
    activeListings,
    proceedFromWarning,
    dismissWarning,
  } = hook;

  const name =
    selectedOrder?.token?.name ?? tokenName ?? `Token #${selectedOrder?.nftTokenId ?? ""}`;
  const rawImage = selectedOrder?.token?.image ?? tokenImage ?? null;
  const image = rawImage ? ipfsToHttp(rawImage) : null;

  const priceLabel = selectedOrder
    ? `${formatDisplayPrice(selectedOrder.price.formatted)} ${selectedOrder.price.currency}`
    : "";

  const handleOpenChange = (v: boolean) => {
    if (!v && resultStep === "processing") return;
    if (!v) dismiss();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col max-h-[92svh]">
          <DialogTitle className="sr-only">Accept offer on {name}</DialogTitle>
          <DialogDescription className="sr-only">Accept offer for {name}.</DialogDescription>

          {warningOpen ? (
            <div className="flex flex-col p-5 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Active listing detected</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Accepting this offer will transfer the NFT, leaving{" "}
                    {activeListings.length === 1 ? "your listing" : `your ${activeListings.length} listings`}{" "}
                    unfulfillable. Cancel {activeListings.length === 1 ? "it" : "them"} first to keep the marketplace clean.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {activeListings.map((listing) => (
                  <div
                    key={listing.orderHash}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Listed for{" "}
                        <span className="font-medium text-foreground">
                          {formatDisplayPrice(listing.price.formatted)} {listing.price.currency}
                        </span>
                      </span>
                    </div>
                    {onCancelListing && (
                      <button
                        onClick={() => { onCancelListing(listing); dismissWarning(); }}
                        className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                        Cancel listing
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={dismissWarning}
                  className="flex-1 h-9 rounded-xl border border-border/50 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                >
                  Dismiss
                </button>
                <button
                  onClick={proceedFromWarning}
                  className="flex-1 h-9 rounded-xl bg-primary text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Accept anyway
                </button>
              </div>
            </div>
          ) : isActivatingSession ? (
            <MarketplaceActivatingSession />
          ) : resultStep === "processing" ? (
            <MarketplaceProcessingState
              title="Confirming on Starknet…"
              imageUrl={image}
              imageAlt={name}
            />
          ) : resultStep === "success" ? (
            <MarketplaceSuccessState
              tokenImage={image}
              name={name}
              title="It's sold!"
              description={
                <>
                  You accepted an offer of{" "}
                  <span className="font-semibold text-foreground">{priceLabel}</span> for{" "}
                  <span className="font-medium text-foreground">{name}</span>.
                </>
              }
              txHash={txHash}
              explorerUrl={EXPLORER_URL}
              onDone={dismiss}
            />
          ) : resultStep === "error" ? (
            <MarketplaceErrorState
              tokenImage={image}
              name={name}
              title="Offer acceptance failed"
              description="The transaction could not be completed. Your asset is still listed."
              error={error}
              txHash={txHash}
              explorerUrl={EXPLORER_URL}
              onRetry={() => setStep("pin")}
              onDone={dismiss}
            />
          ) : (
            /* PIN step */
            <>
              <MarketplaceDialogHero
                tokenImage={image}
                tokenName={name}
                tokenId={selectedOrder?.nftTokenId ?? ""}
                fallbackIcon={<HandCoins className="h-10 w-10 text-muted-foreground" />}
              />
              <MarketplacePinStep
                description={`Enter your PIN to accept ${priceLabel}.`}
                summary={
                  buyerHasFunds === false ? (
                    <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-xs">
                        Buyer may have insufficient {selectedOrder?.price.currency}. The offer stays
                        active if the payment fails.
                      </AlertDescription>
                    </Alert>
                  ) : null
                }
                pin={pin}
                onPinChange={setPin}
                pinError={pinError}
                secondaryLabel="Cancel"
                onSecondary={dismiss}
                primaryLabel="Accept offer"
                onPrimary={handlePin}
                passkeySupported={passkeySupported}
                isAuthenticatingPasskey={isAuthenticatingPasskey}
                onUsePasskey={handleUsePasskey}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {walletSetupOpen && (
        <WalletSetupDialog
          open={walletSetupOpen}
          onOpenChange={setWalletSetupOpen}
          onSuccess={() => {
            setWalletSetupOpen(false);
            setStep("pin");
          }}
        />
      )}
    </>
  );
}
