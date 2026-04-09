import { NextRequest, NextResponse } from "next/server";

const RPC_URL = process.env.ALCHEMY_URL || process.env.STARKNET_RPC_URL_SERVER || "";

/**
 * Server-side Starknet RPC proxy.
 *
 * Forwards JSON-RPC POST requests to Alchemy (or any configured RPC endpoint)
 * without exposing the API key to the browser. Eliminates the CORS block and
 * Alchemy 429 → no-CORS-header failure that caused waitForTransaction to hang.
 *
 * Client usage: set NEXT_PUBLIC_STARKNET_RPC_URL=/api/rpc
 */
export async function POST(req: NextRequest) {
  if (!RPC_URL) {
    return NextResponse.json({ error: "RPC not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
