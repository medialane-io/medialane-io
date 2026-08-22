import { type NextRequest, NextResponse } from "next/server";
import { type Call, type PreparedInvokeTransaction } from "starknet";
import { paymaster } from "@/lib/wallet/paymaster-server";
import { billPaymasterCall } from "@/lib/wallet/paymaster-billing";
import { createRateLimiter, isSameOrigin, requestIp } from "@medialane/sdk";

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
    | { userAddress?: string; calls?: Call[] }
    | null;
  if (!body?.userAddress || !body.calls?.length) {
    return NextResponse.json({ error: "userAddress and a non-empty calls array are required" }, { status: 400 });
  }

  if (!(await billPaymasterCall("invoke/build"))) {
    return NextResponse.json({ error: "Insufficient credits or billing unavailable" }, { status: 402 });
  }

  try {
    const prepared = (await paymaster().buildTransaction(
      { type: "invoke", invoke: { userAddress: body.userAddress, calls: body.calls } },
      { version: "0x1", feeMode: { mode: "sponsored" } },
    )) as PreparedInvokeTransaction;
    return NextResponse.json({ typedData: prepared.typed_data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build sponsored invoke transaction" },
      { status: 502 },
    );
  }
}
