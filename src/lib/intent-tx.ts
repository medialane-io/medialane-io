// The one place a backend intent's prebuilt `calls` gets executed and
// confirmed via ChipiPay. Every launchpad write flow (create-collection,
// mint, create-tier+mint) goes through one of these instead of repeating
// the requiresSignature-check + execute + best-effort-confirm boilerplate
// inline. Mirrors medialane-starknet's src/lib/intent-tx.ts, adapted for
// ChipiPay's `{ pin, calls }` execute signature instead of a direct wallet
// signer — io's launchpad intents never require a SNIP-12 signature
// (CREATE_COLLECTION, CREATE_TIER, MINT are all prebuilt), so this only
// covers that half of starknet's module.
import type { MedialaneClient } from "@medialane/sdk/starknet";
import type { ApiIntentCreated } from "@medialane/sdk";
import type { ChipiCall, ChipiTransactionResult } from "@/hooks/use-chipi-transaction";

type ExecuteTransaction = (params: { pin: string; calls: ChipiCall[] }) => Promise<ChipiTransactionResult>;

/** Narrows the `{ requiresSignature: false; calls }` half of ApiIntentCreated. */
export type PrebuiltIntent = Extract<ApiIntentCreated, { requiresSignature: false }>;

/**
 * Report a submitted tx hash back to the backend so it can settle/hydrate the
 * intent (receipt-derived data, e.g. MINT's assigned id) or reconcile status.
 * Best-effort by design: some intent types (CREATE_COLLECTION, CREATE_TIER)
 * reject confirmation outright — the wallet has already submitted the tx
 * on-chain either way, so a rejected/failed confirm call must never surface
 * as a user-facing error. The backend's own indexer/factory poll is the
 * reconciliation backstop regardless of whether this call succeeds.
 */
export async function confirmIntentBestEffort(
  client: MedialaneClient,
  intentId: string,
  txHash: string,
): Promise<void> {
  await client.api.confirmIntent(intentId, txHash).catch(() => { /* backend reconciles from chain */ });
}

export interface ExecutePrebuiltIntentOpts {
  /**
   * Submit the tx hash to `PATCH /v1/intents/:id/confirm` after a confirmed
   * execution. Default true. Set false for intent types the backend route
   * rejects confirmation for (CREATE_COLLECTION, CREATE_TIER).
   */
  confirm?: boolean;
}

/**
 * Execute a single prebuilt intent (MINT, CREATE_COLLECTION) via ChipiPay,
 * then best-effort confirm. Throws if the intent unexpectedly requires a
 * signature — io's launchpad flows never sign, so that would mean a
 * mismatched API response, not a normal error path.
 */
export async function executePrebuiltIntent(
  execute: ExecuteTransaction,
  client: MedialaneClient,
  pin: string,
  intent: ApiIntentCreated,
  opts: ExecutePrebuiltIntentOpts = {},
): Promise<ChipiTransactionResult> {
  if (intent.requiresSignature) throw new Error("Expected a prebuilt intent (requiresSignature=false)");
  const result = await execute({ pin, calls: intent.calls as ChipiCall[] });
  if (result.status === "confirmed" && opts.confirm !== false) {
    await confirmIntentBestEffort(client, intent.id, result.txHash);
  }
  return result;
}

/**
 * Execute several prebuilt intents' calls as ONE ChipiPay multicall (e.g.
 * CREATE_TIER + MINT bundled into a single "mint" action so the user only
 * unlocks their PIN once), then best-effort confirm each intent id against
 * the same tx hash.
 */
export async function executePrebuiltIntents(
  execute: ExecuteTransaction,
  client: MedialaneClient,
  pin: string,
  intents: ApiIntentCreated[],
  opts: ExecutePrebuiltIntentOpts = {},
): Promise<ChipiTransactionResult> {
  if (intents.some((i) => i.requiresSignature)) {
    throw new Error("Expected prebuilt intents (requiresSignature=false)");
  }
  const calls = (intents as PrebuiltIntent[]).flatMap((i) => i.calls as ChipiCall[]);
  const result = await execute({ pin, calls });
  if (result.status === "confirmed" && opts.confirm !== false) {
    await Promise.all(intents.map((i) => confirmIntentBestEffort(client, i.id, result.txHash)));
  }
  return result;
}
