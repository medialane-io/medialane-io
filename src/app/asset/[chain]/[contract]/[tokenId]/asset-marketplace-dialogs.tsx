"use client";

import { useCallback, useState } from "react";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { AcceptOfferDialog } from "@/components/marketplace/accept-offer-dialog";
import type { ApiOrder } from "@medialane/sdk";
import type { AcceptOfferHook } from "@/hooks/use-accept-offer";
import { CancelListingDialog } from "./cancel-listing-dialog";

type TokenStandard = "ERC721" | "ERC1155" | "UNKNOWN";
type CancelStep = "idle" | "processing" | "success" | "error";

export function useAssetMarketplaceDialogState() {
  const [purchaseOrder, setPurchaseOrder] = useState<ApiOrder | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  return {
    purchaseOrder,
    setPurchaseOrder,
    listOpen,
    setListOpen,
    offerOpen,
    setOfferOpen,
    transferOpen,
    setTransferOpen,
  };
}

interface AssetMarketplaceDialogsProps {
  contract: string;
  tokenId: string;
  tokenName: string;
  tokenImage?: string | null;
  tokenStandard: TokenStandard;
  quantityOwned?: number;
  hasActiveListing: boolean;
  mutateListings: () => void;
  purchaseOrder: ApiOrder | null;
  setPurchaseOrder: (order: ApiOrder | null) => void;
  listOpen: boolean;
  setListOpen: (open: boolean) => void;
  offerOpen: boolean;
  setOfferOpen: (open: boolean) => void;
  transferOpen: boolean;
  setTransferOpen: (open: boolean) => void;
  cancelPinOpen: boolean;
  handleCancelPin: (pin: string) => Promise<void>;
  dismissCancelPin: () => void;
  cancelStep: CancelStep;
  cancelError: string | null;
  resetCancelStep: () => void;
  acceptOfferHook: AcceptOfferHook;
  onCancelListing?: (order: ApiOrder) => void;
}

export function AssetMarketplaceDialogs({
  contract,
  tokenId,
  tokenName,
  tokenImage,
  tokenStandard,
  quantityOwned,
  hasActiveListing,
  mutateListings,
  purchaseOrder,
  setPurchaseOrder,
  listOpen,
  setListOpen,
  offerOpen,
  setOfferOpen,
  transferOpen,
  setTransferOpen,
  cancelPinOpen,
  handleCancelPin,
  dismissCancelPin,
  cancelStep,
  cancelError,
  resetCancelStep,
  acceptOfferHook,
  onCancelListing,
}: AssetMarketplaceDialogsProps) {
  // A dialog's on-chain tx confirming doesn't mean the backend has indexed
  // the resulting event yet (~6s poll cycle) — an immediate mutate() can
  // still return the pre-write list, leaving stale UI (e.g. "List on
  // Marketplace" after a listing actually went through) until the next
  // scheduled poll. One extra revalidation a few seconds later closes that
  // gap without waiting for the full poll interval. Same pattern as
  // useMarketplace()'s own "stale order sync".
  const handleSuccess = useCallback(() => {
    mutateListings();
    setTimeout(mutateListings, 8000);
  }, [mutateListings]);

  return (
    <>
      {purchaseOrder ? (
        <PurchaseDialog
          order={purchaseOrder}
          open
          onOpenChange={(open) => {
            if (!open) setPurchaseOrder(null);
          }}
          onSuccess={handleSuccess}
        />
      ) : null}

      <ListingDialog
        open={listOpen}
        onOpenChange={setListOpen}
        assetContract={contract}
        tokenId={tokenId}
        tokenName={tokenName}
        tokenStandard={tokenStandard}
        tokenImage={tokenImage}
        quantityOwned={quantityOwned}
        onSuccess={handleSuccess}
      />

      <OfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        assetContract={contract}
        tokenId={tokenId}
        tokenName={tokenName}
        tokenImage={tokenImage ?? undefined}
        tokenStandard={tokenStandard}
      />

      <PinDialog
        open={cancelPinOpen}
        onSubmit={handleCancelPin}
        onCancel={dismissCancelPin}
        title="Cancel listing"
        description={`Enter your PIN to cancel the listing for ${tokenName}.`}
      />

      <CancelListingDialog
        cancelStep={cancelStep}
        cancelError={cancelError}
        tokenName={tokenName}
        tokenImage={tokenImage}
        onReset={resetCancelStep}
      />

      <AcceptOfferDialog
        hook={acceptOfferHook}
        tokenName={tokenName}
        tokenImage={tokenImage}
        onCancelListing={onCancelListing}
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        contractAddress={contract}
        tokenId={tokenId}
        tokenName={tokenName}
        tokenImage={tokenImage}
        hasActiveListing={hasActiveListing}
        tokenStandard={tokenStandard}
        onSuccess={handleSuccess}
      />
    </>
  );
}
