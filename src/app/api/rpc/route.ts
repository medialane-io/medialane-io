import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const RPC_URL = process.env.ALCHEMY_URL || process.env.STARKNET_RPC_URL_SERVER || "";

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

export async function POST(req: NextRequest) {
  // Require an active Clerk session — all on-chain interactions in this app require login.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!RPC_URL) {
    return NextResponse.json({ error: "RPC not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isAllowedMethod(body)) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 403 });
  }

  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
