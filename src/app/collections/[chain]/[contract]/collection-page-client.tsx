"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { UserRoundCog } from "lucide-react";
import { CollectionPage, type CollectionMarketActions, type CollectionPageSlots } from "@medialane/ui";
import { Button } from "@medialane/ui/button";
import type { ApiOrder, ApiToken } from "@medialane/sdk";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { CollectionServiceAction } from "@/components/services/collection-service-action";
import { TransferCollectionOwnershipDialog } from "@/components/collection/transfer-ownership-dialog";
import { useGatedContent } from "@/hooks/use-gated-content";

function useCollectionMarketActions(): CollectionMarketActions {
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [token, setToken] = useState<ApiToken | null>(null);
  return {
    buy: setOrder,
    offer: setToken,
    dialogs: (
      <>
        {order ? <PurchaseDialog order={order} open onOpenChange={(open) => { if (!open) setOrder(null); }} /> : null}
        {token ? (
          <OfferDialog
            open
            onOpenChange={(open) => { if (!open) setToken(null); }}
            assetContract={token.contractAddress}
            tokenId={token.tokenId}
            tokenName={token.metadata?.name ?? undefined}
            tokenImage={token.metadata?.image ?? undefined}
            tokenStandard={token.standard ?? undefined}
          />
        ) : null}
      </>
    ),
  };
}

function TransferOwnership({ collectionId, currentOwner, collectionName }: { collectionId: string; currentOwner: string; collectionName: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <UserRoundCog className="h-4 w-4" />
        Transfer ownership
      </Button>
      <TransferCollectionOwnershipDialog collectionId={collectionId} currentOwner={currentOwner} collectionName={collectionName} open={open} onOpenChange={setOpen} />
    </>
  );
}

const SLOTS: CollectionPageSlots = {
  useMarketActions: useCollectionMarketActions,
  useGatedContent,
  ServiceAction: CollectionServiceAction,
  TransferOwnership,
};

export default function CollectionPageClient() {
  const { contract } = useParams<{ contract: string }>();
  return <CollectionPage contract={contract} slots={SLOTS} />;
}
