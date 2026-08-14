/**
 * Server-only: executes a signed AVNU-paymaster `invoke` transaction against
 * an already-deployed MediaWallet account. Companion to build/route.ts, see
 * that file's header for why this can't run client-side (the AVNU API key
 * would leak).
 */
import { type NextRequest, NextResponse } from "next/server";
import { paymaster } from "@/lib/wallet/paymaster-server";
import { billPaymasterCall } from "@/lib/wallet/paymaster-billing";
import { createRateLimiter, isSameOrigin, requestIp } from "@/lib/api-route-guard";

export const runtime = "nodejs";

const checkRateLimit = createRateLimiter(60_000, 30);

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 });
  }
  if (!checkRateLimit(requestIp(req))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | { userAddress?: string; typedData?: unknown; signature?: string[] }
    | null;
  if (!body?.userAddress || !body.typedData || !body.signature) {
    return NextResponse.json(
      { error: "userAddress, typedData, and signature are required" },
      { status: 400 },
    );
  }

  if (!(await billPaymasterCall("invoke/execute"))) {
    return NextResponse.json({ error: "Insufficient credits or billing unavailable" }, { status: 402 });
  }

  try {
    const result = await paymaster().executeTransaction(
      {
        type: "invoke",
        invoke: { userAddress: body.userAddress, typedData: body.typedData as never, signature: body.signature },
      },
      { version: "0x1", feeMode: { mode: "sponsored" } },
    );
    return NextResponse.json({ transactionHash: (result as { transaction_hash: string }).transaction_hash });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to execute sponsored invoke transaction" },
      { status: 502 },
    );
  }
}
