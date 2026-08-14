"use client";

import { uploadImageToIpfs } from "@/lib/upload-image";
import { withSiwsAuth } from "@/lib/pinata-fetch";

export interface SharedLicense {
  ipType: string;
  licenseType: string;
  commercialUse?: string;
  derivatives?: string;
  attribution?: string;
  geographicScope?: string;
  aiPolicy?: string;
  royalty: number;

  templateTraits?: { traitType: string; value: string }[];
}

export interface DropItemInput {
  imageFile: File;
  name: string;
  description?: string;
}

export interface CollectionCover {
  name: string;
  description?: string;
  image?: string | null;
}

export interface BuiltSet {
  baseUri: string;
  count: number;
}

export async function buildDropSet(
  items: DropItemInput[],
  license: SharedLicense,
  collection: CollectionCover,
  siwsToken: string
): Promise<BuiltSet> {
  if (items.length === 0) throw new Error("Add at least one item");

  const fields = [];
  for (const item of items) {
    const imageUri = await uploadImageToIpfs(item.imageFile, siwsToken);
    fields.push({
      name: item.name,
      description: item.description ?? "",
      imageUri,
      ipType: license.ipType,
      licenseType: license.licenseType,
      commercialUse: license.commercialUse,
      derivatives: license.derivatives,
      attribution: license.attribution,
      geographicScope: license.geographicScope,
      aiPolicy: license.aiPolicy,
      royalty: String(license.royalty),
      templateTraits: license.templateTraits,
    });
  }

  const res = await fetch("/api/pinata/directory", withSiwsAuth(siwsToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: fields, collection }),
  }));
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Directory pin failed");
  }
  const json = (await res.json()) as { baseUri: string };
  return { baseUri: json.baseUri, count: items.length };
}
