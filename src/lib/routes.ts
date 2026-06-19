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

/** Nullish contract/token/address values coerce to "" — matches the pre-helper
 *  template-literal behavior (an absent id was never a valid link anyway) and
 *  keeps the ~50 call-sites free of artificial null guards. ApiOrder types
 *  nftContract/nftTokenId as `string | null`, so callers legitimately pass these. */
type Idish = string | number | null | undefined;
const seg = (v: Idish): string => (v == null ? "" : String(v));

export function assetHref(chain: Chain, contract: Idish, tokenId: Idish): string {
  return `/asset/${chainSlug(chain)}/${seg(contract)}/${seg(tokenId)}`;
}

export function collectionHref(chain: Chain, contract: Idish): string {
  return `/collections/${chainSlug(chain)}/${seg(contract)}`;
}

export function coinHref(chain: Chain, address: Idish): string {
  return `/coins/${chainSlug(chain)}/${seg(address)}`;
}
