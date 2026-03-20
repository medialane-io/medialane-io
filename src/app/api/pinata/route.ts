/**
 * POST /api/pinata
 *
 * Server-side IP asset upload endpoint.
 * Requires an active Clerk session — prevents unauthorized Pinata quota usage.
 *
 * Accepts multipart/form-data:
 *   file            File?    — cover image (JPG/PNG/GIF/SVG/WebP, max 10 MB)
 *   name            string   — asset name (required)
 *   description     string?  — asset description
 *   external_url    string?  — canonical URL (default: https://medialane.io)
 *   creator         string?  — creator wallet address (stored as attribute)
 *   ipType          string?  — e.g. "Art", "Music", "Video", …
 *   licenseType     string?  — e.g. "CC BY", "All Rights Reserved", …
 *   commercialUse   string?  — "Yes" | "No"
 *   derivatives     string?  — "Allowed" | "Not Allowed" | "Share-Alike"
 *   attribution     string?  — "Required" | "Not Required"
 *   geographicScope string?  — e.g. "Worldwide"
 *   aiPolicy        string?  — "Allowed" | "Not Allowed" | "Training Only"
 *   royalty         string?  — "0%"–"50%" or bare number
 *   edition         string?  — e.g. "Genesis" (legacy genesis-mint field)
 *   tmpl_{key}      string?  — template field for selected IP type (e.g. "tmpl_Artist", "tmpl_Spotify URL")
 *                              Any number of these. Stored as standard attributes with trait_type = key.
 *
 * Response: { uri: "ipfs://...", imageUri: "ipfs://..." | null, cid: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud",
});

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
]);
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB — Vercel serverless payload limit

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    // ── Core fields ───────────────────────────────────────────────────────────
    const name = (formData.get("name") as string | null)?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const description = (formData.get("description") as string | null) ?? "";
    const externalUrl = (formData.get("external_url") as string | null) ?? "https://medialane.io";
    const creator = (formData.get("creator") as string | null) ?? null;

    // ── IP / licensing fields ─────────────────────────────────────────────────
    const ipType = formData.get("ipType") as string | null;
    const licenseType = formData.get("licenseType") as string | null;
    const commercialUse = formData.get("commercialUse") as string | null;
    const derivatives = formData.get("derivatives") as string | null;
    const attribution = formData.get("attribution") as string | null;
    const geographicScope = formData.get("geographicScope") as string | null;
    const aiPolicy = formData.get("aiPolicy") as string | null;
    const rawRoyalty = formData.get("royalty") as string | null;
    const edition = formData.get("edition") as string | null; // genesis-mint compat

    // ── Image upload ──────────────────────────────────────────────────────────
    let imageUri: string | null = null;
    const imageFile = formData.get("file") as File | null;

    if (imageFile && imageFile.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
        return NextResponse.json(
          { error: "Unsupported image format. Use JPG, PNG, GIF, SVG, or WebP." },
          { status: 400 }
        );
      }
      if (imageFile.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "Image exceeds 4 MB limit." },
          { status: 400 }
        );
      }
      const imageUpload = await pinata.upload.public.file(imageFile);
      imageUri = `ipfs://${imageUpload.cid}`;
    }

    // ── Build OpenSea ERC-721 + Berne Convention compatible metadata ───────────
    type Attr = { trait_type: string; value: string };
    const attributes: Attr[] = [
      { trait_type: "Platform", value: "Medialane" },
      { trait_type: "Network", value: "Starknet Mainnet" },
    ];

    if (creator) attributes.push({ trait_type: "Creator", value: creator });
    if (ipType) attributes.push({ trait_type: "IP Type", value: ipType });
    if (licenseType) attributes.push({ trait_type: "License", value: licenseType });
    if (commercialUse) attributes.push({ trait_type: "Commercial Use", value: commercialUse });
    if (derivatives) attributes.push({ trait_type: "Derivatives", value: derivatives });
    if (attribution) attributes.push({ trait_type: "Attribution", value: attribution });
    if (geographicScope) attributes.push({ trait_type: "Territory", value: geographicScope });
    if (aiPolicy) attributes.push({ trait_type: "AI Policy", value: aiPolicy });

    // Royalty — normalise to "X%" format
    if (rawRoyalty) {
      const num = parseFloat(rawRoyalty.replace("%", ""));
      if (!isNaN(num) && num > 0) {
        attributes.push({ trait_type: "Royalty", value: `${num}%` });
      }
    }

    // Edition (legacy genesis-mint field)
    if (edition) attributes.push({ trait_type: "Edition", value: edition });

    // Template-specific fields — stored as standard NFT attributes
    for (const [key, value] of formData.entries()) {
      if (typeof key === "string" && key.startsWith("tmpl_") && value) {
        const traitType = key.slice(5); // strip "tmpl_" prefix → exact trait_type
        attributes.push({ trait_type: traitType, value: String(value) });
      }
    }

    // Berne Convention marker — only when licensing data is provided
    if (licenseType) {
      attributes.push({ trait_type: "Standard", value: "Berne Convention" });
      attributes.push({
        trait_type: "Registration",
        value: new Date().toISOString().split("T")[0],
      });
    }

    // ── Upload metadata JSON ───────────────────────────────────────────────────
    const metadata = {
      name,
      description,
      image: imageUri,
      external_url: externalUrl,
      attributes,
    };

    const metadataUpload = await pinata.upload.public.json(metadata);

    return NextResponse.json({
      uri: `ipfs://${metadataUpload.cid}`,
      imageUri,
      cid: metadataUpload.cid,
    });
  } catch (err: unknown) {
    console.error("[/api/pinata]", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
