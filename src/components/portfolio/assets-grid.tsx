"use client";

import { useState } from "react";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import type { ApiToken } from "@medialane/sdk";

interface AssetsGridProps {
  address: string;
}

export function AssetsGrid({ address }: AssetsGridProps) {
  const { tokens, isLoading } = useTokensByOwner(address);
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const handleList = (token: ApiToken) => {
    setSelectedToken(token);
    setListOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold">No assets yet</p>
        <p className="text-muted-foreground text-sm mt-1">
          Create your first IP asset to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tokens.map((token) => (
          <TokenCard
            key={`${token.contractAddress}-${token.tokenId}`}
            token={token}
            isOwner
            onList={handleList}
          />
        ))}
      </div>

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
        />
      )}
    </>
  );
}
