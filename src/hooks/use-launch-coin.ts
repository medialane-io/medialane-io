"use client";

/**
 * useLaunchCoin (io) — Creator Coin launch through the ChipiPay atomic
 * chokepoint. Two sponsored transactions, one PIN entry:
 *
 *   1. `create_creator_coin` (via the metered `createCoinIntent` backend
 *      call) → read the coin address from the receipt (SDK `parseCreatorCoinCreated`).
 *   2. quote `transfer` (buyback pre-fund) + `launch_on_ekubo` multicall
 *      (via the metered `launchCoinIntent` backend call).
 *   3. `POST /v1/coins/sync` for instant indexing (50s factory poll backstop).
 *
 * Calldata comes from the backend's intents API — same builders the SDK used
 * to expose client-side (`buildCreateCreatorCoinCall`/`buildLaunchOnEkuboCalls`),
 * now behind `/v1/intents/create-coin` and `/v1/intents/launch-coin` so the
 * deploy + launch are metered like every other collection creation.
 */

import { useState, useCallback } from "react";
import { rewardToast } from "@/lib/reward-toast";
import type { Call } from "starknet";
import { getTokenBySymbol, normalizeAddress } from "@medialane/sdk";
import {
  parseCreatorCoinCreated,
  coinToRaw as toRaw,
  teamCoinsRaw,
  buybackQuoteRaw,
  type CreatorCoinReceiptLike,
} from "@medialane/sdk/starknet";
import { useChipiTransaction, type ChipiCall } from "@/hooks/use-chipi-transaction";
import { useMedialaneClient } from "@/hooks/use-medialane-client";
import { starknetProvider } from "@/lib/starknet";

const API_BASE = "/api/proxy";

export interface LaunchCoinInput {
  name: string;
  symbol: string;
  supplyHuman: string; // validated whole-number string
  quoteSymbol: "STRK" | "ETH";
  teamPct: number; // 0–10
}

export type LaunchStatus = "idle" | "deploying" | "launching" | "indexing" | "done" | "error";

function toChipiCall(c: Call): ChipiCall {
  return {
    contractAddress: c.contractAddress,
    entrypoint: c.entrypoint,
    calldata: ((c.calldata ?? []) as unknown[]).map(String),
  };
}

export function useLaunchCoin() {
  const { executeTransaction } = useChipiTransaction();
  const client = useMedialaneClient();
  const [status, setStatus] = useState<LaunchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const launch = useCallback(
    async (input: LaunchCoinInput, pin: string, owner: string): Promise<{ coinAddress: string }> => {
      setError(null);

      const quote = getTokenBySymbol(input.quoteSymbol);
      if (!quote) throw new Error(`Unsupported quote token: ${input.quoteSymbol}`);

      const supplyRaw = toRaw(BigInt(input.supplyHuman));
      const teamRaw = teamCoinsRaw(supplyRaw, input.teamPct);
      const buybackRaw = buybackQuoteRaw(teamRaw, quote.decimals);
      const ownerAddr = normalizeAddress("STARKNET", owner);

      try {
        // Tx1 — deploy the coin (full supply to the Factory). Metered through
        // the intents API — no client-side calldata construction.
        setStatus("deploying");
        const createIntent = await client.api.createCoinIntent({
          owner: ownerAddr,
          name: input.name,
          symbol: input.symbol,
          initialSupply: supplyRaw.toString(),
        });
        if (createIntent.data.requiresSignature) throw new Error("Expected a prebuilt create-coin intent");
        const created = await executeTransaction({
          pin,
          calls: (createIntent.data.calls as Call[]).map(toChipiCall),
        });
        if (created.status !== "confirmed") {
          throw new Error(created.revertReason ?? "Coin deploy reverted");
        }

        // The receipt is REQUIRED here (Tx2 needs the coin address) — retry the
        // read a few times before failing with an actionable message.
        let receipt: CreatorCoinReceiptLike | null = null;
        for (let attempt = 0; attempt < 4 && !receipt; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 2500));
            receipt = (await starknetProvider.getTransactionReceipt(created.txHash)) as CreatorCoinReceiptLike;
          } catch { /* retry */ }
        }
        if (!receipt) {
          throw new Error(
            "Coin deployed but the network is busy reading the receipt — your coin is safe; retry the launch step from your portfolio shortly."
          );
        }
        const coinAddress = parseCreatorCoinCreated(receipt);

        // Tx2 — launch on Ekubo at the fixed validated price; buyback pre-funded
        // in the same atomic multicall. Anti-snipe off (delay 0) in v1. Metered
        // through the intents API — the backend defaults the Ekubo pool params
        // to the same validated constant the SDK builder used to apply client-side.
        setStatus("launching");
        const launchIntent = await client.api.launchCoinIntent({
          owner: ownerAddr,
          creatorCoin: coinAddress,
          quoteToken: quote.address,
          initialHolders: input.teamPct > 0 ? [ownerAddr] : [],
          initialHoldersAmounts: input.teamPct > 0 ? [teamRaw.toString()] : [],
          transferRestrictionDelay: 0,
          quoteFundAmount: buybackRaw.toString(),
        });
        if (launchIntent.data.requiresSignature) throw new Error("Expected a prebuilt launch-coin intent");
        const launched = await executeTransaction({
          pin,
          calls: (launchIntent.data.calls as Call[]).map(toChipiCall),
        });
        if (launched.status !== "confirmed") {
          throw new Error(launched.revertReason ?? "Ekubo launch reverted");
        }

        // Index instantly (poll backstop covers failures).
        setStatus("indexing");
        await fetch(`${API_BASE}/v1/coins/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coinAddress, owner: ownerAddr }),
        }).catch(() => { /* poll backstop will index it */ });

        setStatus("done");
        rewardToast("launch_coin");
        return { coinAddress };
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Launch failed");
        throw e;
      }
    },
    [executeTransaction, client]
  );

  return { launch, status, error };
}
