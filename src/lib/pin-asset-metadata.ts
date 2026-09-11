"use client";

import { buildAssetMetadata, type BuildAssetMetadataInput } from "@medialane/sdk";
import { uploadImageToIpfs } from "@/lib/upload-image";

export interface PinAssetMetadataInput extends Omit<BuildAssetMetadataInput, "registrationDate"> {
  imageFile?: File | null;
}

export interface PinnedAsset {
  uri: string;
  imageUri: string | null;
  cid: string;
}

export async function pinAssetMetadata(input: PinAssetMetadataInput): Promise<PinnedAsset> {
  const { imageFile, ...fields } = input;

  let imageUri = fields.imageUri ?? null;
  if (!imageUri && imageFile && imageFile.size > 0) {
    imageUri = await uploadImageToIpfs(imageFile);
  }

  const metadata = buildAssetMetadata({
    ...fields,
    imageUri,
    externalUrl: fields.externalUrl || "https://medialane.io",
  });

  const res = await fetch("/api/proxy/v1/metadata/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  const body = (await res.json().catch(() => ({}))) as {
    data?: { cid?: string; url?: string };
    error?: string;
  };
  if (!res.ok || !body.data?.url || !body.data.cid) {
    throw new Error(body.error ?? "Metadata upload failed");
  }

  return { uri: body.data.url, imageUri, cid: body.data.cid };
}
