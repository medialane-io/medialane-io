import type { SealedOwner } from "@medialane/sdk/starknet";
import { mediaWallet } from "./client";

export const getOwners = (address: string) => mediaWallet.getOwners(address);
export const isOwnerOf = (accountAddress: string, devicePubkey: string) =>
  mediaWallet.isOwnerOf(accountAddress, devicePubkey);
export const removeDevice = (sealed: SealedOwner, ownerGuid: string) => mediaWallet.removeDevice(sealed, ownerGuid);
