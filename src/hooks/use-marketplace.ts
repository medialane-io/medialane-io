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
import { MARKETPLACE_721_CONTRACT, MARKETPLACE_1155_CONTRACT, SUPPORTED_TOKENS, INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";
import type { ChipiCall } from "./use-chipi-transaction";

/** Resolve a currency symbol (e.g. "USDC") to its on-chain contract address.
 *  Returns the input unchanged if it already looks like an address. */
function resolveCurrencyAddress(symbolOrAddress: string): string {
  if (symbolOrAddress.startsWith("0x")) return symbolOrAddress;
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === symbolOrAddress.toUpperCase()
  );
  if (!token) throw new Error(`Unsupported currency: ${symbolOrAddress}`);
  return token.address;
}

/** Build a symbol→address map for all supported tokens. */
const SYMBOL_TO_ADDRESS: Record<string, string> = Object.fromEntries(
  SUPPORTED_TOKENS.map((t) => [t.symbol, t.address])
);

/**
 * Walk typed data recursively and replace any plain currency symbol strings
 * (e.g. "USDC") with their contract addresses. Fixes backends that embed the
 * symbol instead of the address in ContractAddress fields.
 */
function sanitizeTypedData(value: unknown): unknown {
  if (typeof value === "string") {
    const upper = value.toUpperCase();
    return SYMBOL_TO_ADDRESS[upper] ?? value;
  }
  if (Array.isArray(value)) return value.map(sanitizeTypedData);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        sanitizeTypedData(v),
      ])
    );
  }
  return value;
}

// ─── Types ────────────────────────────────────────────────────────────────

