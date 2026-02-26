"use client";

/**
 * useMarketplace — ChipiPay-powered marketplace operations.
 *
 * Write flow:
 *  1. useSessionKey provides walletAddress + signTypedData (SNIP-12 signing via session/owner key)
 *  2. Build SNIP-12 typed data (via SDK builders)
 *  3. Sign with session key Account (starknet.js, client-side)
 *  4. Encode signature into calldata + execute via ChipiPay (gasless)
 */

import { useState, useCallback } from "react";
import { cairo, shortString, constants, RpcProvider } from "starknet";
import { toast } from "sonner";
import {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
  stringifyBigInts,
  SUPPORTED_TOKENS,
} from "@medialane/sdk";
import { useChipiTransaction } from "./use-chipi-transaction";
import { useSessionKey } from "./use-session-key";
import { MARKETPLACE_CONTRACT, STARKNET_RPC_URL } from "@/lib/constants";
import { normalizeAddress } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────

export interface CreateListingInput {
  assetContract: string;
  tokenId: string;
  price: string; // human-readable, e.g. "10.5"
  currencySymbol: string;
  durationSeconds: number;
  offererAddress: string;
}

export interface MakeOfferInput {
  assetContract: string;
  tokenId: string;
  price: string;
  currencySymbol: string;
  durationSeconds: number;
  offererAddress: string;
}

export interface FulfillOrderInput {
  orderHash: string;
  fulfillerAddress: string;
  considerationToken: string;
  considerationAmount: string;
  nftContract: string;
  nftTokenId: string;
}

export interface CancelOrderInput {
  orderHash: string;
  offererAddress: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });

/** Read the marketplace nonce for an address (used in SNIP-12 typed data) */
async function getMarketplaceNonce(offerer: string): Promise<string> {
  try {
    const result = await provider.callContract({
      contractAddress: MARKETPLACE_CONTRACT,
      entrypoint: "nonces",
      calldata: [offerer],
    });
    return BigInt(result[0]).toString();
  } catch {
    return "0";
  }
}

function buildOrderParams(
  input: CreateListingInput | MakeOfferInput,
  nonce: string,
  isSellOrder: boolean
) {
  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 300;
  const endTime = now + input.durationSeconds;
  const salt = Math.floor(Math.random() * 1000000).toString();

  const token = SUPPORTED_TOKENS.find((t) => t.symbol === input.currencySymbol);
  if (!token) throw new Error(`Unsupported currency: ${input.currencySymbol}`);

  const decimals = token.decimals;
  const priceWei = BigInt(Math.round(parseFloat(input.price) * 10 ** decimals)).toString();

  return {
    offerer: normalizeAddress(input.offererAddress),
    offer: {
      item_type: isSellOrder ? "ERC721" : "ERC20",
      token: isSellOrder ? normalizeAddress(input.assetContract) : normalizeAddress(token.address),
      identifier_or_criteria: isSellOrder ? input.tokenId : "0",
      start_amount: isSellOrder ? "1" : priceWei,
      end_amount: isSellOrder ? "1" : priceWei,
    },
    consideration: {
      item_type: isSellOrder ? "ERC20" : "ERC721",
      token: isSellOrder ? normalizeAddress(token.address) : normalizeAddress(input.assetContract),
      identifier_or_criteria: isSellOrder ? "0" : input.tokenId,
      start_amount: isSellOrder ? priceWei : "1",
      end_amount: isSellOrder ? priceWei : "1",
      recipient: normalizeAddress(input.offererAddress),
    },
    start_time: startTime.toString(),
    end_time: endTime.toString(),
    salt,
    nonce,
  };
}

