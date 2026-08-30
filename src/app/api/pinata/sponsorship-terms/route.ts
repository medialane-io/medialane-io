

import { NextRequest, NextResponse } from "next/server";
import { getSiwsWallet } from "@/lib/siws-server";
import { limiterFor } from "@/lib/rate-limit-policy";
import { uploadJsonToBackend } from "@/lib/backend-metadata";

export async function POST(req: NextRequest) {
  const creator = getSiwsWallet(req.headers.get("authorization"));
  if (!creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!limiterFor("metadata:upload-json")(creator)) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "JSON object body required" }, { status: 400 });
  }

  const MAX_BYTES = 50 * 1024;
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
