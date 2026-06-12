/**
 * POST /api/pinata/file
 *
 * Uploads a single document file to Pinata/IPFS (IP-type document evidence —
 * the immutable, timestamped copy of the work).
 * Requires an active Clerk session.
 *
 * Accepts multipart/form-data:
 *   file  File  — PDF/DOC/DOCX/TXT/MD/RTF/ODT, max 20 MB
 *
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

// Validate by extension — browsers report inconsistent MIME types for
// .md/.rtf/.odt (often empty or text/plain), so the extension is the
// reliable signal here. Size cap is the real abuse guard.
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "txt", "md", "rtf", "odt"]);

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Unsupported document type — use PDF, DOC, DOCX, TXT, MD, RTF or ODT" },
      { status: 400 },
    );
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Document must be under 20 MB" }, { status: 400 });
  }

  try {
    const pinata = getPinata();
    const upload = await pinata.upload.public.file(file);
    return NextResponse.json({ uri: `ipfs://${upload.cid}`, cid: upload.cid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[pinata/file] upload failed:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
