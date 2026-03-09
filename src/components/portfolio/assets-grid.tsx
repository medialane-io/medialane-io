"use client";

import { useState } from "react";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { TokenCard } from "@/components/shared/token-card";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { ImageIcon } from "lucide-react";
import type { ApiToken } from "@medialane/sdk";

interface AssetsGridProps {
  address: string;
}

export function AssetsGrid({ address }: AssetsGridProps) {
  const { tokens, isLoading, error, mutate } = useTokensByOwner(address);
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const handleList = (token: ApiToken) => {
    setSelectedToken(token);
    setListOpen(true);
  };

  return (
    <>
      <EmptyOrError
        isLoading={isLoading}
        error={error}
        isEmpty={tokens.length === 0}
        onRetry={mutate}
        emptyTitle="No assets yet"
        emptyDescription="Mint your first asset to get started."
        emptyCta={{ label: "Mint asset", href: "/create/asset" }}
        emptyIcon={<ImageIcon className="h-7 w-7 text-muted-foreground" />}
        skeletonCount={8}
      >
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
      </EmptyOrError>

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
