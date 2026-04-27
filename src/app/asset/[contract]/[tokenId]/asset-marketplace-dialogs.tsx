"use client";

import { useState } from "react";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { formatDisplayPrice } from "@/lib/utils";
import type { ApiOrder } from "@medialane/sdk";
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
  acceptPinOpen: boolean;
  handleAcceptPin: (pin: string) => Promise<void>;
  dismissAcceptPin: () => void;
  orderToAccept: ApiOrder | null;
  cancelStep: CancelStep;
  cancelError: string | null;
  resetCancelStep: () => void;
}

export function AssetMarketplaceDialogs({
  contract,
  tokenId,
  tokenName,
  tokenImage,
  tokenStandard,
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
  acceptPinOpen,
  handleAcceptPin,
  dismissAcceptPin,
  orderToAccept,
  cancelStep,
  cancelError,
  resetCancelStep,
}: AssetMarketplaceDialogsProps) {
  return (
    <>
      {purchaseOrder ? (
        <PurchaseDialog
          order={purchaseOrder}
          open
          onOpenChange={(open) => {
            if (!open) setPurchaseOrder(null);
          }}
          onSuccess={mutateListings}
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
        onSuccess={mutateListings}
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

      <PinDialog
        open={acceptPinOpen}
        onSubmit={handleAcceptPin}
        onCancel={dismissAcceptPin}
        title="Accept offer"
        description={orderToAccept
          ? `Accept ${formatDisplayPrice(orderToAccept.price.formatted)} ${orderToAccept.price.currency} for ${tokenName}?`
          : "Enter your PIN to accept this offer."}
      />

      <CancelListingDialog
        cancelStep={cancelStep}
        cancelError={cancelError}
        onReset={resetCancelStep}
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        contractAddress={contract}
        tokenId={tokenId}
        tokenName={tokenName}
        hasActiveListing={hasActiveListing}
        tokenStandard={tokenStandard}
        onSuccess={mutateListings}
      />
    </>
  );
}
