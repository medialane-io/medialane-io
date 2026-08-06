/**
 * POST /api/pinata/sponsorship-terms
 *
 * Pins a sponsorship deal's declarative terms (@medialane/ui's
 * `toLicenseMetadata()` shape — licenseType, territory, deliverables, etc.)
 * to IPFS via medialane-backend's metered Pinata path. Requires a valid
 * SIWS wallet session.
 *
 * Separate from `/api/pinata/json` on purpose: that route's ALLOWED_FIELDS
 * allowlist is scoped to OpenSea-style NFT metadata (name/description/image/
 * attributes) — sponsorship terms are a different document shape entirely.
 *
 * Accepts: application/json body (any JSON object, size-capped)
 * Response: { uri: "ipfs://...", cid: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSiwsWallet } from "@/lib/siws-server";
import { uploadJsonToBackend } from "@/lib/backend-metadata";

export async function POST(req: NextRequest) {
  if (!getSiwsWallet(req.headers.get("authorization"))) {
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
    const { uri, cid } = await uploadJsonToBackend(body);
    return NextResponse.json({ uri, cid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[pinata/sponsorship-terms] upload failed:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
