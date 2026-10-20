"use client";

import { useCallback, useState } from "react";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { AcceptOfferDialog } from "@/components/marketplace/accept-offer-dialog";
import type { ApiOrder } from "@medialane/sdk";
import { useAcceptOffer, type AcceptOfferHook } from "@/hooks/use-accept-offer";
import type { AssetMarketActions, AssetMarketContext } from "@medialane/ui";
import { CancelListingDialog } from "./cancel-listing-dialog";
import { useOrderActions } from "./use-order-actions";

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
  cancelStep,
  cancelError,
  resetCancelStep,
  acceptOfferHook,
  onCancelListing,
}: AssetMarketplaceDialogsProps) {

  const handleSuccess = useCallback(() => {
    mutateListings();
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

export function useAssetMarketActions(context: AssetMarketContext): AssetMarketActions {
  const state = useAssetMarketplaceDialogState();
  const tokenStandard = context.tokenStandard === "UNKNOWN" ? undefined : context.tokenStandard;
  const orders = useOrderActions({ mutateListings: context.mutateListings, tokenStandard });
  const acceptOffer = useAcceptOffer({ mutateListings: context.mutateListings, tokenStandard, activeListings: context.activeListings });

  return {
    isProcessing: orders.isProcessing,
    buy: state.setPurchaseOrder,
    list: () => state.setListOpen(true),
    offer: () => state.setOfferOpen(true),
    transfer: () => state.setTransferOpen(true),
    cancel: orders.handleCancelClick,
    acceptBid: acceptOffer.handleAcceptClick,
    dialogs: (
      <AssetMarketplaceDialogs
        contract={context.contract}
        tokenId={context.tokenId}
        tokenName={context.tokenName}
        tokenImage={context.tokenImage}
        tokenStandard={context.tokenStandard}
        quantityOwned={context.quantityOwned != null ? Number(context.quantityOwned) : undefined}
        hasActiveListing={context.activeListings.length > 0}
        mutateListings={context.mutateListings}
        {...state}
        cancelStep={orders.cancelStep}
        cancelError={orders.cancelError}
        resetCancelStep={orders.resetCancelStep}
        acceptOfferHook={acceptOffer}
        onCancelListing={orders.handleCancelClick}
      />
    ),
  };
}
