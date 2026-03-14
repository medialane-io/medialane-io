export interface FeaturedCollection {
  /** Starknet contract address (0x-padded 64-char hex) */
  contractAddress: string;
  /** Optional display name override (falls back to on-chain name) */
  nameOverride?: string;
  /** Optional hero image URL override (falls back to collection.image) */
  imageOverride?: string;
  /** Optional tagline shown in the hero slide */
  tagline?: string;
}

/**
 * Manually curated list of featured collections for the homepage hero slider.
 * Add/remove entries here to control what appears. Order determines slide order.
 * Contract addresses must be 0x-padded 64-char hex strings.
 */
export const FEATURED_COLLECTIONS: FeaturedCollection[] = [
  {
    contractAddress: "0x02c215c0925d5e85224a9d74ef4c09ed4d5c168f8a251d330aca410b62569252",
    tagline: "New Yorker",
  },
{
    contractAddress: "0x00b618e6abbfe1131d31bcd5d8e57c333adae57b0a271289e39d6e4091c0160b",
    tagline: "Kalamaha Rock Soundtrack",
  },
  {
    contractAddress: "0x05dfc757748a8c2dee80dfaf2339f95c2788734176f6c617c6114c85664f8d38",
    tagline: "South Korea Photography",
  }

];
