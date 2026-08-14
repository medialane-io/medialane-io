
import { type NextRequest, NextResponse } from "next/server";
import { getQuotes, quoteToCalls } from "@avnu/avnu-sdk";
import { stringifyBigInts } from "@medialane/sdk";
import { billSwapCall } from "@/lib/wallet/swap-billing";
import { resolveSwapToken, resolveSwapAmount } from "@/lib/wallet/swap-token";
import { createRateLimiter, isSameOrigin, requestIp } from "@/lib/api-route-guard";

export const runtime = "nodejs";

const DEFAULT_SLIPPAGE = 0.01;

const checkRateLimit = createRateLimiter(60_000, 30);

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 });
  }
  if (!checkRateLimit(requestIp(req))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        sellSymbol?: string;
        buySymbol?: string;
        sellTokenAddress?: string;
        buyTokenAddress?: string;
        sellAmountRaw?: string;
        buyAmountRaw?: string;
        takerAddress?: string;
      }
    | null;
  if (!body?.takerAddress) {
    return NextResponse.json({ error: "takerAddress is required" }, { status: 400 });
  }

  const sellToken = resolveSwapToken({ symbol: body.sellSymbol, address: body.sellTokenAddress });
  const buyToken = resolveSwapToken({ symbol: body.buySymbol, address: body.buyTokenAddress });
  const swapAmount = resolveSwapAmount(body);
  if (!sellToken || !buyToken || !swapAmount) {
    return NextResponse.json(
      { error: "Unsupported currency, or exactly one of sellAmountRaw/buyAmountRaw must be given" },
      { status: 400 },
    );
  }

  if (!(await billSwapCall("build"))) {
    return NextResponse.json({ error: "Insufficient credits or billing unavailable" }, { status: 402 });
  }

  try {
    const quotes = await getQuotes({
      sellTokenAddress: sellToken.address,
      buyTokenAddress: buyToken.address,
      ...swapAmount,
      takerAddress: body.takerAddress,
    });
    const quote = quotes[0];
    if (!quote) {
      return NextResponse.json({ error: "No swap route available for this pair" }, { status: 502 });
    }

    const built = await quoteToCalls({
      quoteId: quote.quoteId,
      slippage: DEFAULT_SLIPPAGE,
      takerAddress: body.takerAddress,
    });

    return NextResponse.json(stringifyBigInts({ calls: built.calls, chainId: built.chainId, quote }));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build swap calls" },
      { status: 502 },
    );
  }
}
