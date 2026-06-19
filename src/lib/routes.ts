import type { Chain } from "@medialane/sdk";

/** Chains that resolve in a URL today. Extend when a second chain is displayable. */
export const SUPPORTED_URL_CHAINS = ["STARKNET"] as const satisfies readonly Chain[];

/** Chain enum → lowercase URL slug. The ONLY place the slug literal is produced. */
export function chainSlug(chain: Chain): string {
  return chain.toLowerCase();
}

/** URL slug → Chain enum, or null for an unknown/unsupported slug (caller 404s). */
export function chainFromSlug(slug: string): Chain | null {
  const upper = slug.toUpperCase() as Chain;
  return (SUPPORTED_URL_CHAINS as readonly Chain[]).includes(upper) ? upper : null;
}

export function assetHref(chain: Chain, contract: string, tokenId: string | number): string {
  return `/asset/${chainSlug(chain)}/${contract}/${tokenId}`;
}

export function collectionHref(chain: Chain, contract: string): string {
  return `/collections/${chainSlug(chain)}/${contract}`;
}

export function coinHref(chain: Chain, address: string): string {
  return `/coins/${chainSlug(chain)}/${address}`;
}
