export type TokenStandard = "ERC721" | "ERC1155" | "UNKNOWN";

export function isErc1155Standard(standard: string | null | undefined): standard is "ERC1155" {
  return standard === "ERC1155";
}

function isKnownTokenStandard(
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

/** The NFT side of an order: the offer for a listing, the consideration for an offer. */
export function orderNftStandard(order: { offer: { itemType: string }; consideration: { itemType: string } }): string {
  return order.offer.itemType === "ERC20" ? order.consideration.itemType : order.offer.itemType;
}
