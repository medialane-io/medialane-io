/**
 * POST /api/pinata/sponsorship-terms
 *
 * Pins a sponsorship deal's declarative terms (@medialane/ui's
 * `toLicenseMetadata()` shape — licenseType, territory, deliverables, etc.)
 * to IPFS. Requires an active Clerk session.
 *
 * Separate from `/api/pinata/json` on purpose: that route's ALLOWED_FIELDS
 * allowlist is scoped to OpenSea-style NFT metadata (name/description/image/
 * attributes) — sponsorship terms are a different document shape entirely and
 * were being rejected with 400 by that allowlist (every sponsorship pin on
 * this app failed until this route existed; starknet's equivalent route has
 * no such allowlist, which is why it never hit this).
 *
 * Accepts: application/json body (any JSON object, size-capped)
 * Response: { uri: "ipfs://...", cid: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PinataSDK } from "pinata";

function getPinata() {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT environment variable is not set");
  return new PinataSDK({
    pinataJwt: jwt,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud",
  });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "JSON object body required" }, { status: 400 });
  }

  const MAX_BYTES = 50 * 1024; // 50 KB
  if (JSON.stringify(body).length > MAX_BYTES) {
    return NextResponse.json({ error: "Payload too large (max 50 KB)" }, { status: 413 });
  }

  try {
    const pinata = getPinata();
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    const file = new File([blob], "sponsorship-terms.json", { type: "application/json" });
    const upload = await pinata.upload.public.file(file);
    const uri = `ipfs://${upload.cid}`;
    return NextResponse.json({ uri, cid: upload.cid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[pinata/sponsorship-terms] upload failed:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
