// The one place a backend intent's `calls`/`typedData` gets signed, executed,
// and confirmed. Every migrated write flow goes through one of these
// functions instead of hand-building calldata or SNIP-12 typed data
// client-side. Ported verbatim from medialane-starknet's src/lib/intent-tx.ts
// (audit: medialane-core/docs/audits/2026-08-04-medialane-starknet-backend-
// bypass-audit.md, H1) — same interface, same behavior, different app.
import type { Call, TypedData } from "starknet";
import type { StarknetVenueSigner, MedialaneClient } from "@medialane/sdk/starknet";

export async function confirmIntentBestEffort(
  client: MedialaneClient,
  intentId: string,
  txHash: string,
): Promise<void> {
  await client.api.confirmIntent(intentId, txHash).catch(() => { /* backend reconciles from chain */ });
}

export interface ExecutePrebuiltIntentOpts {
  confirm?: boolean;
}

export async function executePrebuiltIntent(
  signer: StarknetVenueSigner,
  client: MedialaneClient,
  intent: { id: string; calls: Call[] },
  opts: ExecutePrebuiltIntentOpts = {},
): Promise<{ txHash: string }> {
  const { txHash } = await signer.execute(intent.calls);
  if (opts.confirm !== false) {
    await confirmIntentBestEffort(client, intent.id, txHash);
  }
  return { txHash };
}

export async function signAndExecuteIntent(
  signer: StarknetVenueSigner,
  client: MedialaneClient,
  intent: { id: string; typedData: TypedData },
): Promise<{ txHash: string }> {
  const signature = await signer.signTypedData(intent.typedData);
  const signed = await client.api.submitIntentSignature(intent.id, signature);
  const calls = signed.data.calls as Call[];
  const { txHash } = await signer.execute(calls);
  await confirmIntentBestEffort(client, intent.id, txHash);
  return { txHash };
}
