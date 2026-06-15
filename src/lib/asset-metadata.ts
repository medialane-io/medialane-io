/**
 * Shared OpenSea-ERC721 + Berne-Convention metadata builder.
 *
 * Single source of truth for how a Medialane asset's metadata JSON is shaped.
 * Used by both the single-asset upload route (`/api/pinata`) and the Collection
 * Drop directory-pin route (`/api/pinata/directory`) so a drop token is
 * byte-for-byte the same standard as any other IP asset (architecture 01 §I, 04).
 *
 * Pure function — no Pinata calls, no FormData. Server-safe.
 */

export type AssetAttribute = { trait_type: string; value: string };

export interface AssetMetadata {
  name: string;
  description: string;
  image: string | null;
  external_url: string;
  attributes: AssetAttribute[];
}

export interface BuildAssetMetadataInput {
  name: string;
  description?: string | null;
  externalUrl?: string | null;
  imageUri?: string | null;
  creator?: string | null;
  ipType?: string | null;
  licenseType?: string | null;
  commercialUse?: string | null;
  derivatives?: string | null;
  attribution?: string | null;
  geographicScope?: string | null;
  aiPolicy?: string | null;
  royalty?: string | null;
  edition?: string | null;
  /** Already-extracted `tmpl_*` template/custom traits (reserved names are filtered here). */
  templateTraits?: { traitType: string; value: string }[];
  /** ISO date (YYYY-MM-DD) stamped as the Berne registration trait. Defaults to today. */
  registrationDate?: string;
}

// Trait names this builder owns — must not be overridden by template traits.
export const RESERVED_TRAITS = new Set([
  "Creator", "IP Type", "License", "Commercial Use", "Derivatives",
  "Attribution", "Territory", "AI Policy", "Royalty", "Edition",
  "Standard", "Registration",
]);
const RESERVED_TRAITS_NORMALIZED = new Set([...RESERVED_TRAITS].map((t) => t.toLowerCase()));

export function buildAssetMetadata(input: BuildAssetMetadataInput): AssetMetadata {
  const attributes: AssetAttribute[] = [];

  if (input.creator) attributes.push({ trait_type: "Creator", value: input.creator });
  if (input.ipType) attributes.push({ trait_type: "IP Type", value: input.ipType });
  if (input.licenseType) attributes.push({ trait_type: "License", value: input.licenseType });
  if (input.commercialUse) attributes.push({ trait_type: "Commercial Use", value: input.commercialUse });
  if (input.derivatives) attributes.push({ trait_type: "Derivatives", value: input.derivatives });
  if (input.attribution) attributes.push({ trait_type: "Attribution", value: input.attribution });
  if (input.geographicScope) attributes.push({ trait_type: "Territory", value: input.geographicScope });
  if (input.aiPolicy) attributes.push({ trait_type: "AI Policy", value: input.aiPolicy });

  if (input.royalty) {
    const num = parseFloat(String(input.royalty).replace("%", ""));
    if (!isNaN(num) && num > 0) attributes.push({ trait_type: "Royalty", value: `${num}%` });
  }

  if (input.edition) attributes.push({ trait_type: "Edition", value: input.edition });

  for (const t of input.templateTraits ?? []) {
    const traitType = t.traitType?.trim() ?? "";
    const traitValue = String(t.value ?? "").trim();
    if (!traitType || !traitValue || RESERVED_TRAITS_NORMALIZED.has(traitType.toLowerCase())) continue;
    if (traitType.length > 64 || traitValue.length > 512) continue;
    attributes.push({ trait_type: traitType, value: traitValue });
  }

  // Berne Convention marker — only when licensing data is provided.
  if (input.licenseType) {
    attributes.push({ trait_type: "Standard", value: "Berne Convention" });
    attributes.push({
      trait_type: "Registration",
      value: input.registrationDate ?? new Date().toISOString().split("T")[0],
    });
  }

  return {
    name: input.name,
    description: input.description ?? "",
    image: input.imageUri ?? null,
    external_url: input.externalUrl || "https://medialane.io",
    attributes,
  };
}
