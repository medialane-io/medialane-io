"use client";

/**
 * useMarketplace — wallet-native marketplace operations via backend intent API.
 *
 * Write flow (listing / offer / fulfill / cancel):
 *  1. Create intent via backend → { id, typedData } or { id, calls }
 *  2. If requiresSignature: sign typedData (SNIP-12, client-side), submit
 *     signature → backend returns fully-built calls array
 *  3. Execute calls via the wallet's own atomic multicall (signer.execute)
 *
 * The backend owns all SNIP-12 struct building, nonce fetching, calldata
 * encoding, and approve-call prepending. The frontend only signs and executes.
 */

import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { useWalletNativeSession } from "./use-wallet-native-session";
import { useMedialaneClient } from "./use-medialane-client";
import { SUPPORTED_TOKENS, INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";
import { isErc1155Standard } from "@/lib/protocol/token-standard";
import { QUERY_PREFIX } from "@/lib/query-keys";
import { buildFeeCall } from "@medialane/sdk/starknet";
import { ioFeeConfig } from "@/lib/fee";
import type { Call, TypedData } from "starknet";
import type { ApiIntentCreated } from "@medialane/sdk";

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

/** Strip "UNKNOWN" before sending to the backend — the API only accepts "ERC721" | "ERC1155" | undefined. */
function toApiStandard(standard?: string): "ERC721" | "ERC1155" | undefined {
  if (standard === "ERC1155") return "ERC1155";
  if (standard === "ERC721") return "ERC721";
  return undefined;
}

/** Map technical backend errors to a user-friendly support message. */
function toFriendlyError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : fallback;
  if (/invalid body|400|bad request/i.test(raw)) {
    return "Something went wrong processing your request. Please try again, or contact Medialane support if the issue persists.";
  }
  return raw;
}

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
  /** ERC-1155 only: number of units to offer on. Defaults to "1". */
  quantity?: string;
}

export interface FulfillOrderInput {
  orderHash: string;
  tokenStandard?: string;
  /** ERC-1155 only: units to purchase. Defaults to 1 if omitted. */
  quantity?: string;
  /** Platform fee token + gross amount — bundled into the same atomic
   *  multicall as the fulfill call, when the fee config permits it. */
  feeToken?: string;
  feeGrossAmount?: bigint;
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

type TerminalIntentResult = {
  status: "CONFIRMED" | "FAILED";
  intent: Record<string, unknown>;
};

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useMarketplace() {
  const { address: walletAddress, hasWallet, signer } = useWalletNativeSession();
  const client = useMedialaneClient();
  const { mutate } = useSWRConfig();

  /** Invalidate all order + token caches after a write operation. */
  const invalidate = useCallback(() => {
    // Revalidate matching keys WITHOUT clearing cached data. Passing `undefined`
    // as mutate's data arg wiped the token cache to undefined mid-purchase,
    // which unmounted the asset page's variant component (it gates rendering on
    // token data being present) and destroyed the open success dialog.
    // mutate(filter) alone = stale-while-revalidate: data stays until the
    // refetch resolves, so the page never unmounts.
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setHash(null);
  }, []);

  /**
   * Poll GET /v1/intents/:id until the backend settles to CONFIRMED or FAILED,
   * or until the timeout is reached.
   */
  const pollIntentUntilTerminal = useCallback(
    async (id: string): Promise<TerminalIntentResult> => {
      const MAX_ATTEMPTS = 10;
      const INTERVAL_MS = 3000;
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (i > 0) await new Promise<void>((r) => setTimeout(r, INTERVAL_MS));
        const res = await client.api.getIntent(id);
        const intent = res.data as unknown as Record<string, unknown>;
        const status = intent.status;
        if (status === "CONFIRMED" || status === "FAILED") {
          return { status, intent };
        }
      }
      throw new Error(
        "Verification timed out. Check your account for the transaction status."
      );
    },
    [client]
  );

  /**
   * Shared intent flow:
   *  create intent → sign typedData (if required) → submit signature →
   *  execute via the wallet's own multicall → confirm → poll until terminal
   */
  const runIntent = useCallback(
    async (
      intentFn: () => Promise<{ data: ApiIntentCreated }>,
      extraCalls?: Call[],
    ): Promise<string | undefined> => {
      if (!walletAddress || !signer) throw new Error("Account not ready. Please wait a moment.");

      const intent = (await intentFn()).data;
      if (!intent?.id) throw new Error("Intent creation failed: no data returned");

      // Resolve the executable calls — the only part that differs by intent kind.
      // The SDK's discriminated union enforces the right field per branch:
      //  • requiresSignature → sign the SNIP-12 typedData, then the backend injects
      //    the signature and returns the executable calls (listing/offer/cancel/counter).
      //  • else → calls are prebuilt server-side (fulfil/mint/create-collection);
      //    the caller IS the fulfiller, so there is no signature step.
      let calls: Call[];
      if (intent.requiresSignature) {
        // Sanitize typed data: replace any bare currency symbols (e.g. "USDC")
        // with their contract addresses so starknet.js can convert them to BigInt.
        const sanitized = sanitizeTypedData(intent.typedData) as TypedData;
        const sig = await signer.signTypedData(sanitized);
        const signedRes = await client.api.submitIntentSignature(intent.id, sig);
        calls = signedRes.data.calls as Call[];
      } else {
        calls = intent.calls as Call[];
      }
      if (!calls?.length) throw new Error("No calls returned from intent");

      // Bundle any extra calls (e.g. the platform fee) into the SAME atomic
      // multicall — no separate fire-and-forget transaction.
      if (extraCalls?.length) calls = [...calls, ...extraCalls];

      // Execute — identical tail for every intent kind.
      const result = await signer.execute(calls);
      setHash(result.txHash);

      // Normalize: Starknet hashes are felt252 and may lack leading zeros — pad to 0x+64 chars
      const normalizedHash = "0x" + result.txHash.replace(/^0x/, "").padStart(64, "0");

      // Submit tx hash to backend — verifies receipt + marketplace events server-side
      await client.api.confirmIntent(intent.id, normalizedHash);

      // Poll until backend reports terminal status (CONFIRMED or FAILED)
      const terminal = await pollIntentUntilTerminal(intent.id);

      if (terminal.status === "FAILED") {
        throw new Error(
          "Transaction was submitted but the marketplace order could not be confirmed onchain. " +
          "The order may have already been filled or expired — please refresh and try again."
        );
      }

      invalidate();
      // Re-invalidate after indexer processes the block (~10s) to reflect chain state
      setTimeout(() => invalidate(), INDEXER_REVALIDATION_DELAY_MS);
      return result.txHash;
    },
    [walletAddress, signer, client, invalidate, pollIntentUntilTerminal]
  );

