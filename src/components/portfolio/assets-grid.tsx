"use client";

import { useState, useEffect } from "react";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { TokenCard } from "@/components/shared/token-card";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { CancelOrderDialog } from "@/components/marketplace/cancel-order-dialog";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { LoadMoreSentinel } from "@medialane/ui";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { usdValueFor } from "@/lib/wallet-format";
import { ImageIcon } from "lucide-react";
import type { ApiToken } from "@medialane/sdk";

interface AssetsGridProps {
  address: string | null;

  limit?: number;

  gridClassName?: string;
}

export function AssetsGrid({ address, limit, gridClassName }: AssetsGridProps) {
  const [page, setPage] = useState(1);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);

  const { tokens, meta, isLoading, error, mutate } = useTokensByOwner(address, page, limit ?? 20);
  const usdPrices = useUsdPrices();

  useEffect(() => {
    setAllTokens((prev) => (page === 1 ? tokens : [...prev, ...tokens]));
  }, [tokens, page]);

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

  const handleSuccess = () => {
    setPage(1);
    setAllTokens([]);
    mutate();
  };

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
        emptyCta={{ label: "Create your first asset", href: "/launchpad/single-editions" }}
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
          {displayTokens.map((token) => {
            const listingOrder = token.activeOrders?.find((o) => o.offer.itemType === "ERC721" || o.offer.itemType === "ERC1155");
            return (
              <TokenCard
                key={`${token.contractAddress}-${token.tokenId}`}
                token={token}
                isOwner
                usdValue={usdValueFor(listingOrder?.price.formatted, listingOrder?.price.currency, usdPrices)}
                onList={handleList}
                onTransfer={handleTransfer}
                onCancel={handleCancelRequest}
              />
            );
          })}
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
