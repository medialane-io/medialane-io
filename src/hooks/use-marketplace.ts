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

import { useState, useCallback, useRef } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useChipiTransaction } from "./use-chipi-transaction";
import { useSessionKey } from "./use-session-key";
import { useMedialaneClient } from "./use-medialane-client";
import { MARKETPLACE_721_CONTRACT, MARKETPLACE_1155_CONTRACT, SUPPORTED_TOKENS, INDEXER_REVALIDATION_DELAY_MS } from "@/lib/constants";
import { getMarketplaceContractForStandard } from "@/lib/protocol/contracts";
import { isErc1155Standard } from "@/lib/protocol/token-standard";
import { QUERY_PREFIX, queryKeys } from "@/lib/query-keys";
import type { ChipiCall } from "./use-chipi-transaction";

declare global {
  interface Window {
    __MEDIALANE_MARKETPLACE_DEBUG__?: MarketplaceDebugSnapshot;
  }
}

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

export type MarketplaceDebugStep =
  | "idle"
  | "intent_created"
  | "typed_data_signed"
  | "signature_submitted"
  | "tx_executed"
  | "tx_confirm_sent"
  | "intent_confirmed"
  | "intent_failed"
  | "error";

export interface MarketplaceDebugSnapshot {
  operation: string;
  step: MarketplaceDebugStep;
  tokenStandard?: string;
  marketplaceContract?: string;
  assetContract?: string;
  tokenId?: string;
  orderHash?: string;
  amount?: string;
  quantity?: string;
  currency?: string;
  price?: string;
  intentId?: string;
  intentStatus?: string;
  txHash?: string;
  txStatus?: string;
  error?: string;
  calls?: Array<{ contractAddress?: string; entrypoint?: string; calldataLength?: number }>;
  terminalIntent?: {
    id?: string;
    type?: string;
    status?: string;
    txHash?: string | null;
    orderHash?: string | null;
    updatedAt?: string;
  };
  typedDataSummary?: {
    domain?: unknown;
    primaryType?: unknown;
    messageKeys?: string[];
    offerItemType?: unknown;
    considerationItemType?: unknown;
  };
  updatedAt: string;
}

