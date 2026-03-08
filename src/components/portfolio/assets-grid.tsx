"use client";

import { useState } from "react";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { TokenCard, TokenCardSkeleton } from "@/components/shared/token-card";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import type { ApiToken } from "@medialane/sdk";

interface AssetsGridProps {
  address: string;
}

export function AssetsGrid({ address }: AssetsGridProps) {
  const { tokens, isLoading, mutate } = useTokensByOwner(address);
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleList = (token: ApiToken) => {
    setSelectedToken(token);
    setListOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
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
      <div className="py-16 text-center space-y-4">
        <p className="text-lg font-semibold">No assets yet</p>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          If you just minted something, it may take a few seconds to sync from the blockchain.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
          <Button size="sm" asChild>
            <Link href="/create/asset">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Mint asset
            </Link>
          </Button>
        </div>
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
