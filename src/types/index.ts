export type { ApiOrder, ApiToken, ApiCollection, ApiOrdersQuery, OrderStatus } from "@medialane/sdk";

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
