

import { NextRequest, NextResponse } from "next/server";
import { buildAssetMetadata } from "@/lib/asset-metadata";
import { getSiwsWallet } from "@/lib/siws-server";
import { uploadFileToBackend, uploadJsonToBackend } from "@/lib/backend-metadata";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/webp",
]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEMPLATE_FIELDS = 30;

export async function POST(req: NextRequest) {

  const creator = getSiwsWallet(req.headers.get("authorization"));
  if (!creator) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const name = (formData.get("name") as string | null)?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const description = (formData.get("description") as string | null) ?? "";

    const rawExternalUrl = (formData.get("external_url") as string | null)?.trim() ?? "";
    const externalUrl = rawExternalUrl || "https://medialane.io";
    if (rawExternalUrl && !/^https?:\/\//i.test(rawExternalUrl)) {
      return NextResponse.json(
        { error: "external_url must be a valid http or https URL" },
        { status: 400 }
      );
    }

    const ipType = formData.get("ipType") as string | null;
    const licenseType = formData.get("licenseType") as string | null;
    const commercialUse = formData.get("commercialUse") as string | null;
    const derivatives = formData.get("derivatives") as string | null;
    const attribution = formData.get("attribution") as string | null;
    const geographicScope = formData.get("geographicScope") as string | null;
    const aiPolicy = formData.get("aiPolicy") as string | null;
    const rawRoyalty = formData.get("royalty") as string | null;
    const edition = formData.get("edition") as string | null;

    let imageUri: string | null = (formData.get("imageUri") as string | null) || null;

    if (imageUri && !imageUri.startsWith("ipfs://")) {
      return NextResponse.json(
        { error: "imageUri must be an ipfs:// URI" },
        { status: 400 }
      );
    }

    if (!imageUri) {

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
        const imageUpload = await uploadFileToBackend(imageFile);
        imageUri = imageUpload.uri;
      }
    }

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

    const metadataUpload = await uploadJsonToBackend(metadata);

    return NextResponse.json({
      uri: metadataUpload.uri,
      imageUri,
      cid: metadataUpload.cid,
    });
  } catch (err: unknown) {
    console.error("[/api/pinata]", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