  // ── createListing ──────────────────────────────────────────────────────

  const createListing = useCallback(
    async (input: CreateListingInput) => {
      setIsProcessing(true);
      setError(null);
      try {
        const endTime = Math.floor(Date.now() / 1000) + input.durationSeconds;
        const is1155 = isErc1155Standard(input.tokenStandard);
        return await runIntent(
          () => client.api.createListingIntent({
            offerer: walletAddress!,
            nftContract: input.assetContract,
            tokenId: input.tokenId,
            currency: resolveCurrencyAddress(input.currencySymbol),
            price: input.price,
            endTime,
            ...(is1155 ? { amount: input.amount || "1" } : {}),
          }),
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Failed to create listing");
        setError(msg);
        // error is shown inline in listing-dialog's Alert — no toast needed
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

  // ── fulfillOrder (buy) ─────────────────────────────────────────────────

  const fulfillOrder = useCallback(
    async (input: FulfillOrderInput) => {
      setIsProcessing(true);
      setError(null);
      try {
        const extraCalls: Call[] = [];
        if (input.feeToken && input.feeGrossAmount != null) {
          const feeCall = buildFeeCall(
            { surface: "marketplace", token: input.feeToken, grossAmount: input.feeGrossAmount },
            ioFeeConfig,
          );
          if (feeCall) {
            extraCalls.push({
              contractAddress: feeCall.contractAddress,
              entrypoint: feeCall.entrypoint,
              calldata: feeCall.calldata as string[],
            });
          }
        }
        return await runIntent(
          () => client.api.createFulfillIntent({
            fulfiller: walletAddress!,
            orderHash: input.orderHash,
            tokenStandard: toApiStandard(input.tokenStandard),
            quantity: input.quantity,
          }),
          extraCalls,
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Purchase failed");
        setError(msg);
        // error is shown inline in purchase-dialog's Alert — no toast needed
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

  // ── makeOffer ──────────────────────────────────────────────────────────

  const makeOffer = useCallback(
    async (input: MakeOfferInput) => {
      setIsProcessing(true);
      setError(null);
      try {
        const endTime = Math.floor(Date.now() / 1000) + input.durationSeconds;
        return await runIntent(
          () => client.api.createOfferIntent({
            offerer: walletAddress!,
            nftContract: input.assetContract,
            tokenId: input.tokenId,
            currency: resolveCurrencyAddress(input.currencySymbol),
            price: input.price,
            endTime,
            tokenStandard: toApiStandard(input.tokenStandard),
            quantity: isErc1155Standard(input.tokenStandard) ? (input.quantity || "1") : undefined,
          }),
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Failed to submit offer");
        setError(msg);
        // error is shown inline in offer-dialog's Alert — no toast needed
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

  // ── makeCounterOffer ───────────────────────────────────────────────────

  const makeCounterOffer = useCallback(
    async (input: MakeCounterOfferInput) => {
      setIsProcessing(true);
      setError(null);
      try {
        return await runIntent(
          () => client.api.createCounterOfferIntent({
            sellerAddress: walletAddress!,
            originalOrderHash: input.originalOrderHash,
            durationSeconds: input.durationSeconds,
            priceRaw: input.counterPriceRaw,
            message: input.message,
          }),
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Counter-offer failed");
        setError(msg);
        // error is surfaced via setError — dialogs read the error state directly
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent]
  );

  // ── cancelOrder ────────────────────────────────────────────────────────

  const cancelOrder = useCallback(
    async (input: CancelOrderInput) => {
      setIsProcessing(true);
      setError(null);
      try {
        return await runIntent(
          () => client.api.createCancelIntent({
            offerer: walletAddress!,
            orderHash: input.orderHash,
            tokenStandard: toApiStandard(input.tokenStandard),
          }),
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Cancellation failed");
        setError(msg);
        // error is shown in CancelListingDialog's error state — no toast needed
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
    isProcessing,
    txHash: hash,
    error,
    resetState,
  };
}
