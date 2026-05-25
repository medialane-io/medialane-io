import { buildFeeCall } from "@medialane/sdk";
import { ioFeeConfig } from "@/lib/fee";
import type { ChipiTransactionParams, ChipiTransactionResult } from "@/hooks/use-chipi-transaction";

type ExecuteTransaction = (params: ChipiTransactionParams) => Promise<ChipiTransactionResult>;

export interface ChargePlatformFeeParams {
  surface: "marketplace" | "launchpad";
  /** ERC-20 the fee is denominated in (the settlement payment token). */
  token: string;
  /** Settled gross amount in raw token units (price × quantity). */
  grossAmount: bigint;
  /** The PIN / derived key already collected for the buy. */
  pin: string;
  /**
   * A `useChipiTransaction().executeTransaction` — MUST be a dedicated instance,
   * not the one used for the buy, so its status state does not collide.
   */
  executeTransaction: ExecuteTransaction;
}

/**
 * Fire the creators-fund platform fee as a SEPARATE, single-call transaction.
 *
 * Call this ONLY after a buy/mint has confirmed successfully, and call it
 * WITHOUT `await` — it is fire-and-forget and must never block or delay the
 * success UI. A single-call tx is safe on the non-atomic ChipiPay account:
 * the one call is the whole transaction. Any failure (disabled fee, session
 * expired, RPC error, revert) is swallowed and logged — the buy already
 * succeeded; a missed fee is an accepted under-charge.
 */
export async function chargePlatformFee({
  surface,
  token,
  grossAmount,
  pin,
  executeTransaction,
}: ChargePlatformFeeParams): Promise<void> {
  try {
    const feeCall = buildFeeCall({ surface, token, grossAmount }, ioFeeConfig);
    if (!feeCall) {
      console.info("[medialane] platform fee skipped", {
        surface,
        enabled: ioFeeConfig.enabled,
        hasFundAddress: Boolean(ioFeeConfig.fundAddress),
        grossAmount: grossAmount.toString(),
      });
      return;
    }

    const result = await executeTransaction({
      pin,
      calls: [
        {
          contractAddress: feeCall.contractAddress,
          entrypoint: feeCall.entrypoint,
          calldata: feeCall.calldata as string[],
        },
      ],
    });

    if (result.status === "reverted") {
      console.warn("[medialane] platform fee charge reverted (non-blocking):", {
        txHash: result.txHash,
        revertReason: result.revertReason,
      });
      return;
    }

    console.info("[medialane] platform fee charged", {
      surface,
      txHash: result.txHash,
    });
  } catch (err) {
    console.warn("[medialane] platform fee charge failed (non-blocking):", err);
  }
}
