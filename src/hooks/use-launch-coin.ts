"use client";

import { useState, useCallback } from "react";
import { rewardToast } from "@/lib/reward-toast";
import type { Call } from "starknet";
import { getTokenBySymbol, normalizeAddress } from "@medialane/sdk";
import {
  parseCreatorCoinCreated,
  coinToRaw as toRaw,
  teamCoinsRaw,
  buybackQuoteRaw,
  validatePrice,
  type CreatorCoinReceiptLike,
} from "@medialane/sdk/starknet";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { starknetProvider } from "@/lib/starknet";
import { friendlyErrorMessage } from "@/lib/friendly-error";

const API_BASE = "/api/proxy";

export interface LaunchCoinInput {
  name: string;
  symbol: string;
  supplyHuman: string;
  quoteSymbol: string;
  price: number;
  teamPct: number;
}

export type LaunchStatus = "idle" | "deploying" | "launching" | "indexing" | "done" | "error";

export function useLaunchCoin() {
  const client = useMedialaneClient();
  const [status, setStatus] = useState<LaunchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const launch = useCallback(
    async (input: LaunchCoinInput, signer: StarknetVenueSigner, owner: string): Promise<{ coinAddress: string; txHash: string }> => {
      setError(null);

      const quote = getTokenBySymbol(input.quoteSymbol);
      if (!quote) throw new Error(`Unsupported quote token: ${input.quoteSymbol}`);

      const priceError = validatePrice(quote.decimals, input.price);
      if (priceError) throw new Error(priceError);

      const supplyRaw = toRaw(BigInt(input.supplyHuman));
      const teamRaw = teamCoinsRaw(supplyRaw, input.teamPct);
      const buybackRaw = buybackQuoteRaw(teamRaw, input.price, quote.decimals);
      const ownerAddr = normalizeAddress("STARKNET", owner);

      try {

        setStatus("deploying");
        const createIntent = await client.api.createCoinIntent({
          owner: ownerAddr,
          name: input.name,
          symbol: input.symbol,
          initialSupply: supplyRaw.toString(),
        });
        if (createIntent.data.requiresSignature) throw new Error("Expected a prebuilt create-coin intent");
        const created = await signer.execute(createIntent.data.calls as Call[]);

        let receipt: CreatorCoinReceiptLike | null = null;
        for (let attempt = 0; attempt < 4 && !receipt; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 2500));
            receipt = (await starknetProvider.getTransactionReceipt(created.txHash)) as CreatorCoinReceiptLike;
          } catch {  }
        }
        if (!receipt) {
          throw new Error(
            "Coin deployed but the network is busy reading the receipt — your coin is safe; retry the launch step from your portfolio shortly."
          );
        }
        const coinAddress = parseCreatorCoinCreated(receipt);

        setStatus("launching");
        const launchIntent = await client.api.launchCoinIntent({
          owner: ownerAddr,
          creatorCoin: coinAddress,
          quoteToken: quote.address,
          price: input.price,
          initialHolders: input.teamPct > 0 ? [ownerAddr] : [],
          initialHoldersAmounts: input.teamPct > 0 ? [teamRaw.toString()] : [],
          transferRestrictionDelay: 0,
          quoteFundAmount: buybackRaw.toString(),
        });
        if (launchIntent.data.requiresSignature) throw new Error("Expected a prebuilt launch-coin intent");
        const launched = await signer.execute(launchIntent.data.calls as Call[]);

        setStatus("indexing");
        await fetch(`${API_BASE}/v1/coins/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coinAddress, owner: ownerAddr }),
        }).catch(() => {  });

        setStatus("done");
        rewardToast("launch_coin");
        return { coinAddress, txHash: launched.txHash };
      } catch (e) {
        setStatus("error");
        setError(friendlyErrorMessage(e, "Launch failed"));
        throw e;
      }
    },
    [client]
  );

  return { launch, status, error };
}
