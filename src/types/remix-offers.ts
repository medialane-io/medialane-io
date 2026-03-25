export const OPEN_LICENSES = ["CC0", "CC BY", "CC BY-SA", "CC BY-NC"] as const;

export type RemixOfferStatus =
  | "PENDING"
  | "AUTO_PENDING"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED"
  | "EXPIRED"
  | "SELF_MINTED";

export interface RemixOffer {
  id: string;
  status: RemixOfferStatus;
  originalContract: string;
  originalTokenId: string;
  creatorAddress: string;
  requesterAddress: string | null;
  message?: string | null;
  proposedPrice?: string;
  proposedCurrency?: string;
  licenseType: string;
  commercial: boolean;
  derivatives: boolean;
  royaltyPct: number | null;
  approvedCollection: string | null;
  remixContract: string | null;
  remixTokenId: string | null;
  orderHash: string | null;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
}

export interface RemixOfferListResponse {
  data: RemixOffer[];
  meta: { page: number; limit: number; total: number };
}

export interface PublicRemix {
  id: string;
  remixContract: string | null;
  remixTokenId: string | null;
  licenseType: string;
  commercial: boolean;
  derivatives: boolean;
  createdAt: string;
}
