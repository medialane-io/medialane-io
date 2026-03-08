/**
 * POST /api/pinata/image
 *
 * Uploads a single image file to Pinata/IPFS.
 * Requires an active Clerk session.
 *
 * Accepts multipart/form-data:
 *   file  File  — image (JPG/PNG/GIF/SVG/WebP, max 10 MB)
 *
 * Response: { imageUri: "ipfs://...", cid: string }
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

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
]);

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
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 });
  }

  try {
    const pinata = getPinata();
    const upload = await pinata.upload.public.file(file);
    const imageUri = `ipfs://${upload.cid}`;
    return NextResponse.json({ imageUri, cid: upload.cid });
  } catch (err: any) {
    const message = err?.message ?? "Upload failed";
    console.error("[pinata/image] upload failed:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
