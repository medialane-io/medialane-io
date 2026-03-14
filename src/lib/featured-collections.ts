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
  // Add real collection addresses below once available.
  // Example entry (replace with real addresses):
  // {
  //   contractAddress: "0x0000000000000000000000000000000000000000000000000000000000000001",
  //   tagline: "The genesis collection on Medialane",
  // },
];
