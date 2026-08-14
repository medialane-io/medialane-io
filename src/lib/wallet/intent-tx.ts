

import type { Call, TypedData } from "starknet";
import type { StarknetVenueSigner, MedialaneClient } from "@medialane/sdk/starknet";
import type { ApiIntentCreated } from "@medialane/sdk";

export async function confirmIntentBestEffort(
  client: MedialaneClient,
  intentId: string,
  txHash: string,
): Promise<void> {
  await client.api.confirmIntent(intentId, txHash).catch(() => {  });
}

export interface ExecuteIntentOpts {
  confirm?: boolean;
}

export async function executeIntent(
  signer: StarknetVenueSigner,
  client: MedialaneClient,
  intent: ApiIntentCreated,
  opts: ExecuteIntentOpts = {},
): Promise<{ txHash: string }> {
  let calls: Call[];
  if (intent.requiresSignature) {

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
