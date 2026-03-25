export type { ApiOrder, ApiToken, ApiCollection, ApiOrdersQuery, OrderStatus } from "@medialane/sdk";

/** A counter-offer order — an ERC721 listing linked to an original buyer bid. */
export interface CounterOfferOrder {
  id: string;
  chain: string;
  orderHash: string;
  offerer: string;
  offerItemType: string;
  offerToken: string;
  offerIdentifier: string;
  offerStartAmount: string;
  offerEndAmount: string;
  considerationItemType: string;
  considerationToken: string;
  considerationIdentifier: string;
  considerationStartAmount: string;
  considerationEndAmount: string;
  considerationRecipient: string;
  startTime: string;
  endTime: string;
  status: string;
  nftContract: string | null;
  nftTokenId: string | null;
  priceRaw: string | null;
  priceFormatted: string | null;
  currencySymbol: string | null;
  parentOrderHash: string | null;
  createdTxHash: string | null;
  token: { name: string | null; image: string | null; description: string | null } | null;
}

export interface WalletCredentials {
  publicKey: string;
  encryptedPrivateKey: string;
}

export interface AssetCardProps {
  contractAddress: string;
  tokenId: string;
  name: string | null;
  image: string | null;
  owner?: string;
  floorPrice?: string;
  currency?: string;
  onBuy?: () => void;
}

export interface CartItem {
  orderHash: string;
  nftContract: string;
  nftTokenId: string;
  name: string;
  image: string;
  price: string;
  currency: string;
  currencyDecimals: number;
  offerer: string;
  considerationToken: string;
  considerationAmount: string;
}
