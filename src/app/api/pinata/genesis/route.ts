import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud",
});

const DEFAULT_NAME = "Medialane Genesis";
const DEFAULT_DESCRIPTION = "This commemorative token marks the official launch of Medialane on Starknet. ";
/**
 * POST /api/pinata/genesis
 *
 * Admin-only endpoint for pre-baking genesis NFT metadata before launch.
 * Call once, then set NEXT_PUBLIC_GENESIS_NFT_URI to the returned `uri`.
 *
 * Auth: Authorization: Bearer {ADMIN_SECRET}
 * Body: multipart/form-data
 *   - image (File, required) — genesis artwork
 *   - name  (string, optional)
 *   - description (string, optional)
 */
export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const name = (formData.get("name") as string | null) ?? DEFAULT_NAME;
    const description = (formData.get("description") as string | null) ?? DEFAULT_DESCRIPTION;

    if (!imageFile) {
      return NextResponse.json({ error: "image field is required" }, { status: 400 });
    }

    // 1. Upload image
    const imageUpload = await pinata.upload.public.file(imageFile);
    const imageUri = `ipfs://${imageUpload.cid}`;

    // 2. Build genesis metadata
    const metadata = {
      name,
      description,
      image: imageUri,
      external_url: "https://medialane.io",
      attributes: [
        { trait_type: "Platform", value: "Medialane" },
        { trait_type: "Network", value: "Starknet Mainnet" },
        { trait_type: "Edition", value: "Genesis" },
        { trait_type: "Type", value: "Commemorative" },
        { trait_type: "License", value: "All Rights Reserved" },
        { trait_type: "Status", value: "Limited" },
      ],
    };

    // 3. Upload metadata JSON
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const metadataFile = new File([metadataBlob], "metadata.json", { type: "application/json" });
    const metadataUpload = await pinata.upload.public.file(metadataFile);

    return NextResponse.json({
      uri: `ipfs://${metadataUpload.cid}`,
      imageUri,
      cid: metadataUpload.cid,
    });
  } catch (err: any) {
    console.error("[/api/pinata/genesis]", err);
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
