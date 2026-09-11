"use client";

import { uploadImageToIpfs } from "@/lib/upload-image";
import { buildAssetMetadata } from "@medialane/sdk";

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
  creator: string
): Promise<BuiltSet> {
  if (items.length === 0) throw new Error("Add at least one item");

  const fields = [];
  for (const item of items) {
    const imageUri = await uploadImageToIpfs(item.imageFile);
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

  const registrationDate = new Date().toISOString().split("T")[0];
  const files: { name: string; content: unknown }[] = fields.map((item, i) => ({
    name: String(i + 1),
    content: buildAssetMetadata({ ...item, creator, registrationDate }),
  }));
  files.push({
    name: "collection.json",
    content: {
      name: collection.name ?? "",
      description: collection.description ?? "",
      image: collection.image ?? null,
    },
  });

  const res = await fetch("/api/proxy/v1/metadata/upload-directory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: { baseUri?: string };
    error?: string;
  };
  if (!res.ok || !json.data?.baseUri) {
    throw new Error(json.error ?? "Directory pin failed");
  }
  return { baseUri: json.data.baseUri, count: items.length };
}
