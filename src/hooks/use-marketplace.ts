"use client";

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
import { friendlyErrorMessage } from "@/lib/friendly-error";

function resolveCurrencyAddress(symbolOrAddress: string): string {
  if (symbolOrAddress.startsWith("0x")) return symbolOrAddress;
  const token = SUPPORTED_TOKENS.find(
    (t) => t.symbol === symbolOrAddress.toUpperCase()
  );
  if (!token) throw new Error(`Unsupported currency: ${symbolOrAddress}`);
  return token.address;
}

const SYMBOL_TO_ADDRESS: Record<string, string> = Object.fromEntries(
  SUPPORTED_TOKENS.map((t) => [t.symbol, t.address])
);

function toApiStandard(standard?: string): "ERC721" | "ERC1155" | undefined {
  if (standard === "ERC1155") return "ERC1155";
  if (standard === "ERC721") return "ERC721";
  return undefined;
}

function toFriendlyError(err: unknown, fallback: string): string {
  const raw = friendlyErrorMessage(err, fallback);
  if (/invalid body|400|bad request/i.test(raw)) {
    return "Something went wrong processing your request. Please try again, or contact Medialane support if the issue persists.";
  }
  return raw;
}

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

export interface CreateListingInput {
  assetContract: string;
  tokenId: string;
  tokenName?: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;

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

  quantity?: string;
}

export interface FulfillOrderInput {
  orderHash: string;
  tokenStandard?: string;

  quantity?: string;

  feeToken?: string;
  feeGrossAmount?: bigint;

  swapCalls?: Call[];

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

  counterPriceRaw: string;

  durationSeconds: number;
  message?: string;
  tokenName?: string;
}

type TerminalIntentResult = {
  status: "CONFIRMED" | "FAILED";
  intent: Record<string, unknown>;
};

export function useMarketplace() {
  const { address: walletAddress, hasWallet, signer } = useWalletNativeSession();
  const client = useMedialaneClient();
  const { mutate } = useSWRConfig();

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

  const runIntent = useCallback(
    async (
      intentFn: () => Promise<{ data: ApiIntentCreated }>,
      extra?: { prependCalls?: Call[]; appendCalls?: Call[] },
    ): Promise<string | undefined> => {
      if (!walletAddress || !signer) throw new Error("Account not ready. Please wait a moment.");

      const intent = (await intentFn()).data;
      if (!intent?.id) throw new Error("Intent creation failed: no data returned");

      let calls: Call[];
      if (intent.requiresSignature) {

        const sanitized = sanitizeTypedData(intent.typedData) as TypedData;
        const sig = await signer.signTypedData(sanitized);
        const signedRes = await client.api.submitIntentSignature(intent.id, sig);
        calls = signedRes.data.calls as Call[];
      } else {
        calls = intent.calls as Call[];
      }
      if (!calls?.length) throw new Error("No calls returned from intent");

      if (extra?.prependCalls?.length) calls = [...extra.prependCalls, ...calls];
      if (extra?.appendCalls?.length) calls = [...calls, ...extra.appendCalls];

      const result = await signer.execute(calls);
      setHash(result.txHash);

      const normalizedHash = "0x" + result.txHash.replace(/^0x/, "").padStart(64, "0");

      await client.api.confirmIntent(intent.id, normalizedHash);

      const terminal = await pollIntentUntilTerminal(intent.id);

      if (terminal.status === "FAILED") {
        throw new Error(
          "Transaction was submitted but the marketplace order could not be confirmed onchain. " +
          "The order may have already been filled or expired — please refresh and try again."
        );
      }

      invalidate();

      setTimeout(() => invalidate(), INDEXER_REVALIDATION_DELAY_MS);
      return result.txHash;
    },
    [walletAddress, signer, client, invalidate, pollIntentUntilTerminal]
  );

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

      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

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
          { prependCalls: input.swapCalls, appendCalls: extraCalls },
        );
      } catch (err: unknown) {
        const msg = toFriendlyError(err, "Purchase failed");
        setError(msg);

      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

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

      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, runIntent, client]
  );

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

      } finally {
        setIsProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- client.api identity isn't stable across renders; would invalidate this callback every render
    [walletAddress, runIntent]
  );

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
