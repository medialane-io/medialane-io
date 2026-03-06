"use client";

/**
 * useMarketplace — ChipiPay-powered marketplace operations via backend intent API.
 *
 * Write flow (listing / offer / fulfill / cancel):
 *  1. Create intent via backend → { id, typedData }
 *  2. Sign typedData with session/owner key (SNIP-12, client-side)
 *  3. Submit signature → backend returns fully-built calls array
 *  4. Execute calls via ChipiPay (gasless)
 *
 * The backend owns all SNIP-12 struct building, nonce fetching, calldata encoding,
 * and approve-call prepending. The frontend only signs and executes.
 */

import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useChipiTransaction } from "./use-chipi-transaction";
import { useSessionKey } from "./use-session-key";
import { useMedialaneClient } from "./use-medialane-client";
import { MARKETPLACE_CONTRACT } from "@/lib/constants";
import type { ChipiCall } from "./use-chipi-transaction";

// ─── Types ────────────────────────────────────────────────────────────────

export interface CreateListingInput {
  assetContract: string;
  tokenId: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;
}

export interface MakeOfferInput {
  assetContract: string;
  tokenId: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;
}

export interface FulfillOrderInput {
  orderHash: string;
  // Legacy fields — kept for call-site compatibility, no longer used internally
  considerationToken?: string;
  considerationAmount?: string;
  nftContract?: string;
  nftTokenId?: string;
}

export interface CancelOrderInput {
  orderHash: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useMarketplace() {
  const { executeTransaction, status, txHash, error: txError, reset } =
    useChipiTransaction();
  const {
    wallet,
    walletAddress,
    hasWallet,
    isLoadingWallet,
    hasActiveSession,
    isSettingUpSession,
    setupSession,
    signTypedData,
  } = useSessionKey();
  const client = useMedialaneClient();
  const { mutate } = useSWRConfig();

  /** Invalidate all order + token caches after a write operation. */
  const invalidate = useCallback(() => {
    mutate((key) => {
      if (typeof key !== "string") return false;
      return (
        key.includes('"op":"orders"') ||
        key.startsWith("order-") ||
        key.startsWith("listings-") ||
        key.startsWith("user-orders-") ||
        key.startsWith("token-") ||
        key.startsWith("tokens-owned-")
      );
    }, undefined, { revalidate: true });
  }, [mutate]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setHash(null);
    reset();
  }, [reset]);

  /** Execute pre-built calls via ChipiPay (gasless). */
  const execWithPin = useCallback(
    async (pin: string, calls: ChipiCall[]) => {
      const walletOverride = wallet
        ? { publicKey: wallet.publicKey, encryptedPrivateKey: wallet.encryptedPrivateKey }
        : undefined;
      const result = await executeTransaction({
        pin,
        contractAddress: calls[0]?.contractAddress ?? MARKETPLACE_CONTRACT,
        calls,
        wallet: walletOverride,
      });
      setHash(result.txHash);
      return result;
    },
    [executeTransaction, wallet]
  );

  /**
   * Shared intent flow:
   *  create intent → sign typedData → submit signature → execute returned calls
   */
  const runIntent = useCallback(
    async (
      pin: string,
      intentFn: () => Promise<{ data: { id: string; typedData: unknown; calls: unknown } }>,
      successMsg: string
    ): Promise<string | undefined> => {
      if (!walletAddress) throw new Error("Wallet not ready. Please wait a moment.");

      const intentRes = await intentFn();
      const { id, typedData } = intentRes.data;

      const sig = await signTypedData(typedData, pin);

      const signedRes = await client.api.submitIntentSignature(id, sig);
      const calls = signedRes.data.calls as ChipiCall[];
      if (!calls?.length) throw new Error("No calls returned from intent");

      const result = await execWithPin(pin, calls);
      toast.success(successMsg);
      invalidate();
      return result.txHash;
    },
    [walletAddress, signTypedData, client, execWithPin, invalidate]
  );

  // ── createListing ──────────────────────────────────────────────────────

  const createListing = useCallback(
    async (input: CreateListingInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const endTime = Math.floor(Date.now() / 1000) + input.durationSeconds;
        return await runIntent(
          input.pin,
          () => client.api.createListingIntent({
            offerer: walletAddress!,
            nftContract: input.assetContract,
            tokenId: input.tokenId,
            currency: input.currencySymbol,
            price: input.price,
            endTime,
          }),
          `Token #${input.tokenId} is now listed.`
        );
      } catch (err: any) {
        const msg = err?.message || "Failed to create listing";
        setError(msg);
        toast.error("Listing failed", { description: msg });
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

  // ── fulfillOrder (buy) ─────────────────────────────────────────────────

  const fulfillOrder = useCallback(
    async (input: FulfillOrderInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        return await runIntent(
          input.pin,
          () => client.api.createFulfillIntent({
            fulfiller: walletAddress!,
            orderHash: input.orderHash,
          }),
          "Purchase complete!"
        );
      } catch (err: any) {
        const msg = err?.message || "Purchase failed";
        setError(msg);
        toast.error("Purchase failed", { description: msg });
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

  // ── makeOffer ──────────────────────────────────────────────────────────

  const makeOffer = useCallback(
    async (input: MakeOfferInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const endTime = Math.floor(Date.now() / 1000) + input.durationSeconds;
        return await runIntent(
          input.pin,
          () => client.api.createOfferIntent({
            offerer: walletAddress!,
            nftContract: input.assetContract,
            tokenId: input.tokenId,
            currency: input.currencySymbol,
            price: input.price,
            endTime,
          }),
          `Offer on token #${input.tokenId} submitted.`
        );
      } catch (err: any) {
        const msg = err?.message || "Failed to submit offer";
        setError(msg);
        toast.error("Offer failed", { description: msg });
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

  // ── cancelOrder ────────────────────────────────────────────────────────

  const cancelOrder = useCallback(
    async (input: CancelOrderInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        return await runIntent(
          input.pin,
          () => client.api.createCancelIntent({
            offerer: walletAddress!,
            orderHash: input.orderHash,
          }),
          "Order cancelled."
        );
      } catch (err: any) {
        const msg = err?.message || "Cancellation failed";
        setError(msg);
        toast.error("Cancellation failed", { description: msg });
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

  return {
    createListing,
    makeOffer,
    fulfillOrder,
    cancelOrder,
    walletAddress,
    hasWallet,
    isLoadingWallet,
    hasActiveSession,
    isSettingUpSession,
    setupSession,
    isProcessing,
    txStatus: status,
    txHash: hash ?? txHash,
    error: error ?? txError,
    resetState,
  };
}
