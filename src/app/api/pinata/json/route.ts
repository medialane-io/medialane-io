/**
 * POST /api/pinata/json
 *
 * Uploads a JSON document to IPFS via medialane-backend's metered Pinata path.
 * Requires a valid SIWS wallet session.
 *
 * Accepts: application/json body (any JSON object)
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

  // Only allow known NFT metadata fields — prevents arbitrary content pinning.
  const ALLOWED_FIELDS = new Set([
    "name", "description", "image", "external_link", "external_url", "attributes",
  ]);
  const unknownFields = Object.keys(body).filter((k) => !ALLOWED_FIELDS.has(k));
  if (unknownFields.length > 0) {
    return NextResponse.json(
      { error: `Unexpected fields: ${unknownFields.join(", ")}` },
      { status: 400 }
    );
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
    console.error("[pinata/json] upload failed:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
