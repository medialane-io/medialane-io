/**
 * POST /api/pinata
 *
 * Server-side digital asset upload endpoint.
 * Requires an active Clerk session — prevents unauthorized Pinata quota usage.
 *
 * Accepts multipart/form-data:
 *   file            File?    — cover image (JPG/PNG/GIF/SVG/WebP, max 10 MB)
 *   name            string   — asset name (required)
 *   description     string?  — asset description
 *   external_url    string?  — canonical URL (must be http/https if provided)
 *   imageUri        string?  — pre-uploaded ipfs:// URI (must start with ipfs://)
 *   ipType          string?  — e.g. "Art", "Music", "Video", …
 *   licenseType     string?  — e.g. "CC BY", "All Rights Reserved", …
 *   commercialUse   string?  — "Yes" | "No"
 *   derivatives     string?  — "Allowed" | "Not Allowed" | "Share-Alike"
 *   attribution     string?  — "Required" | "Not Required"
 *   geographicScope string?  — e.g. "Worldwide"
 *   aiPolicy        string?  — "Allowed" | "Not Allowed" | "Training Only"
 *   royalty         string?  — "0%"–"50%" or bare number
 *   edition         string?  — e.g. "Genesis" (legacy genesis-mint field)
 *   tmpl_{key}      string?  — suggested template field or custom trait
 *                              (e.g. "tmpl_Artist", "tmpl_Background").
 *                              Max 30 fields. Reserved trait names are silently ignored.
 *
 * Note: "creator" is NOT accepted from the client — it is derived server-side from
 * the authenticated Clerk session to prevent impersonation.
 *
 * Response: { uri: "ipfs://...", imageUri: "ipfs://..." | null, cid: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { PinataSDK } from "pinata";
import { buildAssetMetadata } from "@/lib/asset-metadata";

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
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB (server-side fallback guard)
const MAX_TEMPLATE_FIELDS = 30;

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Derive creator wallet server-side from Clerk — never trust client-supplied value.
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const creator = (clerkUser.publicMetadata?.publicKey as string | undefined) ?? null;

  try {
    const formData = await req.formData();

    // ── Core fields ───────────────────────────────────────────────────────────
    const name = (formData.get("name") as string | null)?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const description = (formData.get("description") as string | null) ?? "";

    // external_url — must be http/https if provided
    const rawExternalUrl = (formData.get("external_url") as string | null)?.trim() ?? "";
    const externalUrl = rawExternalUrl || "https://medialane.io";
    if (rawExternalUrl && !/^https?:\/\//i.test(rawExternalUrl)) {
      return NextResponse.json(
        { error: "external_url must be a valid http or https URL" },
        { status: 400 }
      );
    }

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
    // Preferred path: client uploaded image directly via signed URL and passes
    // back the resulting ipfs:// URI. No file bytes flow through this route.
    let imageUri: string | null = (formData.get("imageUri") as string | null) || null;

    // imageUri must be an ipfs:// URI — reject arbitrary URLs to prevent metadata poisoning.
    if (imageUri && !imageUri.startsWith("ipfs://")) {
      return NextResponse.json(
        { error: "imageUri must be an ipfs:// URI" },
        { status: 400 }
      );
    }

    if (!imageUri) {
      // Fallback: file sent through this route (subject to body size limits)
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
            { error: "Image exceeds 10 MB limit." },
            { status: 400 }
          );
        }
        const imageUpload = await pinata.upload.public.file(imageFile);
        imageUri = `ipfs://${imageUpload.cid}`;
      }
    }

    // ── Build OpenSea ERC-721 + Berne Convention compatible metadata ───────────
    // Suggested template fields and creator-defined traits (tmpl_*). Max 30 fields;
    // reserved-name + length filtering happens inside buildAssetMetadata.
    const tmplEntries = [...formData.entries()].filter(
      ([k]) => typeof k === "string" && k.startsWith("tmpl_")
    );
    if (tmplEntries.length > MAX_TEMPLATE_FIELDS) {
      return NextResponse.json({ error: `Too many template fields (max ${MAX_TEMPLATE_FIELDS})` }, { status: 400 });
    }
    const templateTraits = tmplEntries.map(([key, value]) => ({
      traitType: (key as string).slice(5),
      value: String(value),
    }));

    const metadata = buildAssetMetadata({
      name,
      description,
      externalUrl,
      imageUri,
      creator,
      ipType,
      licenseType,
      commercialUse,
      derivatives,
      attribution,
      geographicScope,
      aiPolicy,
      royalty: rawRoyalty,
      edition,
      templateTraits,
    });

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
