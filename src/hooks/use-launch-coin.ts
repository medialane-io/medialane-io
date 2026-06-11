"use client";

/**
 * useLaunchCoin (io) — Creator Coin launch through the ChipiPay atomic
 * chokepoint. Two sponsored transactions, one PIN entry:
 *
 *   1. `create_creator_coin` → read the coin address from the receipt
 *      (SDK `parseCreatorCoinCreated`).
 *   2. quote `transfer` (buyback pre-fund) + `launch_on_ekubo` multicall.
 *   3. `POST /v1/coins/sync` for instant indexing (50s factory poll backstop).
 *
 * Calldata comes from the SDK's account-free builders — the same source the
 * dapp's CreatorCoinService executes. Never build factory calldata locally.
 */

import { useState, useCallback } from "react";
import type { Call } from "starknet";
import {
  buildCreateCreatorCoinCall,
  buildLaunchOnEkuboCalls,
  parseCreatorCoinCreated,
  getTokenBySymbol,
  normalizeAddress,
  VALIDATED_EKUBO_PARAMS,
  coinToRaw as toRaw,
  teamCoinsRaw,
  buybackQuoteRaw,
  type CreatorCoinReceiptLike,
} from "@medialane/sdk";
import { useChipiTransaction, type ChipiCall } from "@/hooks/use-chipi-transaction";
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
      const ownerAddr = normalizeAddress(owner);

      try {
        // Tx1 — deploy the coin (full supply to the Factory).
        setStatus("deploying");
        const created = await executeTransaction({
          pin,
          calls: [toChipiCall(buildCreateCreatorCoinCall({
            owner: ownerAddr,
            name: input.name,
            symbol: input.symbol,
            initialSupply: supplyRaw,
          }))],
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
        // in the same atomic multicall. Anti-snipe off (delay 0) in v1.
        setStatus("launching");
        const launched = await executeTransaction({
          pin,
          calls: buildLaunchOnEkuboCalls({
            creatorCoin: coinAddress,
            quoteToken: quote.address,
            initialHolders: input.teamPct > 0 ? [ownerAddr] : [],
            initialHoldersAmounts: input.teamPct > 0 ? [teamRaw] : [],
            transferRestrictionDelay: 0,
            ekubo: VALIDATED_EKUBO_PARAMS,
            quoteFundAmount: buybackRaw,
          }).map(toChipiCall),
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
        return { coinAddress };
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Launch failed");
        throw e;
      }
    },
    [executeTransaction]
  );

  return { launch, status, error };
}
