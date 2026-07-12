"use client";

import { useState, useEffect } from "react";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { TokenCard } from "@/components/shared/token-card";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { CancelOrderDialog } from "@/components/marketplace/cancel-order-dialog";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { LoadMoreSentinel } from "@medialane/ui";
import { ImageIcon } from "lucide-react";
import type { ApiToken } from "@medialane/sdk";

interface AssetsGridProps {
  address: string | null;
  /** Compact mode (Overview): fetch only `limit` tokens, no pagination. */
  limit?: number;
  /** Override the grid columns (used by the narrower Overview column). */
  gridClassName?: string;
}

export function AssetsGrid({ address, limit, gridClassName }: AssetsGridProps) {
  const [page, setPage] = useState(1);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);

  const { tokens, meta, isLoading, error, mutate } = useTokensByOwner(address, page, limit ?? 20);

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
  const [cancelOpen, setCancelOpen] = useState(false);

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
    setCancelOpen(true);
  };

  // After a write op, reset to page 1 and let SWR refetch
  const handleSuccess = () => {
    setPage(1);
    setAllTokens([]);
    mutate();
  };

  // Use live SWR tokens on page 1 to avoid the empty-state flash while
  // the useEffect that populates `allTokens` hasn't run yet.
  const displayTokens = page === 1 ? tokens : allTokens;
  const hasMore = limit ? false : meta ? (meta.total ?? 0) > displayTokens.length : false;
  const gridCols =
    gridClassName ?? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";

  return (
    <>
      <EmptyOrError
        isLoading={isLoading && page === 1}
        error={error}
        isEmpty={displayTokens.length === 0 && !isLoading}
        onRetry={mutate}
        emptyTitle="No assets yet"
        emptyDescription="Mint your first asset to get started."
        emptyCta={{ label: "Create your first asset", href: "/create/asset" }}
        emptyIcon={<ImageIcon className="h-7 w-7 text-muted-foreground" />}
        skeletonNode={
          <div className={gridCols}>
            {Array.from({ length: limit ?? 10 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-muted animate-pulse">
                <div className="aspect-square w-full bg-muted-foreground/10" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <div className={gridCols}>
          {displayTokens.map((token) => (
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

        <LoadMoreSentinel
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={() => setPage((p) => p + 1)}
        />
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
          tokenImage={selectedToken.metadata?.image ?? null}
          tokenStandard={
            selectedToken.activeOrders?.some((o) => o.offer.itemType === "ERC1155")
              ? "ERC1155"
              : undefined
          }
          onSuccess={handleSuccess}
        />
      )}

      <CancelOrderDialog
        order={cancelToken?.activeOrders?.[0] ?? null}
        open={cancelOpen}
        onOpenChange={(v) => { setCancelOpen(v); if (!v) setCancelToken(null); }}
        onSuccess={handleSuccess}
        variant="listing"
        tokenName={cancelToken?.metadata?.name}
        tokenImage={cancelToken?.metadata?.image}
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
          tokenImage={transferToken.metadata?.image ?? null}
          hasActiveListing={!!transferToken.activeOrders?.[0]}
          tokenStandard={
            transferToken.activeOrders?.some((o) => o.offer.itemType === "ERC1155")
              ? "ERC1155"
              : undefined
          }
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
