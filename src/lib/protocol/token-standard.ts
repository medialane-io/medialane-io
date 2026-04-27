export type TokenStandard = "ERC721" | "ERC1155" | "UNKNOWN";

export function isErc1155Standard(standard: string | null | undefined): standard is "ERC1155" {
  return standard === "ERC1155";
}

export function isKnownTokenStandard(
  standard: string | null | undefined
): standard is Exclude<TokenStandard, "UNKNOWN"> {
  return standard === "ERC721" || standard === "ERC1155";
}

export function resolveTokenStandard(
  preferred?: string | null,
  fallback?: string | null
): TokenStandard {
  if (isKnownTokenStandard(preferred)) return preferred;
  if (isKnownTokenStandard(fallback)) return fallback;
  return "UNKNOWN";
}
