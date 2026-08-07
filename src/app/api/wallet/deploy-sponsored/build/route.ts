/**
 * Server-only: builds an AVNU-paymaster-sponsored deploy_and_invoke
 * transaction (new wallet deployment bundled with a harmless zero-amount
 * STRK self-transfer — the only executable paymaster shape with an
 * unambiguous signature story; see design spec
 * 2026-08-05-medialane-io-wallet-native-frictionless-design.md §3.3,
 * 2026-08-07 correction). The AVNU API key never reaches the browser —
 * this route holds it, the browser only ever sees the returned typed
 * data to sign.
 */
import { type NextRequest, NextResponse } from "next/server";
import { PaymasterRpc, CallData, uint256, type PreparedDeployAndInvokeTransaction } from "starknet";
import { getTokenBySymbol } from "@medialane/sdk";
import { MEDIAWALLET_CLASS_HASH, ownerConstructorCalldata } from "@/lib/wallet/account";

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
    | { ownerPubkey?: string; ownerAddress?: string; salt?: string }
    | null;
  if (!body?.ownerPubkey || !body.ownerAddress) {
    return NextResponse.json({ error: "ownerPubkey and ownerAddress are required" }, { status: 400 });
  }
  const salt = body.salt ?? "0x0";

  const strk = getTokenBySymbol("STRK");
  if (!strk) return NextResponse.json({ error: "STRK token not found in registry" }, { status: 500 });

  try {
    const prepared = (await paymaster().buildTransaction(
      {
        type: "deploy_and_invoke",
        deployment: {
          address: body.ownerAddress,
          class_hash: MEDIAWALLET_CLASS_HASH,
          salt,
          calldata: ownerConstructorCalldata(body.ownerPubkey),
          version: 1,
        },
        invoke: {
          userAddress: body.ownerAddress,
          calls: [
            {
              contractAddress: strk.address,
              entrypoint: "transfer",
              calldata: CallData.compile([body.ownerAddress, uint256.bnToUint256(0)]),
            },
          ],
        },
      },
      { version: "0x1", feeMode: { mode: "sponsored" } },
    )) as PreparedDeployAndInvokeTransaction;
    // `deployment` is echoed back verbatim (not re-derivable from typed_data
    // alone) — the client must carry it through unchanged to /execute.
    return NextResponse.json({ typedData: prepared.typed_data, deployment: prepared.deployment });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build sponsored deploy transaction" },
      { status: 502 },
    );
  }
}
