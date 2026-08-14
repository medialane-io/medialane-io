import type { ApiToken } from "@medialane/sdk";

export interface VaultTeaserItem {
  key: string;
  href: string;
  name: string;
  image: string | null;
  ipType: string | null;
  fallbackId: string;
}

export function pickVaultTeaserItems(tokens: ApiToken[], limit: number): VaultTeaserItem[] {
  return tokens.slice(0, limit).map((token) => ({
    key: `${token.contractAddress}-${token.tokenId}`,
    href: `/asset/starknet/${token.contractAddress}/${token.tokenId}`,
    name: token.metadata.name ?? `#${token.tokenId}`,
    image: token.metadata.image,
    ipType: token.metadata.ipType,
    fallbackId: token.tokenId,
  }));
}
