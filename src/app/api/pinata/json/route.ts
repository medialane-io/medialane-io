/**
 * POST /api/pinata/json
 *
 * Uploads a JSON document to Pinata/IPFS.
 * Requires an active Clerk session.
 *
 * Accepts: application/json body (any JSON object)
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

  try {
    const pinata = getPinata();
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    const file = new File([blob], "metadata.json", { type: "application/json" });
    const upload = await pinata.upload.public.file(file);
    const uri = `ipfs://${upload.cid}`;
    return NextResponse.json({ uri, cid: upload.cid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[pinata/json] upload failed:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
