import { useCollectionProfile as useCollectionProfileBase, useCreatorProfile as useCreatorProfileBase } from "@medialane/ui";

export function useCollectionProfile(contractAddress: string | undefined) {
  return useCollectionProfileBase(contractAddress);
}

export function useCreatorProfile(walletAddress: string | undefined) {
  return useCreatorProfileBase(walletAddress);
}
