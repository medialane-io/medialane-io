/**
 * Server-only: fetches an AVNU swap quote for the "pay with any token"
 * auto-swap flow (see docs/superpowers/specs/2026-08-12-usd-price-autoswap-design.md).
 * Billed via billSwapCall before any AVNU call — this route never forwards
 * to AVNU on insufficient credits. AVNU's swap quote endpoint needs no API
 * key, but that doesn't exempt it from metering (see swap-billing.ts).
 *
 * This is the browsing-estimate phase — stale-tolerant, used only to show
 * "≈ X token" in the pay-with picker. The buy-time flow re-fetches a fresh
 * quote itself before calling /swap/build.
 */
import { type NextRequest, NextResponse } from "next/server";
import { getQuotes } from "@avnu/avnu-sdk";
import { getTokenBySymbol, stringifyBigInts } from "@medialane/sdk";
import { billSwapCall } from "@/lib/wallet/swap-billing";
import { createRateLimiter, isSameOrigin, requestIp } from "@/lib/api-route-guard";

export const runtime = "nodejs";

const checkRateLimit = createRateLimiter(60_000, 60);

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed" }, { status: 403 });
  }
  if (!checkRateLimit(requestIp(req))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as
    | { sellSymbol?: string; buySymbol?: string; buyAmountRaw?: string; takerAddress?: string }
    | null;
  if (!body?.sellSymbol || !body.buySymbol || !body.buyAmountRaw) {
    return NextResponse.json(
      { error: "sellSymbol, buySymbol, and buyAmountRaw are required" },
      { status: 400 },
    );
  }

  const sellToken = getTokenBySymbol(body.sellSymbol);
  const buyToken = getTokenBySymbol(body.buySymbol);
  if (!sellToken || !buyToken) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  if (!(await billSwapCall("quote"))) {
    return NextResponse.json({ error: "Insufficient credits or billing unavailable" }, { status: 402 });
  }

  try {
    const quotes = await getQuotes({
      sellTokenAddress: sellToken.address,
      buyTokenAddress: buyToken.address,
      buyAmount: BigInt(body.buyAmountRaw),
      takerAddress: body.takerAddress,
    });
    const best = quotes[0];
    if (!best) {
      return NextResponse.json({ error: "No swap route available for this pair" }, { status: 502 });
    }
    return NextResponse.json({ quote: stringifyBigInts(best) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch swap quote" },
      { status: 502 },
    );
  }
}
