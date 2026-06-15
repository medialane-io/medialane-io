"use client";

import { uploadImageToIpfs } from "@/lib/upload-image";

// License/IP fields shared across every item in the drop (the "shared defaults").
// Derived from the chosen LICENSE_TYPES preset + IP type at create time.
export interface SharedLicense {
  ipType: string;
  licenseType: string;
  commercialUse?: string;
  derivatives?: string;
  attribution?: string;
  geographicScope?: string;
  aiPolicy?: string;
  royalty: number;
}

export interface DropItemInput {
  imageFile: File;
  name: string;
  description?: string;
}

export interface BuiltSet {
  baseUri: string; // ipfs://<folderCID>/
  count: number;
}

// Uploads every item image to IPFS, then pins one full OpenSea+Berne metadata JSON per item
// as an IPFS directory. tokenId N = items[N-1]. Returns the base_uri for create_drop so
// token_uri(N) resolves to a unique, fully-licensed asset.
export async function buildDropSet(items: DropItemInput[], license: SharedLicense): Promise<BuiltSet> {
  if (items.length === 0) throw new Error("Add at least one item");

  // Upload each image sequentially (small curated sets; stays under Pinata rate limits).
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
    });
  }

  const res = await fetch("/api/pinata/directory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: fields }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Directory pin failed");
  }
  const json = (await res.json()) as { baseUri: string };
  return { baseUri: json.baseUri, count: items.length };
}
