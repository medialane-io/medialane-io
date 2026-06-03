/**
 * Server interactions for the create-asset mint flow.
 *
 * Extracted from page.tsx — these are pure async helpers with no React state
 * or hooks. Each takes an `updateDebug` callback that the page's
 * `__MEDIALANE_MINT_DEBUG__` snapshot uses for in-window debugging.
 *
 * Kept on raw fetch (not the shared `lib/api-fetch` helper) because the
 * sequencing here — request → log → response-text → log → JSON-parse →
 * log — drives the debug snapshot more granularly than a single apiFetch
 * round-trip would allow.
 */
import { MEDIALANE_API_KEY, MEDIALANE_BACKEND_URL } from "@/lib/constants";

export type MintDebugSnapshot = {
  operation: "mint_erc721";
  step: string;
  updatedAt: string;
  walletAddress?: string | null;
  collectionId?: string | null;
  collectionContract?: string | null;
  collectionName?: string | null;
  tokenUri?: string | null;
  backendUrl?: string;
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
  /** Raw underlying error when `error` is a friendly remap (e.g. the ChipiPay
   *  paymaster reason behind a session/auth message). Set from `err.cause`. */
  rawError?: string;
};

export type UpdateDebug = (patch: Partial<MintDebugSnapshot>) => MintDebugSnapshot;

/** POST /v1/intents/mint — create a mint intent. */
export async function createMintIntentWithDebug(
  body: { owner: string; collectionId: string; recipient: string; tokenUri: string },
  updateDebug: UpdateDebug
) {
  updateDebug({
    step: "intent_request",
    backendUrl: MEDIALANE_BACKEND_URL,
    request: { ...body, tokenUri: body.tokenUri },
  });

  const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/intents/mint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(MEDIALANE_API_KEY ? { "x-api-key": MEDIALANE_API_KEY } : {}),
    },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  let responseJson: unknown = null;
  try {
    responseJson = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseJson = null;
  }

  updateDebug({
    step: res.ok ? "intent_response" : "intent_failed",
    responseStatus: res.status,
    responseText: responseText.slice(0, 2000),
    responseJson,
  });

  if (!res.ok) {
    const serverError =
      responseJson &&
      typeof responseJson === "object" &&
      "error" in responseJson &&
      typeof responseJson.error === "string"
        ? responseJson.error
        : responseText || `Mint intent failed with HTTP ${res.status}`;
    throw new Error(serverError);
  }

  return responseJson as { data?: { id?: string; calls?: { contractAddress: string; entrypoint?: string; calldata?: unknown[] }[] } };
}

/** PATCH /v1/intents/:id/confirm — confirm tx hash after on-chain mint. */
export async function confirmMintIntentWithDebug(
  id: string,
  txHash: string,
  updateDebug: UpdateDebug
) {
  const normalizedHash = "0x" + txHash.replace(/^0x/, "").padStart(64, "0");
  updateDebug({ step: "tx_confirm_request", txHash: normalizedHash });

  const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/intents/${id}/confirm`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(MEDIALANE_API_KEY ? { "x-api-key": MEDIALANE_API_KEY } : {}),
    },
    body: JSON.stringify({ txHash: normalizedHash }),
  });

  const responseText = await res.text();
  let responseJson: unknown = null;
  try {
    responseJson = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseJson = null;
  }

  updateDebug({
    step: res.ok ? "tx_confirm_sent" : "tx_confirm_failed",
    responseStatus: res.status,
    responseText: responseText.slice(0, 2000),
    responseJson,
    txHash: normalizedHash,
  });

  if (!res.ok) {
    const serverError =
      responseJson &&
      typeof responseJson === "object" &&
      "error" in responseJson &&
      typeof responseJson.error === "string"
        ? responseJson.error
        : responseText || `Mint confirmation failed with HTTP ${res.status}`;
    throw new Error(serverError);
  }

  return normalizedHash;
}

/** GET /v1/intents/:id — poll until CONFIRMED or FAILED, max 10 attempts × 3s. */
export async function pollMintIntentUntilTerminal(
  id: string,
  updateDebug: UpdateDebug
) {
  const MAX_ATTEMPTS = 10;
  const INTERVAL_MS = 3000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise<void>((resolve) => setTimeout(resolve, INTERVAL_MS));

    const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/intents/${id}`, {
      headers: {
        ...(MEDIALANE_API_KEY ? { "x-api-key": MEDIALANE_API_KEY } : {}),
      },
    });

    const responseText = await res.text();
    let responseJson: unknown = null;
    try {
      responseJson = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseJson = null;
    }

    if (!res.ok) {
      updateDebug({
        step: "intent_poll_failed",
        responseStatus: res.status,
        responseText: responseText.slice(0, 2000),
        responseJson,
      });
      throw new Error(responseText || `Mint verification poll failed with HTTP ${res.status}`);
    }

    const intent =
      responseJson &&
      typeof responseJson === "object" &&
      "data" in responseJson &&
      responseJson.data &&
      typeof responseJson.data === "object"
        ? (responseJson.data as Record<string, unknown>)
        : null;
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

  throw new Error("Mint verification timed out. Check the transaction status and refresh the collection.");
}
