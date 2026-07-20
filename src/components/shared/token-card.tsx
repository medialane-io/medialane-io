"use client";

import { useState } from "react";
import { TokenCard as UiTokenCard, TokenCardSkeleton, type TokenCardProps } from "@medialane/ui";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { ReportDialog } from "@/components/report-dialog";

export function TokenCard(props: Omit<TokenCardProps, "onOffer" | "onReport"> & {
  onOffer?: TokenCardProps["onOffer"];
}) {
  const [offerOpen, setOfferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const { token, onOffer } = props;

  return (
    <>
      <UiTokenCard
        {...props}
        onOffer={onOffer ?? (() => setOfferOpen(true))}
        onReport={() => setReportOpen(true)}
      />
      {offerOpen && (
        <OfferDialog
          open={offerOpen}
          onOpenChange={setOfferOpen}
          assetContract={token.contractAddress}
          tokenId={token.tokenId}
          tokenName={token.metadata?.name ?? undefined}
          tokenImage={token.metadata?.image ?? undefined}
          tokenStandard={token.standard ?? undefined}
        />
      )}
      {reportOpen && (
        <ReportDialog
          target={{
            type: "TOKEN",
            contract: token.contractAddress,
            tokenId: token.tokenId,
            name: token.metadata?.name ?? undefined,
          }}
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      )}
    </>
  );
}

export { TokenCardSkeleton };
