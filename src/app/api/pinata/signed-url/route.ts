

import { NextRequest, NextResponse } from "next/server";
import { getSiwsWallet } from "@/lib/siws-server";
import { getBackendSignedUrl } from "@/lib/backend-metadata";

export async function POST(req: NextRequest) {
  if (!getSiwsWallet(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { kind?: string };
  const kind: "image" | "document" = body.kind === "document" ? "document" : "image";

  try {
    const url = await getBackendSignedUrl(kind);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[/api/pinata/signed-url]", err);
    const message = err instanceof Error ? err.message : "Failed to create upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
