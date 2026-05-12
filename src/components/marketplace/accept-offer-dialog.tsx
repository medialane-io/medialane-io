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
import { AlertTriangle, HandCoins } from "lucide-react";
import { EXPLORER_URL } from "@/lib/constants";
import { ipfsToHttp, formatDisplayPrice } from "@/lib/utils";
import type { AcceptOfferHook } from "@/hooks/use-accept-offer";

interface AcceptOfferDialogProps {
  hook: AcceptOfferHook;
  /** Fallback token name shown when order.token is null */
  tokenName?: string;
  /** Fallback token image shown when order.token is null */
  tokenImage?: string | null;
}

export function AcceptOfferDialog({ hook, tokenName, tokenImage }: AcceptOfferDialogProps) {
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

          {isActivatingSession ? (
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
