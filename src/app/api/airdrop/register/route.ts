/**
 * /api/airdrop/register — thin forwarder to medialane-backend.
 *
 * Replaces the previous in-process console.log stub that was losing every
 * signup. Validation, persistence, and IP-based rate limiting now all live
 * server-side at POST /v1/airdrop/register (backed by the AirdropSignup
 * Prisma model). This route only:
 *
 *   1. Echoes the JSON body to the backend.
 *   2. Forwards the caller's IP via `x-real-ip` so the backend's
 *      rate-limit key + audit row reflect the real client, not the
 *      Vercel edge.
 *   3. Injects the server-only `MEDIALANE_API_KEY` (the backend route
 *      sits under /v1/*, so it requires a tenant API key).
 *
 * The form (src/app/airdrop/...) is unchanged.
 */
import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDIALANE_BACKEND_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  const apiKey = process.env.MEDIALANE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Airdrop signup is not configured on this deployment" },
      { status: 503 }
    );
  }

  // Read the raw body once — we forward bytes unchanged so backend zod
  // validation sees the exact shape the user submitted.
  const body = await req.text();

  // Real client IP. In production this comes from Vercel's
  // `x-forwarded-for`; the leftmost value is the user. The backend
  // looks for `x-real-ip` (Railway's edge convention), so we
  // normalise here.
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "";

  const userAgent = req.headers.get("user-agent") ?? "";

  try {
    const res = await fetch(`${BACKEND_URL.replace(/\/$/, "")}/v1/airdrop/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        ...(ip ? { "x-real-ip": ip } : {}),
        ...(userAgent ? { "user-agent": userAgent } : {}),
      },
      body,
      cache: "no-store",
    });

    // Pass through status + body. Don't transform — backend already returns
    // `{ data: ... }` on success and `{ error: ... }` on failure.
    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach signup service" }, { status: 502 });
  }
}
