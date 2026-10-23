"use client";

import { ACCOUNT_STILL_LOADING } from "@/lib/account-gate";
import { UserFacingError, describeError } from "@medialane/ui";
import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { useWalletNativeSession } from "./use-wallet-native-session";
import { lockVenueSigner } from "@/lib/wallet/venue-signer";
import { assertTransactionSucceeded, syncTransactionBestEffort } from "@medialane/sdk/starknet";
import { getMedialaneClient } from "@/lib/medialane-client";
import { QUERY_PREFIX } from "@medialane/ui/utils/query-keys";
import type { Call } from "starknet";
import type { CreateTransferNftIntentParams } from "@medialane/sdk";

const verifyOnStarknet = async (txHash: string): Promise<void> => {
  await assertTransactionSucceeded(getMedialaneClient().provider, txHash);
};

const readIntoMedialane = async (txHash: string): Promise<void> => {
  await syncTransactionBestEffort(getMedialaneClient(), txHash);
};

type TransferIntentCreator = (params: CreateTransferNftIntentParams) => Promise<{ id: string; calls: Call[] }>;

const createTransferIntent: TransferIntentCreator = async (params) =>
  await getMedialaneClient().api.intents.create("transfer-nft", params) as { id: string; calls: Call[] };

export interface TransferInput {
  contractAddress: string;
  tokenId: string;
  toAddress: string;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

function isValidStarknetAddress(addr: string): boolean {
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(addr)) return false;
  const stripped = addr.replace(/^0x0*/, "");
  return stripped.length > 0;
}

export function useTransfer(
  verify: (txHash: string) => Promise<void> = verifyOnStarknet,
  waitUntilRead: (txHash: string) => Promise<void> = readIntoMedialane,
  createIntent: TransferIntentCreator = createTransferIntent,
) {
  const { address: walletAddress, hasWallet, signer } = useWalletNativeSession();
  const { mutate } = useSWRConfig();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const invalidate = useCallback(() => {
    mutate(
      (key) => {
        if (typeof key !== "string") return false;
        return key.startsWith(`${QUERY_PREFIX.tokensOwned}-`) || key.startsWith(`${QUERY_PREFIX.token}-`);
      },
      undefined,
      { revalidate: true }
    );
  }, [mutate]);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setHash(null);
  }, []);

  const transferToken = useCallback(
    async (input: TransferInput) => {
      setIsProcessing(true);
      setError(null);

      try {
        if (!walletAddress || !signer) throw new UserFacingError(ACCOUNT_STILL_LOADING);
        if (!isValidStarknetAddress(input.toAddress)) {
          throw new UserFacingError("Invalid recipient address.");
        }
        if (!isValidStarknetAddress(input.contractAddress)) {
          throw new UserFacingError("Invalid token contract address.");
        }
        if (!input.tokenStandard) {
          throw new UserFacingError("Token standard could not be determined. Please try again or contact support.");
        }
        const intent = await createIntent({
          owner: walletAddress,
          contractAddress: input.contractAddress,
          tokenId: input.tokenId,
          recipient: input.toAddress,
          tokenStandard: input.tokenStandard === "ERC1155" ? "ERC1155" : "ERC721",
        });
        const result = await signer.execute(intent.calls, { intentIds: [intent.id] });
        await verify(result.txHash);
        setHash(result.txHash);

        await waitUntilRead(result.txHash);
        invalidate();
        return result.txHash;
      } catch (err: unknown) {
        const msg = describeError(err, "Transfer failed").message;
        setError(msg);
        throw err;
      } finally {
        if (walletAddress) lockVenueSigner(walletAddress);
        setIsProcessing(false);
      }
    },
    [walletAddress, signer, invalidate, verify, waitUntilRead, createIntent]
  );

  return {
    transferToken,
    walletAddress,
    hasWallet,
    isProcessing,
    txHash: hash,
    error,
    resetState,
  };
}
