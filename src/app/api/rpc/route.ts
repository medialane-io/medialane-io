import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PUBLIC_RPC_FALLBACKS, isTransientRpcError } from "@medialane/sdk";

// Configured private endpoints first, then the SDK's shared public fallback
// list (lava.build, …). Public providers are still rate-limited, so rotation
// continues on transient JSON-RPC errors / non-JSON responses.
const RPC_URLS = Array.from(new Set([
  process.env.ALCHEMY_RPC_URL,
  process.env.ALCHEMY_URL,
  process.env.STARKNET_RPC_URL_SERVER,
  process.env.STARKNET_RPC_FALLBACK_URL,
  ...PUBLIC_RPC_FALLBACKS,
].filter((url): url is string => Boolean(url))));

/**
 * Server-side Starknet RPC proxy.
 *
 * Forwards JSON-RPC POST requests to Alchemy (or any configured RPC endpoint)
 * without exposing the API key to the browser. Eliminates the CORS block and
 * Alchemy 429 → no-CORS-header failure that caused waitForTransaction to hang.
 *
 * Client usage: set NEXT_PUBLIC_STARKNET_PROVIDER_URL=/api/rpc
 *
 * Security:
 *  - Requires an active Clerk session (prevents unauthenticated quota exhaustion).
 *  - Only forwards methods in ALLOWED_METHODS (prevents abuse of expensive trace/debug methods).
 *  - Handles both single requests and JSON-RPC batch arrays.
 */

// Allowlist of JSON-RPC methods forwarded to Alchemy.
// Covers all features: mint, listing, offer, cancel, comments, launchpad,
// create collection/asset, remix — plus starknet.js v6 internal calls.
// Dangerous methods (trace, declare, deploy-account) are intentionally excluded.
const ALLOWED_METHODS = new Set([
  // ── Core read/write ───────────────────────────────────────────────────────
  "starknet_call",
  "starknet_addInvokeTransaction",
  // ── Transaction lifecycle ─────────────────────────────────────────────────
  "starknet_getTransactionReceipt",
  "starknet_getTransactionStatus",
  "starknet_getTransactionByHash",    // starknet.js v6 replacement for getTransaction
  "starknet_getTransaction",          // kept for older SDK paths
  "starknet_getBlockWithReceipts",    // waitForTransaction fallback path in starknet.js v6
  // ── Fee estimation & nonce ────────────────────────────────────────────────
  "starknet_estimateFee",
  "starknet_getNonce",
  "starknet_simulateTransactions",
  // ── Provider initialisation (called automatically by starknet.js) ─────────
  "starknet_specVersion",             // version handshake on every provider init
  "starknet_chainId",
  "starknet_blockNumber",
  "starknet_blockHashAndNumber",
  // ── Block queries ─────────────────────────────────────────────────────────
  "starknet_getBlockWithTxHashes",
  "starknet_getBlockWithTxs",
  // ── Contract / account introspection ─────────────────────────────────────
  "starknet_getClassAt",
  "starknet_getClass",
  "starknet_getClassHashAt",          // Cairo 0 vs Cairo 1 account detection
  "starknet_getStorageAt",
  // ── Events (used by SDK hooks and activity feeds) ─────────────────────────
  "starknet_getEvents",
]);

function isAllowedMethod(body: unknown): boolean {
  if (Array.isArray(body)) {
    return body.every((item) => isAllowedMethod(item));
  }
  if (body && typeof body === "object") {
    const method = (body as Record<string, unknown>).method;
    return typeof method === "string" && ALLOWED_METHODS.has(method);
  }
  return false;
}

/**
 * JSON-RPC error envelope. Every error path through this route returns
 * this shape with HTTP 200 so client-side starknet.js (which expects a
 * JSON body and crashes on `.json()` otherwise) can surface a meaningful
 * error to the caller instead of blowing up with
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 *
 * If the original request is a batch we still return a single error here
 * — starknet.js doesn't use batches in any of our flows, and an error
 * during a batched op is a hard failure either way.
 */
function rpcError(code: number, message: string, id: number | null = null) {
  return NextResponse.json(
    { jsonrpc: "2.0", error: { code, message }, id },
    { status: 200 },
  );
}

// Transient-error detection (which JSON-RPC failures are worth rotating onto
// the next upstream, vs. deterministic contract errors that must propagate)
// lives in @medialane/sdk `isTransientRpcError` — single source of truth.

export async function POST(req: NextRequest) {
  // Require an active Clerk session — all on-chain interactions in this app require login.
  const { userId } = await auth();
  if (!userId) {
    return rpcError(-32000, "Unauthorized");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return rpcError(-32700, "Parse error");
  }

  if (!isAllowedMethod(body)) {
    const method = !Array.isArray(body) && body && typeof body === "object"
      ? String((body as Record<string, unknown>).method ?? "<unknown>")
      : "<batch or invalid>";
    return rpcError(-32601, `Method not allowed: ${method}`);
  }

  let lastError = "No RPC upstream configured";

  for (const rpcUrl of RPC_URLS) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Read as text first so a non-JSON upstream (Alchemy rate limit HTML,
      // Cloudflare error page, empty body) doesn't crash `.json()`.
      const text = await response.text();
      const upstream = rpcUrl.split("/")[2];
      if (!text) {
        lastError = `Upstream RPC returned empty body (HTTP ${response.status})`;
        console.warn("[/api/rpc] upstream returned empty body", {
          status: response.status,
          upstream,
        });
        continue;
      }

      try {
        const data = JSON.parse(text);

        // Some providers wrap rate limits / capacity failures in a valid
        // JSON-RPC envelope (HTTP 200, body = { jsonrpc, error: {...} }).
        // Rotating onto the next fallback recovers from those without the
        // client ever seeing the transient failure. Deterministic contract
        // errors (revert, invalid params, missing block) propagate verbatim.
        if (isTransientRpcError({ status: response.status, body: data })) {
          const errObj = (data as { error?: { code?: unknown; message?: unknown } }).error;
          lastError = `Upstream RPC returned transient JSON-RPC error: ${String(errObj?.message ?? "(no message)")}`;
          console.warn("[/api/rpc] upstream returned transient JSON-RPC error", {
            upstream,
            code: errObj?.code,
            message: errObj?.message,
          });
          continue;
        }

        // Pass the JSON-RPC envelope through verbatim — the client's RPC layer
        // knows how to handle JSON-RPC `error` objects. Always use HTTP 200 so
        // it actually gets to read the body.
        return NextResponse.json(data, { status: 200 });
      } catch {
        lastError = `Upstream RPC returned non-JSON (HTTP ${response.status})`;
        console.warn("[/api/rpc] upstream returned non-JSON", {
          status: response.status,
          upstream,
          bodyPreview: text.slice(0, 200),
        });
        continue;
      }
    } catch (err) {
      lastError = `Upstream RPC unreachable: ${err instanceof Error ? err.message : "unknown error"}`;
      console.warn("[/api/rpc] upstream fetch failed", {
        upstream: rpcUrl.split("/")[2],
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return rpcError(-32603, lastError);
}
