// Local types for admin backend API responses.
// These endpoints are internal and not exported by @medialane/sdk.

export interface AdminCollectionClaimRecord {
  id: string;
  contractAddress: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  verificationMethod: "ONCHAIN" | "SIGNATURE" | "MANUAL";
  claimantAddress?: string;
  claimantEmail?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface AdminUsernameClaimRecord {
  id: string;
  username: string;
  walletAddress: string;
  status: "PENDING" | "APPROVED" | "AUTO_APPROVED" | "REJECTED";
  adminNotes?: string;
  createdAt: string;
}

export interface AdminCreatorRecord {
  id: string;
  username: string;
  walletAddress: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface AdminCollectionRecord {
  id: string;
  name?: string;
  contractAddress: string;
  source: string;
  metadataStatus: "FETCHED" | "PENDING" | "FETCHING" | "FAILED";
  isKnown: boolean;
  isHidden: boolean;
  claimedBy?: string;
}
