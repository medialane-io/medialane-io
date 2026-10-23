
import { UserFacingError, type UploadDiagnostics } from "@medialane/ui";
import { MedialaneApiError } from "@medialane/sdk";
import { getMedialaneClient } from "@/lib/medialane-client";

export type MintDebugSnapshot = {
  operation: "mint_erc721";
  step: string;
  updatedAt: string;
  walletAddress?: string | null;
  collectionId?: string | null;
  collectionContract?: string | null;
  collectionName?: string | null;
  tokenUri?: string | null;
  request?: Record<string, unknown>;
  responseStatus?: number;
  responseText?: string;
  responseJson?: unknown;
  intentId?: string;
  calls?: Array<{ contractAddress?: string; entrypoint?: string; calldataLength?: number }>;
  txHash?: string | null;
  txStatus?: string;
  intentStatus?: string;
  terminalIntent?: Record<string, unknown>;
  error?: string;
  failedAt?: string;
  rawError?: string;
  uploadDiagnostics?: UploadDiagnostics;
};

export function rawErrorOf(err: unknown): string {
  const parts: string[] = [];
  if (err instanceof MedialaneApiError) parts.push(`HTTP ${err.status}`);
  if (err instanceof Error) {
    parts.push(`${err.name}: ${err.message}`);
    if (err.cause instanceof Error) parts.push(`cause ${err.cause.name}: ${err.cause.message}`);
  } else {
    parts.push(String(err));
  }
  return parts.join(" | ").slice(0, 2000);
}

export function uploadDiagnosticsOf(err: unknown): UploadDiagnostics | undefined {
  if (!(err instanceof Error) || !("diagnostics" in err)) return undefined;
  return (err as Error & { diagnostics: UploadDiagnostics }).diagnostics;
}

export type UpdateDebug = (patch: Partial<MintDebugSnapshot>) => MintDebugSnapshot;

/** What a failed backend call looks like in the debug snapshot. */
function failure(err: unknown): Partial<MintDebugSnapshot> {
  if (err instanceof MedialaneApiError) {
    return {
      responseStatus: err.status,
      responseText: (typeof err.details === "string" ? err.details : JSON.stringify(err.details ?? null)).slice(0, 2000),
      responseJson: err.details,
    };
  }
  return { error: err instanceof Error ? err.message : String(err) };
}

export async function createMintIntentWithDebug(
  body: { owner: string; collectionId: string; recipient: string; tokenUri: string; royaltyBps: number },
  updateDebug: UpdateDebug
) {
  updateDebug({ step: "intent_request", request: { ...body } });

  try {
    const response = await getMedialaneClient().api.intents.create("mint", body);
    updateDebug({ step: "intent_response", responseStatus: 200, responseJson: response });
    return response as { id?: string; calls?: { contractAddress: string; entrypoint?: string; calldata?: unknown[] }[] };
  } catch (err) {
    updateDebug({ step: "intent_failed", ...failure(err) });
    throw err;
  }
}

export async function confirmMintIntentWithDebug(
  id: string,
  txHash: string,
  updateDebug: UpdateDebug
) {
  const normalizedHash = "0x" + txHash.replace(/^0x/, "").padStart(64, "0");
  updateDebug({ step: "tx_confirm_request", txHash: normalizedHash });

  try {
    const response = await getMedialaneClient().api.intents.confirm(id, normalizedHash);
    updateDebug({ step: "tx_confirm_sent", responseStatus: 200, responseJson: response, txHash: normalizedHash });
  } catch (err) {
    updateDebug({ step: "tx_confirm_failed", txHash: normalizedHash, ...failure(err) });
    throw err;
  }
  return normalizedHash;
}

export async function pollMintIntentUntilTerminal(
  id: string,
  updateDebug: UpdateDebug
) {
  const MAX_ATTEMPTS = 10;
  const INTERVAL_MS = 3000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise<void>((resolve) => setTimeout(resolve, INTERVAL_MS));

    let intent: Record<string, unknown> | null;
    try {
      intent = await getMedialaneClient().api.intents.get(id) as unknown as Record<string, unknown>;
    } catch (err) {
      updateDebug({ step: "intent_poll_failed", ...failure(err) });
      throw err;
    }
    const status = typeof intent?.status === "string" ? intent.status : undefined;

    updateDebug({
      step: status === "CONFIRMED" ? "intent_confirmed" : status === "FAILED" ? "intent_failed" : "intent_polling",
      intentStatus: status,
      terminalIntent: intent ?? undefined,
    });

    if (status === "CONFIRMED" || status === "FAILED") {
      return { status, intent };
    }
  }

  throw new UserFacingError("Mint verification timed out. Check the transaction status and refresh the collection.");
}
