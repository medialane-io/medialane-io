"use client";

import { useState, useEffect } from "react";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { TokenCard } from "@/components/shared/token-card";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { useMarketplace } from "@/hooks/use-marketplace";
import type { ApiToken } from "@medialane/sdk";

interface AssetsGridProps {
  address: string | null;
}

export function AssetsGrid({ address }: AssetsGridProps) {
  const [page, setPage] = useState(1);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);

  const { tokens, meta, isLoading, error, mutate } = useTokensByOwner(address, page);
  const { cancelOrder } = useMarketplace();

  // Accumulate pages
  useEffect(() => {
    setAllTokens((prev) => (page === 1 ? tokens : [...prev, ...tokens]));
  }, [tokens, page]);

  // Reset when address changes
  useEffect(() => {
    setPage(1);
    setAllTokens([]);
  }, [address]);

  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [transferToken, setTransferToken] = useState<ApiToken | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [cancelToken, setCancelToken] = useState<ApiToken | null>(null);
  const [cancelPinOpen, setCancelPinOpen] = useState(false);

  const handleList = (token: ApiToken) => {
    setSelectedToken(token);
    setListOpen(true);
  };

  const handleTransfer = (token: ApiToken) => {
    setTransferToken(token);
    setTransferOpen(true);
  };

  const handleCancelRequest = (token: ApiToken) => {
    setCancelToken(token);
    setCancelPinOpen(true);
  };

  const handleCancelPin = async (pin: string) => {
    setCancelPinOpen(false);
    const orderHash = cancelToken?.activeOrders?.[0]?.orderHash;
    if (!orderHash) return;
    await cancelOrder({ orderHash, pin });
    setCancelToken(null);
    handleSuccess();
  };

  // After a write op, reset to page 1 and let SWR refetch
  const handleSuccess = () => {
    setPage(1);
    setAllTokens([]);
    mutate();
  };

  const hasMore = meta ? meta.total > allTokens.length : false;

  return (
    <>
      <EmptyOrError
        isLoading={isLoading && page === 1}
        error={error}
        isEmpty={allTokens.length === 0 && !isLoading}
        onRetry={mutate}
        emptyTitle="No assets yet"
        emptyDescription="Mint your first asset to get started."
        emptyCta={{ label: "Mint asset", href: "/create/asset" }}
        emptyIcon={<ImageIcon className="h-7 w-7 text-muted-foreground" />}
        skeletonCount={8}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {allTokens.map((token) => (
            <TokenCard
              key={`${token.contractAddress}-${token.tokenId}`}
              token={token}
              isOwner
              onList={handleList}
              onTransfer={handleTransfer}
              onCancel={handleCancelRequest}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Load more
            </Button>
          </div>
        )}
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
          onSuccess={handleSuccess}
        />
      )}

      <PinDialog
        open={cancelPinOpen}
        onSubmit={handleCancelPin}
        onCancel={() => { setCancelPinOpen(false); setCancelToken(null); }}
        title="Cancel listing"
        description={`Enter PIN to cancel the listing for ${cancelToken?.metadata?.name || `Token #${cancelToken?.tokenId}`}.`}
      />

      {transferToken && (
        <TransferDialog
          open={transferOpen}
          onOpenChange={(v) => {
            setTransferOpen(v);
            if (!v) setTransferToken(null);
          }}
          contractAddress={transferToken.contractAddress}
          tokenId={transferToken.tokenId}
          tokenName={transferToken.metadata?.name ?? undefined}
          hasActiveListing={!!transferToken.activeOrders?.[0]}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
