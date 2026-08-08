/**
 * Server-only: builds an AVNU-paymaster-sponsored `invoke` transaction
 * against an already-deployed MediaWallet account, the post-deploy sibling
 * of `deploy-sponsored/build` (see that route's header, and design spec
 * 2026-08-08-io-sponsored-invoke-design.md). The AVNU API key never reaches
 * the browser, this route holds it, the browser only ever sees the returned
 * typed data (SNIP-9 outside execution) to sign.
 */
import { type NextRequest, NextResponse } from "next/server";
import { PaymasterRpc, type Call, type PreparedInvokeTransaction } from "starknet";

export const runtime = "nodejs";

const AVNU_PAYMASTER_URL = "https://starknet.paymaster.avnu.fi";

function paymaster(): PaymasterRpc {
  const apiKey = process.env.AVNU_PAYMASTER_API_KEY;
  if (!apiKey) throw new Error("AVNU_PAYMASTER_API_KEY is not set");
  return new PaymasterRpc({
    nodeUrl: AVNU_PAYMASTER_URL,
    headers: { "x-paymaster-api-key": apiKey },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { userAddress?: string; calls?: Call[] }
    | null;
  if (!body?.userAddress || !body.calls?.length) {
    return NextResponse.json({ error: "userAddress and a non-empty calls array are required" }, { status: 400 });
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
