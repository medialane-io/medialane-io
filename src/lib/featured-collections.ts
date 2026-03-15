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
    contractAddress: "0x002ba821c3539ca14c87c9db427aa9663407a170faffaa9c53b3d099e65a4d24",
    tagline: "Se faltar a paz, Minas Gerais",
  },
  {
    contractAddress: "0x05431a0124148aa39078f0f85aa1d01976c40e9aa66e24c0297fe77d8f2e871d",
    tagline: "Photographic journey through time",
  }

];
