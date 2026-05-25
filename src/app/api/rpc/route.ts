import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Public Starknet RPC fallback. Used only when no private endpoint
// (ALCHEMY_URL or STARKNET_RPC_URL_SERVER) is configured. Same endpoint
// the @medialane/sdk defaults to — rate-limited but better than 500.
const PUBLIC_FALLBACK = "https://rpc.starknet.lava.build/";

const RPC_URL =
  process.env.ALCHEMY_URL ||
  process.env.STARKNET_RPC_URL_SERVER ||
  PUBLIC_FALLBACK;

/**
 * Server-side Starknet RPC proxy.
 *
 * Forwards JSON-RPC POST requests to Alchemy (or any configured RPC endpoint)
 * without exposing the API key to the browser. Eliminates the CORS block and
 * Alchemy 429 → no-CORS-header failure that caused waitForTransaction to hang.
 *
 * Client usage: set NEXT_PUBLIC_STARKNET_RPC_URL=/api/rpc
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

  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Read as text first so a non-JSON upstream (Alchemy rate limit HTML,
    // Cloudflare error page, empty body) doesn't crash `.json()`.
    const text = await response.text();
    if (!text) {
      console.error("[/api/rpc] upstream returned empty body", {
        status: response.status,
        upstream: RPC_URL.split("/")[2],
      });
      return rpcError(-32603, `Upstream RPC returned empty body (HTTP ${response.status})`);
    }

    try {
      const data = JSON.parse(text);
      // Pass the JSON-RPC envelope through verbatim — the client's RPC layer
      // knows how to handle JSON-RPC `error` objects. Always use HTTP 200 so
      // it actually gets to read the body.
      return NextResponse.json(data, { status: 200 });
    } catch {
      console.error("[/api/rpc] upstream returned non-JSON", {
        status: response.status,
        upstream: RPC_URL.split("/")[2],
        bodyPreview: text.slice(0, 200),
      });
      return rpcError(
        -32603,
        `Upstream RPC returned non-JSON (HTTP ${response.status})`,
      );
    }
  } catch (err) {
    console.error("[/api/rpc] upstream fetch failed", {
      upstream: RPC_URL.split("/")[2],
      err: err instanceof Error ? err.message : String(err),
    });
    return rpcError(
      -32603,
      `Upstream RPC unreachable: ${err instanceof Error ? err.message : "unknown error"}`,
    );
  }
}
