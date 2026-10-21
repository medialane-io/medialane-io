"use client";

import { useState } from "react";
import type { CollectionMarketActions } from "@medialane/ui";
import type { ApiOrder, ApiToken } from "@medialane/sdk";
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";

export function useMarketActions(): CollectionMarketActions {
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
