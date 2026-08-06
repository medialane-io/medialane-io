// The one place a backend intent gets signed (if needed), executed, and
// confirmed. Every migrated write flow goes through one of these instead of
// hand-building calldata or SNIP-12 typed data client-side. Built against
// the SDK's real `ApiIntentCreated` discriminated union (the actual return
// type of every `client.api.createXIntent()` call) and the portable
// `VenueSigner` — the same pattern medialane-starknet already runs in
// production. Supersedes an earlier draft of this file that used invented
// `{id, calls}`/`{id, typedData}` shapes instead of the real SDK type.
import type { Call, TypedData } from "starknet";
import type { StarknetVenueSigner, MedialaneClient } from "@medialane/sdk/starknet";
import type { ApiIntentCreated } from "@medialane/sdk";

export async function confirmIntentBestEffort(
  client: MedialaneClient,
  intentId: string,
  txHash: string,
): Promise<void> {
  await client.api.confirmIntent(intentId, txHash).catch(() => { /* backend reconciles from chain */ });
}

export interface ExecuteIntentOpts {
  confirm?: boolean;
}

/**
 * Executes one backend intent, dispatching on `requiresSignature`:
 *  - `false` (MINT, CREATE_COLLECTION, CREATE_TIER, FULFILL_ORDER, …): the
 *    calls are already fully populated — execute directly.
 *  - `true` (CREATE_LISTING, MAKE_OFFER, CANCEL_ORDER, COUNTER_OFFER): sign
 *    the typed data, submit it (populates `calls` server-side), then
 *    execute.
 * Either way, best-effort confirms the tx hash back to the backend after.
 */
export async function executeIntent(
  signer: StarknetVenueSigner,
  client: MedialaneClient,
  intent: ApiIntentCreated,
  opts: ExecuteIntentOpts = {},
): Promise<{ txHash: string }> {
  let calls: Call[];
  if (intent.requiresSignature) {
    // The SDK types `typedData` as `unknown` on the wire; every intent that
    // sets requiresSignature=true populates it as real SNIP-12 TypedData —
    // same cast already used elsewhere in this codebase (sign-typed-data.ts).
    const signature = await signer.signTypedData(intent.typedData as TypedData);
    const signed = await client.api.submitIntentSignature(intent.id, signature);
    calls = signed.data.calls as Call[];
  } else {
    calls = intent.calls as Call[];
  }

  const { txHash } = await signer.execute(calls);
  if (opts.confirm !== false) {
    await confirmIntentBestEffort(client, intent.id, txHash);
  }
  return { txHash };
}

/**
 * Bundles several PREBUILT intents' calls into ONE multicall (e.g.
 * CREATE_TIER + MINT so the user only signs once), then best-effort
 * confirms each intent id against the same tx hash. Throws if any intent
 * unexpectedly requires a signature — mixing a signature-required intent
 * into one multicall isn't a supported shape.
 */
export async function executeIntents(
  signer: StarknetVenueSigner,
  client: MedialaneClient,
  intents: ApiIntentCreated[],
  opts: ExecuteIntentOpts = {},
): Promise<{ txHash: string }> {
  if (intents.some((i) => i.requiresSignature)) {
    throw new Error("Expected prebuilt intents (requiresSignature=false)");
  }
  const calls = intents.flatMap((i) => (i as Extract<ApiIntentCreated, { requiresSignature: false }>).calls) as Call[];
  const { txHash } = await signer.execute(calls);
  if (opts.confirm !== false) {
    await Promise.all(intents.map((i) => confirmIntentBestEffort(client, i.id, txHash)));
  }
  return { txHash };
}