type MarketplaceDebugContext = Omit<MarketplaceDebugSnapshot, "step" | "updatedAt">;
type MarketplaceDebugPatch = Partial<MarketplaceDebugContext> & { step: MarketplaceDebugStep };
type TerminalIntentResult = {
  status: "CONFIRMED" | "FAILED";
  intent: Record<string, unknown>;
};

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
        key.includes(`"op":"${QUERY_PREFIX.orders}"`) ||
        key.startsWith(`${QUERY_PREFIX.order}-`) ||
        key.startsWith(`${QUERY_PREFIX.listings}-`) ||
        key.startsWith(`${QUERY_PREFIX.userOrders}-`) ||
        key.startsWith(`${QUERY_PREFIX.token}-`) ||
        key.startsWith(`${QUERY_PREFIX.tokensOwned}-`) ||
        key.startsWith(`${QUERY_PREFIX.counterOffers}-`)
      );
    }, undefined, { revalidate: true });
  }, [mutate]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [debugSnapshot, setDebugSnapshot] = useState<MarketplaceDebugSnapshot | null>(null);
  const debugSnapshotRef = useRef<MarketplaceDebugSnapshot | null>(null);

  const updateDebug = useCallback((patch: MarketplaceDebugPatch) => {
    const next = {
      ...(debugSnapshotRef.current ?? {}),
      ...patch,
      updatedAt: new Date().toISOString(),
    } as MarketplaceDebugSnapshot;

    debugSnapshotRef.current = next;
    setDebugSnapshot(next);

    if (typeof window !== "undefined") {
      const log = patch.step === "error" || patch.step === "intent_failed"
        ? console.error
        : console.info;
      const json = JSON.stringify(next, null, 2);

      window.__MEDIALANE_MARKETPLACE_DEBUG__ = next;
      log("[Medialane marketplace debug]", next);
      log(`[Medialane marketplace debug JSON]\n${json}`);
    }
  }, []);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setHash(null);
    setDebugSnapshot(null);
    debugSnapshotRef.current = null;
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
      marketplaceContract?: string,
      debugContext?: MarketplaceDebugContext
    ): Promise<string | undefined> => {
      if (!walletAddress) throw new Error("Wallet not ready. Please wait a moment.");

      updateDebug({
        ...(debugContext ?? { operation: "marketplace" }),
        step: "idle",
        marketplaceContract,
      });
      const intentRes = await intentFn();
      const { id, typedData } = intentRes.data ?? {};
      if (!id || !typedData) throw new Error("Intent creation failed: no data returned");
      updateDebug({
        ...(debugContext ?? { operation: "marketplace" }),
        step: "intent_created",
        intentId: id,
        marketplaceContract,
        typedDataSummary: summarizeTypedData(typedData),
      });

      // Sanitize typed data: replace any bare currency symbols (e.g. "USDC")
      // with their contract addresses so starknet.js can convert them to BigInt.
      const sanitized = sanitizeTypedData(typedData);

      const sig = await signTypedData(sanitized, pin);
      updateDebug({ step: "typed_data_signed", typedDataSummary: summarizeTypedData(sanitized) });

      const signedRes = await client.api.submitIntentSignature(id, sig);
      const calls = signedRes.data.calls as ChipiCall[];
      if (!calls?.length) throw new Error("No calls returned from intent");
      updateDebug({ step: "signature_submitted", calls: summarizeCalls(calls) });

      const result = await execWithPin(pin, calls, marketplaceContract);
      updateDebug({ step: "tx_executed", txHash: result.txHash, txStatus: result.status });

      if (result.status === "reverted") {
        throw new Error(result.revertReason || "Transaction reverted on chain");
      }

      // Normalize: Starknet hashes are felt252 and may lack leading zeros — pad to 0x+64 chars
      const normalizedHash = "0x" + result.txHash.replace(/^0x/, "").padStart(64, "0");

      // Submit tx hash to backend — verifies receipt + marketplace events server-side
      await client.api.confirmIntent(id, normalizedHash);
      updateDebug({ step: "tx_confirm_sent", txHash: normalizedHash });

      // Poll until backend reports terminal status (CONFIRMED or FAILED)
      const terminal = await pollIntentUntilTerminal(id);
      const terminalIntent = summarizeTerminalIntent(terminal.intent);
      updateDebug({
        step: terminal.status === "CONFIRMED" ? "intent_confirmed" : "intent_failed",
        intentStatus: terminal.status,
        txHash: terminalIntent.txHash ?? normalizedHash,
        orderHash: terminalIntent.orderHash ?? undefined,
        terminalIntent,
      });

      if (terminal.status === "FAILED") {
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
    [walletAddress, signTypedData, client, execWithPin, invalidate, pollIntentUntilTerminal, updateDebug]
  );

  // ── createListing ──────────────────────────────────────────────────────

  const createListing = useCallback(
    async (input: CreateListingInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const endTime = Math.floor(Date.now() / 1000) + input.durationSeconds;
        const is1155 = isErc1155Standard(input.tokenStandard);
        const marketplaceContract = getMarketplaceContractForStandard(input.tokenStandard);
        return await runIntent(
          input.pin,
          () => client.api.createListingIntent({
            offerer: walletAddress!,
            nftContract: input.assetContract,
            tokenId: input.tokenId,
            currency: resolveCurrencyAddress(input.currencySymbol),
            price: input.price,
            endTime,
            ...(is1155 ? { amount: input.amount || "1" } : {}),
          }),
          `${input.tokenName || `Token #${input.tokenId}`} listed for ${input.price} ${input.currencySymbol}`,
          marketplaceContract,
          {
            operation: "create_listing",
            tokenStandard: toApiStandard(input.tokenStandard),
            marketplaceContract,
            assetContract: input.assetContract,
            tokenId: input.tokenId,
            amount: input.amount,
            currency: input.currencySymbol,
            price: input.price,
          }
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Failed to create listing");
        setError(msg);
        updateDebug({ step: "error", error: msg });
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
        const marketplaceContract = getMarketplaceContractForStandard(input.tokenStandard);
        return await runIntent(
          input.pin,
          () => client.api.createFulfillIntent({
            fulfiller: walletAddress!,
            orderHash: input.orderHash,
            tokenStandard: toApiStandard(input.tokenStandard),
            quantity: input.quantity,
          }),
          "Purchase complete!",
          marketplaceContract,
          {
            operation: "fulfill_order",
            tokenStandard: input.tokenStandard,
            marketplaceContract,
            orderHash: input.orderHash,
            quantity: input.quantity,
          }
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Purchase failed");
        setError(msg);
        updateDebug({ step: "error", error: msg });
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
        const marketplaceContract = getMarketplaceContractForStandard(input.tokenStandard);
        return await runIntent(
          input.pin,
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
          `Offer submitted for ${input.tokenName || `Token #${input.tokenId}`}`,
          marketplaceContract,
          {
            operation: "make_offer",
            tokenStandard: input.tokenStandard,
            marketplaceContract,
            assetContract: input.assetContract,
            tokenId: input.tokenId,
            currency: input.currencySymbol,
            price: input.price,
          }
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Failed to submit offer");
        setError(msg);
        updateDebug({ step: "error", error: msg });
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
          `Counter-offer sent${input.tokenName ? ` for ${input.tokenName}` : ""}!`,
          undefined,
          {
            operation: "counter_offer",
            orderHash: input.originalOrderHash,
            price: input.counterPriceRaw,
          }
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Counter-offer failed");
        setError(msg);
        updateDebug({ step: "error", error: msg });
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
        const marketplaceContract = getMarketplaceContractForStandard(input.tokenStandard);
        return await runIntent(
          input.pin,
          () => client.api.createCancelIntent({
            offerer: walletAddress!,
            orderHash: input.orderHash,
            tokenStandard: toApiStandard(input.tokenStandard),
          }),
          "Order cancelled.",
          marketplaceContract,
          {
            operation: "cancel_order",
            tokenStandard: input.tokenStandard,
            marketplaceContract,
            orderHash: input.orderHash,
          }
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Cancellation failed");
        setError(msg);
        updateDebug({ step: "error", error: msg });
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
    debugSnapshot,
    resetState,
    maybeClearSessionForAmountCap,
  };
}

function summarizeTypedData(typedData: unknown): MarketplaceDebugSnapshot["typedDataSummary"] {
  if (!typedData || typeof typedData !== "object") return undefined;
  const data = typedData as Record<string, any>;
  const message = data.message && typeof data.message === "object"
    ? data.message as Record<string, any>
    : undefined;
  return {
    domain: data.domain,
    primaryType: data.primaryType,
    messageKeys: message ? Object.keys(message) : undefined,
    offerItemType: message?.offer?.item_type,
    considerationItemType: message?.consideration?.item_type,
  };
}

function summarizeCalls(calls: ChipiCall[]): MarketplaceDebugSnapshot["calls"] {
  return calls.map((call) => ({
    contractAddress: call.contractAddress,
    entrypoint: call.entrypoint,
    calldataLength: Array.isArray(call.calldata) ? call.calldata.length : undefined,
  }));
}

function summarizeTerminalIntent(intent: Record<string, unknown>): NonNullable<MarketplaceDebugSnapshot["terminalIntent"]> {
  return {
    id: typeof intent.id === "string" ? intent.id : undefined,
    type: typeof intent.type === "string" ? intent.type : undefined,
    status: typeof intent.status === "string" ? intent.status : undefined,
    txHash: typeof intent.txHash === "string" || intent.txHash === null ? intent.txHash : undefined,
    orderHash: typeof intent.orderHash === "string" || intent.orderHash === null ? intent.orderHash : undefined,
    updatedAt: typeof intent.updatedAt === "string" ? intent.updatedAt : undefined,
  };
}