function encodeOrderCalldata(
  orderParams: ReturnType<typeof buildOrderParams>,
  sigArray: string[]
): string[] {
  const { offer, consideration } = orderParams;
  return [
    normalizeAddress(orderParams.offerer),
    shortString.encodeShortString(offer.item_type),
    normalizeAddress(offer.token),
    offer.identifier_or_criteria,
    offer.start_amount,
    offer.end_amount,
    shortString.encodeShortString(consideration.item_type),
    normalizeAddress(consideration.token),
    consideration.identifier_or_criteria,
    consideration.start_amount,
    consideration.end_amount,
    normalizeAddress(consideration.recipient),
    orderParams.start_time,
    orderParams.end_time,
    orderParams.salt,
    orderParams.nonce,
    sigArray.length.toString(),
    ...sigArray,
  ];
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useMarketplace() {
  const { executeTransaction, status, txHash, error: txError, reset } =
    useChipiTransaction();
  const { wallet, walletAddress, hasWallet, isLoadingWallet, signTypedData } =
    useSessionKey();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setHash(null);
    reset();
  }, [reset]);

  /**
   * Execute a pre-built calls array via ChipiPay (gasless).
   * Passes the wallet from ChipiPay API so callAnyContractAsync has the correct keys.
   */
  const execWithPin = useCallback(
    async (pin: string, calls: Parameters<typeof executeTransaction>[0]["calls"]) => {
      const walletOverride =
        wallet
          ? { publicKey: wallet.publicKey, encryptedPrivateKey: wallet.encryptedPrivateKey }
          : undefined;

      const result = await executeTransaction({
        pin,
        contractAddress: MARKETPLACE_CONTRACT,
        calls,
        wallet: walletOverride,
      });
      setHash(result.txHash);
      return result;
    },
    [executeTransaction, wallet]
  );

  // ── createListing ──────────────────────────────────────────────────────

  const createListing = useCallback(
    async (input: CreateListingInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const nonce = await getMarketplaceNonce(normalizeAddress(input.offererAddress));
        const orderParams = buildOrderParams(input, nonce, true);
        const typedData = buildOrderTypedData(
          stringifyBigInts(orderParams),
          constants.StarknetChainId.SN_MAIN
        );

        const sig = await signTypedData(typedData, input.pin);

        const tokenIdU256 = cairo.uint256(input.tokenId);
        const approveCall = {
          contractAddress: normalizeAddress(input.assetContract),
          entrypoint: "approve",
          calldata: [
            MARKETPLACE_CONTRACT,
            tokenIdU256.low.toString(),
            tokenIdU256.high.toString(),
          ],
        };

        const registerCall = {
          contractAddress: MARKETPLACE_CONTRACT,
          entrypoint: "register_order",
          calldata: encodeOrderCalldata(orderParams, sig),
        };

        const result = await execWithPin(input.pin, [approveCall, registerCall]);
        toast.success("Listing created!", { description: `Token #${input.tokenId} is now live.` });
        return result.txHash;
      } catch (err: any) {
        const msg = err?.message || "Failed to create listing";
        setError(msg);
        toast.error("Listing failed", { description: msg });
        return undefined;
      } finally {
        setIsProcessing(false);
      }
    },
    [execWithPin, signTypedData]
  );

  // ── fulfillOrder (buy) ─────────────────────────────────────────────────

  const fulfillOrder = useCallback(
    async (input: FulfillOrderInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const nonce = await getMarketplaceNonce(normalizeAddress(input.fulfillerAddress));
        const fulfillmentParams = {
          order_hash: input.orderHash,
          fulfiller: normalizeAddress(input.fulfillerAddress),
          nonce,
        };
        const typedData = buildFulfillmentTypedData(
          stringifyBigInts(fulfillmentParams),
          constants.StarknetChainId.SN_MAIN
        );

        const sig = await signTypedData(typedData, input.pin);

        const amountU256 = cairo.uint256(BigInt(input.considerationAmount).toString());
        const approveCall = {
          contractAddress: normalizeAddress(input.considerationToken),
          entrypoint: "approve",
          calldata: [
            MARKETPLACE_CONTRACT,
            amountU256.low.toString(),
            amountU256.high.toString(),
          ],
        };

        const fulfillCall = {
          contractAddress: MARKETPLACE_CONTRACT,
          entrypoint: "fulfill_order",
          calldata: [
            input.orderHash,
            normalizeAddress(input.fulfillerAddress),
            nonce,
            sig.length.toString(),
            ...sig,
          ],
        };

        const result = await execWithPin(input.pin, [approveCall, fulfillCall]);
        toast.success("Purchase complete!", { description: `Token #${input.nftTokenId} is yours.` });
        return result.txHash;
      } catch (err: any) {
        const msg = err?.message || "Purchase failed";
        setError(msg);
        toast.error("Purchase failed", { description: msg });
        return undefined;
      } finally {
        setIsProcessing(false);
      }
    },
    [execWithPin, signTypedData]
  );

  // ── cancelOrder ────────────────────────────────────────────────────────

  const cancelOrder = useCallback(
    async (input: CancelOrderInput & { pin: string }) => {
      setIsProcessing(true);
      setError(null);
      try {
        const nonce = await getMarketplaceNonce(normalizeAddress(input.offererAddress));
        const cancelParams = {
          order_hash: input.orderHash,
          offerer: normalizeAddress(input.offererAddress),
          nonce,
        };
        const typedData = buildCancellationTypedData(
          stringifyBigInts(cancelParams),
          constants.StarknetChainId.SN_MAIN
        );

        const sig = await signTypedData(typedData, input.pin);

        const cancelCall = {
          contractAddress: MARKETPLACE_CONTRACT,
          entrypoint: "cancel_order",
          calldata: [
            input.orderHash,
            normalizeAddress(input.offererAddress),
            nonce,
            sig.length.toString(),
            ...sig,
          ],
        };

        const result = await execWithPin(input.pin, [cancelCall]);
        toast.success("Order cancelled.");
        return result.txHash;
      } catch (err: any) {
        const msg = err?.message || "Cancellation failed";
        setError(msg);
        toast.error("Cancellation failed", { description: msg });
        return undefined;
      } finally {
        setIsProcessing(false);
      }
    },
    [execWithPin, signTypedData]
  );

  return {
    createListing,
    fulfillOrder,
    cancelOrder,
    /** Starknet contract address of the user's ChipiPay wallet */
    walletAddress,
    /** Whether the user has a ChipiPay wallet */
    hasWallet,
    /** Whether wallet is still loading from ChipiPay API */
    isLoadingWallet,
    isProcessing,
    txStatus: status,
    txHash: hash ?? txHash,
    error: error ?? txError,
    resetState,
  };
}
