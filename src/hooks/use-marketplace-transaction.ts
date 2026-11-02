"use client";

import { useCallback } from "react";
import { useSWRConfig } from "swr";
import { useMedialaneClient, useTransaction, type TransactionPhase } from "@medialane/ui";
import { QUERY_PREFIX } from "@medialane/ui/utils/query-keys";
import type { MarketplaceContext } from "@/lib/marketplace-intents";

export function isBusyPhase(phase: TransactionPhase): boolean {
  return phase === "preparing" || phase === "submitting" || phase === "confirming";
}

/** Revalidates every cached order, listing and token query. */
function useInvalidateMarketplace(): () => void {
  const { mutate } = useSWRConfig();
  return useCallback(() => {
    mutate((key) => {
      if (typeof key !== "string") return false;
      return (
        key.includes(`"op":"${QUERY_PREFIX.orders}"`) ||
        key.startsWith(`${QUERY_PREFIX.order}-`) ||
        key.startsWith(`${QUERY_PREFIX.listings}-`) ||
        key.startsWith(`${QUERY_PREFIX.userOrders}-`) ||
        key.startsWith(`${QUERY_PREFIX.token}-`) ||
        key.startsWith(`${QUERY_PREFIX.tokensOwned}-`) ||
        key.startsWith(`${QUERY_PREFIX.counterOffers}-`)
      );
    });
  }, [mutate]);
}

type TransactionHook = () => Pick<ReturnType<typeof useTransaction>, "phase" | "txHash" | "error" | "retryable" | "run" | "reset">;

/** One marketplace write: status, receipt check, indexer sync and signer release come from useTransaction. */
export function useMarketplaceTransaction(useTx: TransactionHook = useTransaction) {
  const tx = useTx();
  const client = useMedialaneClient();
  const invalidate = useInvalidateMarketplace();
  const { run } = tx;

  const start = useCallback(
    async (work: (ctx: MarketplaceContext) => Promise<unknown>): Promise<boolean> => {
      const ok = await run(async (signer) => {
        await work({ client, signer });
      });
      invalidate();
      return ok;
    },
    [run, client, invalidate],
  );

  return {
    phase: tx.phase,
    busy: isBusyPhase(tx.phase),
    txHash: tx.txHash,
    error: tx.error,
    retryable: tx.retryable,
    /** The failure came after a transaction was sent; before that, nothing reached the chain. */
    failedAfterSubmit: tx.phase === "error" && tx.txHash !== null,
    start,
    reset: tx.reset,
  };
}