export interface CreateListingInput {
  assetContract: string;
  tokenId: string;
  tokenName?: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;
  /** Number of units to list. Required for ERC-1155, omit for ERC-721. */
  amount?: string;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

export interface MakeOfferInput {
  assetContract: string;
  tokenId: string;
  tokenName?: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

export interface FulfillOrderInput {
  orderHash: string;
  tokenStandard?: string;
  /** ERC-1155 only: units to purchase. Defaults to 1 if omitted. */
  quantity?: string;
  // Legacy fields — kept for call-site compatibility, no longer used internally
  considerationToken?: string;
  considerationAmount?: string;
  nftContract?: string;
  nftTokenId?: string;
}

export interface CancelOrderInput {
  orderHash: string;
  tokenStandard?: string;
}

export interface MakeCounterOfferInput {
  originalOrderHash: string;
  /** Raw wei price (not human-readable) */
  counterPriceRaw: string;
  /** Duration in seconds (3600–2592000) */
  durationSeconds: number;
  message?: string;
  tokenName?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useMarketplace() {
  const { executeTransaction, status, txHash, error: txError, reset } =
    useChipiTransaction();
  const {
    walletAddress,
    hasWallet,
    isLoadingWallet,
    hasActiveSession,
    isSettingUpSession,
    setupSession,
    signTypedData,
    maybeClearSessionForAmountCap,
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
        key.startsWith("tokens-owned-") ||
        key.startsWith("counter-offers-")
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

  /** Execute pre-built calls via ChipiPay (gasless).
   *  @param marketplaceContract — the marketplace contract address used for session key lookup.
   *  Defaults to the ERC-721 marketplace. Pass `MARKETPLACE_1155_CONTRACT` for ERC-1155 ops.
   */
  const execWithPin = useCallback(
    async (pin: string, calls: ChipiCall[], marketplaceContract: string = MARKETPLACE_721_CONTRACT) => {
      const result = await executeTransaction({
        pin,
        contractAddress: marketplaceContract,
        calls,
      });
      setHash(result.txHash);
      return result;
    },
    [executeTransaction]
  );

  /**
   * Poll GET /v1/intents/:id until the backend settles to CONFIRMED or FAILED,
   * or until the timeout is reached.
   */
  const pollIntentUntilTerminal = useCallback(
    async (id: string): Promise<"CONFIRMED" | "FAILED"> => {
      const MAX_ATTEMPTS = 10;
      const INTERVAL_MS = 3000;
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (i > 0) await new Promise<void>((r) => setTimeout(r, INTERVAL_MS));
        const res = await client.api.getIntent(id);
        const status = res.data.status;
        if (status === "CONFIRMED" || status === "FAILED") return status;
      }
      throw new Error(
        "Verification timed out. Check your wallet for the transaction status."
      );
    },
    [client]
  );

  /**
   * Shared intent flow:
   *  create intent → sign typedData → submit signature → execute via ChipiPay
   *  → POST txHash to backend → poll until CONFIRMED or FAILED
   */
  const runIntent = useCallback(
    async (
      pin: string,
      intentFn: () => Promise<{ data: { id: string; typedData: unknown; calls: unknown } }>,
      successMsg: string,
      marketplaceContract?: string
    ): Promise<string | undefined> => {
      if (!walletAddress) throw new Error("Wallet not ready. Please wait a moment.");

      const intentRes = await intentFn();
      const { id, typedData } = intentRes.data ?? {};
      if (!id || !typedData) throw new Error("Intent creation failed: no data returned");

      // Sanitize typed data: replace any bare currency symbols (e.g. "USDC")
      // with their contract addresses so starknet.js can convert them to BigInt.
      const sanitized = sanitizeTypedData(typedData);

      const sig = await signTypedData(sanitized, pin);

      const signedRes = await client.api.submitIntentSignature(id, sig);
      const calls = signedRes.data.calls as ChipiCall[];
      if (!calls?.length) throw new Error("No calls returned from intent");

      const result = await execWithPin(pin, calls, marketplaceContract);

      if (result.status === "reverted") {
        throw new Error(result.revertReason || "Transaction reverted on chain");
      }

      // Normalize: Starknet hashes are felt252 and may lack leading zeros — pad to 0x+64 chars
      const normalizedHash = "0x" + result.txHash.replace(/^0x/, "").padStart(64, "0");

      // Submit tx hash to backend — verifies receipt + marketplace events server-side
      await client.api.confirmIntent(id, normalizedHash);

      // Poll until backend reports terminal status (CONFIRMED or FAILED)
      const finalStatus = await pollIntentUntilTerminal(id);

      if (finalStatus === "FAILED") {
        throw new Error(
          "Transaction was submitted but the marketplace order could not be confirmed onchain. " +
          "The order may have already been filled or expired — please refresh and try again."
        );
      }

      toast.success(successMsg);
      invalidate();
      // Re-invalidate after indexer processes the block (~10s) to reflect chain state
      setTimeout(() => invalidate(), INDEXER_REVALIDATION_DELAY_MS);
      return result.txHash;
    },
    [walletAddress, signTypedData, client, execWithPin, invalidate, pollIntentUntilTerminal]
  );

  // ── createListing ──────────────────────────────────────────────────────

  const createListing = useCallback(
    async (input: CreateListingInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const endTime = Math.floor(Date.now() / 1000) + input.durationSeconds;
        const is1155 = input.tokenStandard === "ERC1155";
        return await runIntent(
          input.pin,
          () => client.api.createListingIntent({
            offerer: walletAddress!,
            nftContract: input.assetContract,
            tokenId: input.tokenId,
            currency: resolveCurrencyAddress(input.currencySymbol),
            price: input.price,
            endTime,
            ...(is1155 && input.amount ? { amount: input.amount } : {}),
          }),
          `${input.tokenName || `Token #${input.tokenId}`} listed for ${input.price} ${input.currencySymbol}`,
          is1155 ? MARKETPLACE_1155_CONTRACT : MARKETPLACE_721_CONTRACT
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create listing";
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
        const marketplaceContract = input.tokenStandard === "ERC1155"
          ? MARKETPLACE_1155_CONTRACT
          : MARKETPLACE_721_CONTRACT;
        return await runIntent(
          input.pin,
          () => client.api.createFulfillIntent({
            fulfiller: walletAddress!,
            orderHash: input.orderHash,
            tokenStandard: input.tokenStandard,
            quantity: input.quantity,
          }),
          "Purchase complete!",
          marketplaceContract
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Purchase failed";
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
        const marketplaceContract = input.tokenStandard === "ERC1155"
          ? MARKETPLACE_1155_CONTRACT
          : MARKETPLACE_721_CONTRACT;
        return await runIntent(
          input.pin,
          () => client.api.createOfferIntent({
            offerer: walletAddress!,
            nftContract: input.assetContract,
            tokenId: input.tokenId,
            currency: resolveCurrencyAddress(input.currencySymbol),
            price: input.price,
            endTime,
          }),
          `Offer submitted for ${input.tokenName || `Token #${input.tokenId}`}`,
          marketplaceContract
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to submit offer";
        setError(msg);
        toast.error("Offer failed", { description: msg });
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

  // ── makeCounterOffer ───────────────────────────────────────────────────

  const makeCounterOffer = useCallback(
    async (input: MakeCounterOfferInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        return await runIntent(
          input.pin,
          () => client.api.createCounterOfferIntent({
            sellerAddress: walletAddress!,
            originalOrderHash: input.originalOrderHash,
            durationSeconds: input.durationSeconds,
            counterPrice: input.counterPriceRaw,
            message: input.message,
          }),
          `Counter-offer sent${input.tokenName ? ` for ${input.tokenName}` : ""}!`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Counter-offer failed";
        setError(msg);
        toast.error("Counter-offer failed", { description: msg });
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent]
  );

  // ── cancelOrder ────────────────────────────────────────────────────────

  const cancelOrder = useCallback(
    async (input: CancelOrderInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const marketplaceContract = input.tokenStandard === "ERC1155"
          ? MARKETPLACE_1155_CONTRACT
          : MARKETPLACE_721_CONTRACT;
        return await runIntent(
          input.pin,
          () => client.api.createCancelIntent({
            offerer: walletAddress!,
            orderHash: input.orderHash,
            tokenStandard: input.tokenStandard,
          }),
          "Order cancelled.",
          marketplaceContract
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Cancellation failed";
        setError(msg);
        toast.error("Cancellation failed", { description: msg });
        // Invalidate after failure: the backend may have synced the order to CANCELLED
        // (e.g. the order was already cancelled on-chain but DB was stale). This ensures
        // the UI reflects the corrected state instead of continuing to show a stale listing.
        invalidate();
        setTimeout(() => invalidate(), INDEXER_REVALIDATION_DELAY_MS);
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client, invalidate]
  );

  return {
    createListing,
    makeOffer,
    makeCounterOffer,
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
    maybeClearSessionForAmountCap,
  };
}
