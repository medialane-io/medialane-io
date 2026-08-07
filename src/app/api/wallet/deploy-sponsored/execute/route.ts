/**
 * Server-only: executes a signed AVNU-paymaster deploy_and_invoke
 * transaction. Companion to build/route.ts — see that file's header for
 * why deploy_and_invoke, not bare deploy, and why this can't run
 * client-side (the AVNU API key would leak).
 *
 * `deployment` must be the exact object build/route.ts returned — it's
 * not re-derivable from `typedData` alone (confirmed against starknet.js's
 * PreparedDeployAndInvokeTransaction type: `deployment` and `typed_data`
 * are sibling fields, not nested).
 */
import { type NextRequest, NextResponse } from "next/server";
import { PaymasterRpc } from "starknet";

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
    | { ownerAddress?: string; typedData?: unknown; signature?: string[]; deployment?: unknown }
    | null;
  if (!body?.ownerAddress || !body.typedData || !body.signature || !body.deployment) {
    return NextResponse.json(
      { error: "ownerAddress, typedData, signature, and deployment are required" },
      { status: 400 },
    );
  }

  try {
    const result = await paymaster().executeTransaction(
      {
        type: "deploy_and_invoke",
        deployment: body.deployment as never,
        invoke: {
          userAddress: body.ownerAddress,
          typedData: body.typedData as never,
          signature: body.signature,
        },
      },
      { version: "0x1", feeMode: { mode: "sponsored" } },
    );
    return NextResponse.json({ transactionHash: (result as { transaction_hash: string }).transaction_hash });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to execute sponsored deploy transaction" },
      { status: 502 },
    );
  }
}
